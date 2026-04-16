import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // TODO: Wire to real data from inventory + cook_log queries
  const stats = {
    itemsInStock: 0,
    perishablesExpiring: 0,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Quick Stats */}
      <View style={[styles.statsCard, { backgroundColor: Colors.brand.green100 }]}>
        <Text style={[styles.statsTitle, { color: Colors.brand.green900 }]}>
          {stats.itemsInStock} items in stock
        </Text>
        {stats.perishablesExpiring > 0 && (
          <Text style={{ color: Colors.brand.amber700 }}>
            {stats.perishablesExpiring} perishables to use soon
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
        </Pressable>
        <Pressable
          style={[styles.ctaButton, { backgroundColor: Colors.brand.amber700 }]}
          onPress={() => router.push('/(tabs)/shopping')}
        >
          <Text style={styles.ctaEmoji}>🛒</Text>
          <Text style={styles.ctaText}>Go Shopping</Text>
        </Pressable>
      </View>

      {/* Perishable Alerts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Use Soon
        </Text>
        <View style={[styles.emptyState, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary }}>
            Add items to your inventory to see perishable alerts
          </Text>
        </View>
      </View>

      {/* Recent Cooks */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Cooks
        </Text>
        <View style={[styles.emptyState, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary }}>
            Your cooking history will appear here
          </Text>
        </View>
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
  },
  statsCard: {
    padding: 20,
    borderRadius: 12,
    gap: 4,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ctaButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  ctaEmoji: {
    fontSize: 32,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
});
