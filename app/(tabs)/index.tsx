import { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useInventory } from '@/hooks/useInventory';
import { useMeals, computeMealAvailability } from '@/hooks/useMeals';
import { useCookLog } from '@/hooks/useCookLog';
import { useIngredientMap } from '@/hooks/useIngredients';
import { formatQuantity } from '@/utils/units';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { items: inventory, perishables } = useInventory();
  const { meals, mealIngredients } = useMeals();
  const { logs } = useCookLog();
  const { ingredientMap } = useIngredientMap();

  const availability = useMemo(
    () => computeMealAvailability(meals, mealIngredients, inventory, 4),
    [meals, mealIngredients, inventory]
  );
  const canCookCount = availability.filter((m) => m.can_cook).length;

  // Recent cooks — last 5, resolve meal names
  const recentCooks = logs.slice(0, 5).map((log) => ({
    ...log,
    mealName: meals.find((m) => m.id === log.meal_id)?.name ?? 'Unknown',
  }));

  // Expiring soon — perishables with <=5 days, suggest meals that use them
  const expiringSoon = perishables.filter(
    (p) => p.days_remaining !== null && p.days_remaining <= 5
  );

  // For each expiring ingredient, find meals that use it and can be cooked
  const perishableAlerts = expiringSoon.slice(0, 3).map((item) => {
    const suggestedMeals = availability
      .filter(
        (m) =>
          m.can_cook &&
          mealIngredients.some(
            (mi) => mi.meal_id === m.id && mi.ingredient_id === item.ingredient_id
          )
      )
      .slice(0, 2);

    return { item, suggestedMeals };
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Quick Stats */}
      <View
        style={[styles.statsCard, { backgroundColor: Colors.brand.green100 }]}
      >
        <Text style={[styles.statsTitle, { color: Colors.brand.green900 }]}>
          {inventory.length} items in stock
        </Text>
        <Text style={{ color: Colors.brand.green700 }}>
          {canCookCount} meal{canCookCount !== 1 ? 's' : ''} you can cook right
          now
        </Text>
        {expiringSoon.length > 0 && (
          <Text style={{ color: Colors.brand.amber700, marginTop: 4 }}>
            {expiringSoon.length} perishable
            {expiringSoon.length !== 1 ? 's' : ''} to use soon
          </Text>
        )}
      </View>

      {/* Primary CTAs */}
      <View style={styles.ctaRow}>
        <Pressable
          style={[styles.ctaButton, { backgroundColor: Colors.brand.green700 }]}
          onPress={() => router.push('/(tabs)/cook')}
        >
          <Text style={styles.ctaEmoji}>🍳</Text>
          <Text style={styles.ctaText}>Cook Now</Text>
          <Text style={styles.ctaSubtext}>{canCookCount} available</Text>
        </Pressable>
        <Pressable
          style={[styles.ctaButton, { backgroundColor: Colors.brand.amber700 }]}
          onPress={() => router.push('/(tabs)/shopping')}
        >
          <Text style={styles.ctaEmoji}>🛒</Text>
          <Text style={styles.ctaText}>Go Shopping</Text>
          <Text style={styles.ctaSubtext}>Build a list</Text>
        </Pressable>
      </View>

      {/* Perishable Alerts */}
      {perishableAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Use Soon
          </Text>
          {perishableAlerts.map(({ item, suggestedMeals }) => (
            <View
              key={item.id}
              style={[styles.alertCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.alertHeader}>
                <View
                  style={[
                    styles.freshDot,
                    {
                      backgroundColor:
                        (item.days_remaining ?? 999) <= 2
                          ? Colors.brand.red600
                          : Colors.brand.yellow600,
                    },
                  ]}
                />
                <Text style={[styles.alertName, { color: colors.text }]}>
                  {item.ingredient.name}
                </Text>
                <Text
                  style={{
                    color:
                      (item.days_remaining ?? 999) <= 2
                        ? Colors.brand.red600
                        : Colors.brand.yellow600,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {item.days_remaining === 0
                    ? 'Use today'
                    : item.days_remaining === 1
                    ? '1 day left'
                    : `${item.days_remaining} days left`}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {formatQuantity(item.quantity, item.ingredient.default_unit)}{' '}
                remaining
              </Text>
              {suggestedMeals.length > 0 && (
                <View style={styles.suggestedRow}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Make:{' '}
                  </Text>
                  {suggestedMeals.map((m, i) => (
                    <Pressable
                      key={m.id}
                      onPress={() => router.push(`/meal/${m.id}`)}
                    >
                      <Text style={styles.suggestedMeal}>
                        {m.name}
                        {i < suggestedMeals.length - 1 ? ', ' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Recent Cooks */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Cooks
        </Text>
        {recentCooks.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary }}>
              Your cooking history will appear here
            </Text>
          </View>
        ) : (
          recentCooks.map((cook) => (
            <Pressable
              key={cook.id}
              style={[styles.cookRow, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/meal/${cook.meal_id}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[{ color: colors.text, fontWeight: '500' }]}>
                  {cook.mealName}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {cook.servings_cooked} servings ·{' '}
                  {new Date(cook.cooked_at).toLocaleDateString()}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  statsCard: {
    padding: 20,
    borderRadius: 12,
    gap: 4,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ctaButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  ctaEmoji: {
    fontSize: 28,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  alertCard: {
    padding: 14,
    borderRadius: 10,
    gap: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freshDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertName: {
    flex: 1,
    fontWeight: '600',
    fontSize: 15,
  },
  suggestedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  suggestedMeal: {
    color: Colors.brand.green700,
    fontSize: 13,
    fontWeight: '600',
  },
  cookRow: {
    padding: 14,
    borderRadius: 10,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
});
