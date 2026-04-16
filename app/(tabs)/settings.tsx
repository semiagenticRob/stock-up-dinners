import { StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers/AuthProvider';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Account */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          ACCOUNT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <Text style={{ color: colors.textSecondary }}>
              {user?.email ?? 'Not signed in'}
            </Text>
          </View>
        </View>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          SUBSCRIPTION
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Pressable style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>
              Manage Subscription
            </Text>
            <Text style={{ color: colors.textSecondary }}>{'>'}</Text>
          </Pressable>
          <Pressable style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>
              Restore Purchases
            </Text>
            <Text style={{ color: colors.textSecondary }}>{'>'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          DATA
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Pressable style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>
              Refresh Recipes
            </Text>
            <Text style={{ color: colors.textSecondary }}>{'>'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Sign Out */}
      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.textSecondary }]}>
        Stock Up Dinners v1.0.0
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
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
  },
  signOutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E53935',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
  },
});
