import { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Ingredient, IngredientCategory } from '@/types/database';

// Top 20 highest-frequency staples shown first
const TOP_STAPLE_IDS = [
  // Proteins
  'chicken-breast', 'ground-beef', 'eggs',
  // Canned
  'diced-tomatoes', 'black-beans', 'tomato-sauce',
  // Grains
  'jasmine-rice', 'spaghetti', 'short-pasta', 'flour-tortillas',
  // Oils/Condiments
  'olive-oil', 'soy-sauce', 'garlic-minced', 'salt', 'pepper', 'garlic-powder',
  // Dairy
  'butter', 'mozzarella',
  // Frozen
  'frozen-broccoli',
  // Produce
  'onions',
];

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  protein: 'Proteins',
  canned: 'Canned Goods',
  grain: 'Grains & Pasta',
  oil_condiment: 'Oils, Condiments & Seasonings',
  dairy: 'Dairy',
  frozen: 'Frozen',
  produce: 'Produce',
};

interface InventoryEntry {
  ingredientId: string;
  quantity: number;
}

export default function StockPantryScreen() {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [inventory, setInventory] = useState<Map<string, number>>(new Map());

  // TODO: Replace with actual ingredients from Supabase/WatermelonDB
  // For now this is a placeholder - the real data will come from the seed
  const ingredients: Ingredient[] = [];

  const toggleItem = (id: string, packageSize: number) => {
    setInventory((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, packageSize);
      }
      return next;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setInventory((prev) => {
      const next = new Map(prev);
      if (quantity <= 0) {
        next.delete(id);
      } else {
        next.set(id, quantity);
      }
      return next;
    });
  };

  const handleDone = async () => {
    // TODO: Save inventory entries to Supabase/WatermelonDB
    // Each entry: { ingredient_id, quantity, purchased_at: new Date() }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Your Pantry</Text>
        <Text style={styles.subtitle}>
          Tap items you have at home. We'll pre-fill Costco package sizes — adjust if needed.
        </Text>
      </View>

      <View style={styles.pathButtons}>
        <Pressable style={[styles.pathButton, styles.pathButtonActive]}>
          <Text style={styles.pathButtonTextActive}>I'm at home</Text>
        </Pressable>
        <Pressable style={styles.pathButton}>
          <Text style={styles.pathButtonText}>Just went to Costco</Text>
        </Pressable>
      </View>

      {/* Placeholder: will be populated with real ingredient data */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          {inventory.size} items selected
        </Text>
        <Text style={styles.placeholderSubtext}>
          Ingredient list will load from database
        </Text>
      </View>

      {!showAll && (
        <Pressable
          style={styles.showAllButton}
          onPress={() => setShowAll(true)}
        >
          <Text style={styles.showAllText}>Show all 75 staples</Text>
        </Pressable>
      )}

      <View style={styles.footer}>
        <Pressable style={styles.skipButton} onPress={handleDone}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
        <Pressable style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>
            Done ({inventory.size} items)
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.brand.green900,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  pathButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  pathButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  pathButtonActive: {
    backgroundColor: Colors.brand.green100,
    borderColor: Colors.brand.green700,
  },
  pathButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  pathButtonTextActive: {
    fontSize: 14,
    color: Colors.brand.green700,
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.green700,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999999',
  },
  showAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  showAllText: {
    fontSize: 14,
    color: Colors.brand.green700,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#666666',
  },
  doneButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.brand.green700,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
