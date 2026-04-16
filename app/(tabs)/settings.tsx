import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers/AuthProvider';
import { useRevenueCat } from '@/providers/RevenueCatProvider';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut } = useAuth();
  const { customerInfo, isProMember, restorePurchases } = useRevenueCat();
  const [isRestoring, setIsRestoring] = useState(false);

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

  const handleManageSubscription = async () => {
    if (customerInfo?.managementURL) {
      await Linking.openURL(customerInfo.managementURL);
    } else if (Platform.OS === 'ios') {
      await Linking.openURL('https://apps.apple.com/account/subscriptions');
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully.');
    } catch (error) {
      Alert.alert('Restore Failed', 'No previous purchases found.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleShowCustomerCenter = async () => {
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      // Fallback to manage subscription URL
      handleManageSubscription();
    }
  };

  // Subscription status display
  const subscriptionStatus = isProMember ? 'Active' : 'Inactive';
  const expirationDate = customerInfo?.entitlements.active['Stock Up Dinners Pro']
    ?.expirationDate;

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
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Status</Text>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isProMember
                      ? Colors.brand.green500
                      : Colors.brand.red600,
                  },
                ]}
              />
              <Text
                style={{
                  color: isProMember
                    ? Colors.brand.green700
                    : Colors.brand.red600,
                  fontWeight: '600',
                  fontSize: 14,
                }}
              >
                {subscriptionStatus}
              </Text>
            </View>
          </View>
          {expirationDate && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>
                Renews
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                {new Date(expirationDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          <Pressable style={styles.row} onPress={handleShowCustomerCenter}>
            <Text style={[styles.label, { color: colors.text }]}>
              Manage Subscription
            </Text>
            <Text style={{ color: colors.textSecondary }}>{'>'}</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={handleRestore}>
            <Text style={[styles.label, { color: colors.text }]}>
              Restore Purchases
            </Text>
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.brand.green700} />
            ) : (
              <Text style={{ color: colors.textSecondary }}>{'>'}</Text>
            )}
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
