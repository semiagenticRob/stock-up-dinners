import { StyleSheet, View, Text, ScrollView } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function CookNowScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // TODO: Phase 3 — meal filtering algorithm
  // For each meal, check user_inventory against meal_ingredients
  // Filter to "can cook" and "almost can cook"
  // Sort by perishable urgency score

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.emptyState, { borderColor: colors.border }]}>
        <Text style={styles.emptyEmoji}>🍳</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No meals available yet
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Add items to your inventory to see what meals you can cook
        </Text>
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
    flex: 1,
    justifyContent: 'center',
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
});
