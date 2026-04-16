import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // TODO: Phase 3 — full meal detail screen
  // Query meal + meal_ingredients joined with ingredients
  // Serving size selector (1-10)
  // Ingredient list with inventory status
  // Step-by-step instructions
  // Storage & reheat info
  // "Share Recipe" button
  // "Cook This" button → pre-cook validation

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Meal Detail
      </Text>
      <Text style={{ color: colors.textSecondary }}>
        Meal ID: {id}
      </Text>
      <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
        Full recipe view coming in Phase 3
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
});
