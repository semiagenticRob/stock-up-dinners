import { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useInventory } from '@/hooks/useInventory';
import { useMeals, computeMealAvailability } from '@/hooks/useMeals';
import { useIngredientMap } from '@/hooks/useIngredients';
import { MealWithAvailability } from '@/types/database';

type SortMode = 'urgency' | 'time' | 'alpha';

export default function CookNowScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { items: inventory, isLoading: invLoading } = useInventory();
  const { meals, mealIngredients, isLoading: mealsLoading } = useMeals();
  const { ingredientMap } = useIngredientMap();

  const [showAlmost, setShowAlmost] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('urgency');

  const availability = useMemo(
    () => computeMealAvailability(meals, mealIngredients, inventory, 4),
    [meals, mealIngredients, inventory]
  );

  const canCook = availability.filter((m) => m.can_cook);
  const almost = availability.filter((m) => m.almost_can_cook);
  const displayMeals = showAlmost ? [...canCook, ...almost] : canCook;

  const sorted = useMemo(() => {
    const list = [...displayMeals];
    switch (sortMode) {
      case 'urgency':
        list.sort((a, b) => {
          // can_cook before almost
          if (a.can_cook !== b.can_cook) return a.can_cook ? -1 : 1;
          return a.urgency_score - b.urgency_score;
        });
        break;
      case 'time':
        list.sort((a, b) => a.total_time_minutes - b.total_time_minutes);
        break;
      case 'alpha':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [displayMeals, sortMode]);

  const isLoading = invLoading || mealsLoading;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Loading meals...</Text>
      </View>
    );
  }

  if (inventory.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyState, { borderColor: colors.border }]}>
          <Text style={styles.emptyEmoji}>🍳</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Stock your pantry first
          </Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Head to Inventory and add what you have at home
          </Text>
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push('/(tabs)/inventory')}
          >
            <Text style={styles.ctaButtonText}>Go to Inventory</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Controls */}
      <View style={[styles.controls, { borderBottomColor: colors.border }]}>
        <View style={styles.sortRow}>
          {(['urgency', 'time', 'alpha'] as SortMode[]).map((mode) => (
            <Pressable
              key={mode}
              style={[
                styles.sortChip,
                sortMode === mode
                  ? { backgroundColor: Colors.brand.green700 }
                  : { backgroundColor: colors.surface },
              ]}
              onPress={() => setSortMode(mode)}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: sortMode === mode ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {mode === 'urgency'
                  ? 'Use Soon'
                  : mode === 'time'
                  ? 'Quick'
                  : 'A-Z'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.toggleRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Show almost ({almost.length})
          </Text>
          <Switch
            value={showAlmost}
            onValueChange={setShowAlmost}
            trackColor={{ true: Colors.brand.green500 }}
          />
        </View>
      </View>

      {/* Results summary */}
      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: colors.text }]}>
          {canCook.length} meal{canCook.length !== 1 ? 's' : ''} you can cook
          now
        </Text>
      </View>

      {/* Meal cards */}
      <ScrollView
        contentContainerStyle={styles.mealList}
        style={{ flex: 1 }}
      >
        {sorted.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No meals match your inventory
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Add more items or toggle "Show almost" to see meals missing 1-2
              ingredients
            </Text>
          </View>
        ) : (
          sorted.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              ingredientMap={ingredientMap}
              colors={colors}
              onPress={() => router.push(`/meal/${meal.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function MealCard({
  meal,
  ingredientMap,
  colors,
  onPress,
}: {
  meal: MealWithAvailability;
  ingredientMap: Map<string, any>;
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  const missingNames = meal.missing_ingredients
    .map((id) => ingredientMap.get(id)?.name ?? 'Unknown')
    .slice(0, 3);

  return (
    <Pressable
      style={[styles.mealCard, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.mealCardHeader}>
        <Text
          style={[styles.mealName, { color: colors.text }]}
          numberOfLines={1}
        >
          {meal.name}
        </Text>
        {meal.urgency_score < 999 && meal.urgency_score <= 3 && (
          <View style={styles.urgencyBadge}>
            <Text style={styles.urgencyText}>
              {meal.urgency_score <= 0 ? 'Use today' : `${meal.urgency_score}d`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.mealMeta}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {meal.total_time_minutes} min
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>·</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Serves {meal.default_servings}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>·</Text>
        <Text
          style={{
            color: meal.can_cook ? Colors.brand.green500 : Colors.brand.amber700,
            fontSize: 13,
            fontWeight: '600',
          }}
        >
          {meal.available_count}/{meal.total_required} ingredients
        </Text>
      </View>

      {!meal.can_cook && missingNames.length > 0 && (
        <Text style={styles.missingText}>
          Missing: {missingNames.join(', ')}
        </Text>
      )}

      <Text
        style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}
        numberOfLines={2}
      >
        {meal.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  mealList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  mealCard: {
    padding: 16,
    borderRadius: 12,
    gap: 6,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  urgencyBadge: {
    backgroundColor: Colors.brand.red100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.red600,
  },
  mealMeta: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  missingText: {
    fontSize: 12,
    color: Colors.brand.amber700,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  ctaButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.brand.green700,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
