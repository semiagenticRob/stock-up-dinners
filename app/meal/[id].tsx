import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useInventory } from '@/hooks/useInventory';
import { useMeals } from '@/hooks/useMeals';
import { useCookLog } from '@/hooks/useCookLog';
import { useIngredientMap } from '@/hooks/useIngredients';
import {
  Meal,
  MealIngredient,
  MealStep,
  InventoryItemWithIngredient,
} from '@/types/database';
import { formatQuantity, scaleForServings } from '@/utils/units';

type ScreenMode = 'detail' | 'validate' | 'cooking';

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { meals, mealIngredients } = useMeals();
  const { items: inventory, decrementForMeal, setQuantity: setInvQuantity } = useInventory();
  const { ingredientMap } = useIngredientMap();
  const { logCook } = useCookLog();

  const [servings, setServings] = useState(4);
  const [mode, setMode] = useState<ScreenMode>('detail');
  const [validatedItems, setValidatedItems] = useState<Map<string, number>>(new Map());
  const [currentStep, setCurrentStep] = useState(0);

  const meal = meals.find((m) => m.id === id);
  const ingredients = mealIngredients.filter((mi) => mi.meal_id === id);

  // Build inventory lookup
  const invLookup = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      map.set(item.ingredient_id, item.quantity);
    }
    return map;
  }, [inventory]);

  // Keep screen awake in cooking mode
  useEffect(() => {
    if (mode === 'cooking') {
      activateKeepAwakeAsync('cooking').catch(() => {});
    }
    return () => {
      deactivateKeepAwake('cooking');
    };
  }, [mode]);

  if (!meal) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Meal not found</Text>
      </View>
    );
  }

  const steps: MealStep[] = meal.instructions as MealStep[];

  // === DETAIL MODE ===
  if (mode === 'detail') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: meal.name }} />
        <ScrollView contentContainerStyle={styles.content}>
          {/* Title + Description */}
          <Text style={[styles.mealTitle, { color: colors.text }]}>
            {meal.name}
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
            {meal.description}
          </Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <MetaBadge label="Prep" value={`${meal.prep_time_minutes}m`} colors={colors} />
            <MetaBadge label="Cook" value={`${meal.cook_time_minutes}m`} colors={colors} />
            <MetaBadge label="Total" value={`${meal.total_time_minutes}m`} colors={colors} />
            <MetaBadge label="Storage" value={meal.storage_type} colors={colors} />
          </View>

          {/* Serving selector */}
          <View style={styles.servingRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Servings
            </Text>
            <View style={styles.servingStepper}>
              <Pressable
                style={[styles.servingBtn, { borderColor: colors.border }]}
                onPress={() => setServings(Math.max(1, servings - 1))}
              >
                <Text style={styles.servingBtnText}>-</Text>
              </Pressable>
              <Text style={[styles.servingCount, { color: colors.text }]}>
                {servings}
              </Text>
              <Pressable
                style={[styles.servingBtn, { borderColor: colors.border }]}
                onPress={() => setServings(Math.min(10, servings + 1))}
              >
                <Text style={styles.servingBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Ingredients */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Ingredients
          </Text>
          {ingredients.map((mi) => {
            const ing = ingredientMap.get(mi.ingredient_id);
            if (!ing) return null;
            const needed = scaleForServings(mi.quantity_per_serving, servings);
            const have = invLookup.get(mi.ingredient_id) ?? 0;
            const hasEnough = have >= needed;

            return (
              <View
                key={mi.id}
                style={[styles.ingredientRow, { backgroundColor: colors.surface }]}
              >
                <View
                  style={[
                    styles.stockDot,
                    {
                      backgroundColor: hasEnough
                        ? Colors.brand.green500
                        : mi.is_optional
                        ? Colors.brand.yellow600
                        : Colors.brand.red600,
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ingName, { color: colors.text }]}>
                    {formatQuantity(needed, ing.default_unit)} {ing.name}
                  </Text>
                  {mi.notes && (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {mi.notes}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    color: hasEnough ? colors.textSecondary : Colors.brand.red600,
                    fontSize: 12,
                  }}
                >
                  {have > 0
                    ? `have ${formatQuantity(have, ing.default_unit)}`
                    : 'none'}
                </Text>
              </View>
            );
          })}

          {/* Instructions */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            Instructions
          </Text>
          {steps.map((step) => (
            <View key={step.step} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.step}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                {step.text}
              </Text>
            </View>
          ))}

          {/* Storage & Reheat */}
          {meal.storage_instructions && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
                Storage
              </Text>
              <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
                {meal.storage_instructions}
              </Text>
            </>
          )}
          {meal.reheat_instructions && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
                Reheat
              </Text>
              <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
                {meal.reheat_instructions}
              </Text>
            </>
          )}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
          <Pressable
            style={styles.shareButton}
            onPress={() => shareRecipe(meal, ingredients, ingredientMap, servings)}
          >
            <Text style={{ color: Colors.brand.green700, fontWeight: '600' }}>
              Share
            </Text>
          </Pressable>
          <Pressable
            style={styles.cookButton}
            onPress={() => {
              // Initialize validated items with current inventory quantities
              const validated = new Map<string, number>();
              for (const mi of ingredients) {
                validated.set(
                  mi.ingredient_id,
                  invLookup.get(mi.ingredient_id) ?? 0
                );
              }
              setValidatedItems(validated);
              setMode('validate');
            }}
          >
            <Text style={styles.cookButtonText}>Cook This</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // === VALIDATE MODE (pre-cook inventory check) ===
  if (mode === 'validate') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: 'Confirm Ingredients' }} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick check — do you have these?
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
            Tap to confirm or adjust if quantities look off.
          </Text>

          {ingredients.map((mi) => {
            const ing = ingredientMap.get(mi.ingredient_id);
            if (!ing) return null;
            const needed = scaleForServings(mi.quantity_per_serving, servings);
            const have = validatedItems.get(mi.ingredient_id) ?? 0;

            return (
              <View
                key={mi.id}
                style={[styles.validateRow, { backgroundColor: colors.surface }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ingName, { color: colors.text }]}>
                    {ing.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Need {formatQuantity(needed, ing.default_unit)} · Have{' '}
                    {formatQuantity(have, ing.default_unit)}
                  </Text>
                </View>
                <View style={styles.validateActions}>
                  <Pressable
                    style={[styles.validateCheck, have >= needed && styles.validateCheckActive]}
                    onPress={() => {
                      // Confirm — no adjustment needed
                    }}
                  >
                    <Text style={{ color: have >= needed ? '#FFF' : colors.textSecondary }}>
                      ✓
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.shareButton, { borderColor: colors.border }]}
            onPress={() => setMode('detail')}
          >
            <Text style={{ color: colors.textSecondary }}>Back</Text>
          </Pressable>
          <Pressable
            style={styles.cookButton}
            onPress={async () => {
              // Decrement inventory
              const amounts = ingredients
                .filter((mi) => !mi.is_optional)
                .map((mi) => ({
                  ingredientId: mi.ingredient_id,
                  amount: scaleForServings(mi.quantity_per_serving, servings),
                }));
              await decrementForMeal(amounts);
              await logCook(meal.id, servings);
              setCurrentStep(0);
              setMode('cooking');
            }}
          >
            <Text style={styles.cookButtonText}>Start Cooking</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // === COOKING MODE ===
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: `Cooking: ${meal.name}` }} />
      <View style={styles.cookingContainer}>
        {/* Step indicator */}
        <Text style={[styles.cookingStepLabel, { color: colors.textSecondary }]}>
          Step {currentStep + 1} of {steps.length}
        </Text>

        {/* Current step */}
        <Text style={[styles.cookingStepText, { color: colors.text }]}>
          {steps[currentStep]?.text ?? 'Done!'}
        </Text>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i <= currentStep ? Colors.brand.green700 : colors.border,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.shareButton, { borderColor: colors.border }]}
          onPress={() => {
            if (currentStep > 0) {
              setCurrentStep(currentStep - 1);
            }
          }}
          disabled={currentStep === 0}
        >
          <Text
            style={{
              color: currentStep > 0 ? colors.text : colors.textSecondary,
            }}
          >
            Previous
          </Text>
        </Pressable>
        {currentStep < steps.length - 1 ? (
          <Pressable
            style={styles.cookButton}
            onPress={() => setCurrentStep(currentStep + 1)}
          >
            <Text style={styles.cookButtonText}>Next Step</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.cookButton, { backgroundColor: Colors.brand.amber700 }]}
            onPress={() => {
              Alert.alert('Dinner is served!', 'Inventory has been updated.', [
                { text: 'Done', onPress: () => router.back() },
              ]);
            }}
          >
            <Text style={styles.cookButtonText}>Finish</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function MetaBadge({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.metaBadge, { backgroundColor: colors.surface }]}>
      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{label}</Text>
      <Text style={[{ color: colors.text, fontSize: 14, fontWeight: '600' }]}>
        {value}
      </Text>
    </View>
  );
}

async function shareRecipe(
  meal: Meal,
  ingredients: MealIngredient[],
  ingredientMap: Map<string, any>,
  servings: number
) {
  const ingLines = ingredients
    .map((mi) => {
      const ing = ingredientMap.get(mi.ingredient_id);
      if (!ing) return '';
      const qty = scaleForServings(mi.quantity_per_serving, servings);
      return `  • ${formatQuantity(qty, ing.default_unit)} ${ing.name}${mi.notes ? ` (${mi.notes})` : ''}`;
    })
    .filter(Boolean)
    .join('\n');

  const steps = (meal.instructions as MealStep[])
    .map((s) => `${s.step}. ${s.text}`)
    .join('\n');

  const text = `🍽 ${meal.name}\nServes ${servings} · ${meal.total_time_minutes} min\n\nIngredients:\n${ingLines}\n\nInstructions:\n${steps}\n\nStorage: ${meal.storage_instructions}\nReheat: ${meal.reheat_instructions}\n\n— Stock Up Dinners`;

  try {
    await Share.share({ message: text });
  } catch (error) {
    // User cancelled
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  mealTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metaBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 2,
  },
  servingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  servingStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  servingBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingBtnText: {
    fontSize: 20,
    color: Colors.brand.green700,
    fontWeight: '600',
  },
  servingCount: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    gap: 10,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ingName: {
    fontSize: 15,
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brand.green700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  shareButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.brand.green700,
    alignItems: 'center',
  },
  cookButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.brand.green700,
    alignItems: 'center',
  },
  cookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  validateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  validateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  validateCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateCheckActive: {
    backgroundColor: Colors.brand.green500,
    borderColor: Colors.brand.green500,
  },
  // Cooking mode
  cookingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  cookingStepLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cookingStepText: {
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 34,
    textAlign: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
