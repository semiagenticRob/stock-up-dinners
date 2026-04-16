import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ShoppingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // TODO: Phase 4 — shopping list with offline support
  // WatermelonDB local-first queries
  // Organized by shopping_aisle order
  // Check-off → auto-add to inventory

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.emptyState, { borderColor: colors.border }]}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No shopping list yet
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Add ingredients from a meal or build a custom list for your next Costco run
        </Text>
        <Pressable style={styles.createButton}>
          <Text style={styles.createButtonText}>Create Shopping List</Text>
        </Pressable>
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
  createButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.brand.amber700,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
