import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.emoji}>🛒</Text>
          <Text style={styles.title}>Stock Up Dinners</Text>
          <Text style={styles.subtitle}>
            Know what's in your pantry.{'\n'}Know what you can cook.{'\n'}
            Never waste food again.
          </Text>
        </View>

        <View style={styles.valueProps}>
          <ValueProp
            icon="📦"
            text="Track your Costco inventory automatically"
          />
          <ValueProp
            icon="🍽️"
            text="See exactly what meals you can make right now"
          />
          <ValueProp
            icon="📋"
            text="Smart shopping lists that update your stock"
          />
        </View>

        <View style={styles.ctaSection}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
          <Text style={styles.trialText}>
            14-day free trial. No credit card required.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ValueProp({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.valuePropRow}>
      <Text style={styles.valuePropIcon}>{icon}</Text>
      <Text style={styles.valuePropText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.green900,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#E8F5E9',
    textAlign: 'center',
    lineHeight: 28,
  },
  valueProps: {
    gap: 20,
  },
  valuePropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  valuePropIcon: {
    fontSize: 28,
  },
  valuePropText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 22,
  },
  ctaSection: {
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.brand.amber500,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brand.green900,
  },
  trialText: {
    fontSize: 14,
    color: '#A5D6A7',
  },
});
