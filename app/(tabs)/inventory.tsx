import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function InventoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // TODO: Phase 2 — inventory screen with perishables-first layout + category tabs
  // Query user_inventory joined with ingredients
  // Compute days_remaining for perishables
  // Color-code: red <=2d, yellow 3-5d, green >5d

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.emptyState, { borderColor: colors.border }]}>
        <Text style={styles.emptyEmoji}>📦</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Your pantry is empty
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Add items from the Costco staples list to start tracking your inventory
        </Text>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            // TODO: Navigate to add-item sheet or stock-pantry flow
          }}
        >
          <Text style={styles.addButtonText}>Add Items</Text>
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
  addButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.brand.green700,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
