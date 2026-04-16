import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import Colors from '@/constants/Colors';

export default function PaywallScreen() {
  const router = useRouter();
  const { isProMember, restorePurchases, isLoading } = useRevenueCat();
  const [isRestoring, setIsRestoring] = useState(false);

  // If already pro, skip straight to onboarding
  if (isProMember) {
    router.replace('/(onboarding)/stock-pantry');
    return null;
  }

  const handlePresentPaywall = async () => {
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: 'Stock Up Dinners Pro',
      });

      // If the user purchased or already has access, proceed
      if (result !== 'NOT_PRESENTED') {
        router.replace('/(onboarding)/stock-pantry');
      }
    } catch (error: any) {
      // User cancelled or error
      console.log('Paywall result:', error);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
      // If restore succeeds and they have pro, the isProMember check above will redirect
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'No previous purchases found. Start a free trial to get started.'
      );
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.brand.green700} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🍽️</Text>
          <Text style={styles.title}>Unlock Stock Up Dinners</Text>
          <Text style={styles.subtitle}>
            Track your pantry, never waste food, and always know what's for
            dinner.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureRow icon="📦" text="Automatic inventory tracking" />
          <FeatureRow icon="🍳" text="26 Costco-optimized dinner recipes" />
          <FeatureRow icon="🛒" text="Smart shopping lists by aisle" />
          <FeatureRow icon="⏰" text="Perishable alerts so nothing goes bad" />
          <FeatureRow icon="📊" text="Serves 1-10 with auto-scaling" />
        </View>

        <View style={styles.ctaSection}>
          <Pressable style={styles.primaryButton} onPress={handlePresentPaywall}>
            <Text style={styles.primaryButtonText}>
              Start 14-Day Free Trial
            </Text>
          </Pressable>

          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.brand.green700} />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.brand.green900,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  ctaSection: {
    gap: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.brand.green700,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  restoreButton: {
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    color: Colors.brand.green700,
    fontWeight: '500',
  },
});
