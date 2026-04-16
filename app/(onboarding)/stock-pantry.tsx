import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  FlatList,
  SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { CATEGORY_LABELS } from '@/constants/categories';
import { useIngredients } from '@/hooks/useIngredients';
import { useInventory } from '@/hooks/useInventory';
import { Ingredient, IngredientCategory } from '@/types/database';
import { formatQuantity } from '@/utils/units';

// Top 20 highest-frequency staples — shown first during onboarding
const TOP_STAPLE_IDS = new Set([
  '00000000-0000-0000-0001-000000000002', // Chicken Breasts
  '00000000-0000-0000-0001-000000000004', // Ground Beef
  '00000000-0000-0000-0001-000000000015', // Eggs
  '00000000-0000-0000-0002-000000000017', // Diced Tomatoes
  '00000000-0000-0000-0002-000000000020', // Black Beans
  '00000000-0000-0000-0002-000000000018', // Tomato Sauce
  '00000000-0000-0000-0003-000000000027', // Jasmine Rice
  '00000000-0000-0000-0003-000000000030', // Spaghetti
  '00000000-0000-0000-0003-000000000031', // Short-Cut Pasta
  '00000000-0000-0000-0003-000000000033', // Flour Tortillas
  '00000000-0000-0000-0004-000000000035', // EVOO
  '00000000-0000-0000-0004-000000000039', // Soy Sauce
  '00000000-0000-0000-0004-000000000046', // Minced Garlic
  '00000000-0000-0000-0004-000000000043', // Salt
  '00000000-0000-0000-0004-000000000044', // Pepper
  '00000000-0000-0000-0004-000000000045', // Garlic Powder
  '00000000-0000-0000-0005-000000000048', // Butter
  '00000000-0000-0000-0005-000000000050', // Mozzarella
  '00000000-0000-0000-0006-000000000057', // Frozen Broccoli
  '00000000-0000-0000-0007-000000000071', // Onions
]);

export default function StockPantryScreen() {
  const router = useRouter();
  const { ingredients, isLoading: ingredientsLoading } = useIngredients();
  const { upsertItem } = useInventory();
  const [selected, setSelected] = useState<Map<string, number>>(new Map());
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState<'home' | 'costco'>('home');

  const topStaples = ingredients.filter((i) => TOP_STAPLE_IDS.has(i.id));
  const allByCategory = buildSections(ingredients);
  const displayItems = showAll ? allByCategory : [{ title: 'Top Staples', data: topStaples }];

  const toggleItem = (ingredient: Ingredient) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(ingredient.id)) {
        next.delete(ingredient.id);
      } else {
        next.set(ingredient.id, ingredient.package_size);
      }
      return next;
    });
  };

  const handleDone = async () => {
    // Save all selected items to inventory
    for (const [ingredientId, quantity] of selected.entries()) {
      await upsertItem(ingredientId, quantity);
    }
    router.replace('/(tabs)');
  };

  const renderItem = ({ item }: { item: Ingredient }) => {
    const isSelected = selected.has(item.id);
    return (
      <Pressable
        style={[
          styles.ingredientRow,
          isSelected && styles.ingredientRowSelected,
        ]}
        onPress={() => toggleItem(item)}
      >
        <View style={styles.checkBox}>
          {isSelected && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <View style={styles.ingredientInfo}>
          <Text
            style={[
              styles.ingredientName,
              isSelected && styles.ingredientNameSelected,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={styles.ingredientDetail}>
            {formatQuantity(item.package_size, item.package_unit)} package
            {item.is_perishable ? ' · Perishable' : ''}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Your Pantry</Text>
        <Text style={styles.subtitle}>
          {mode === 'costco'
            ? 'Tap what you just bought. Package sizes are pre-filled.'
            : 'Tap items you have at home. Adjust quantities later.'}
        </Text>
      </View>

      <View style={styles.pathButtons}>
        <Pressable
          style={[
            styles.pathButton,
            mode === 'home' && styles.pathButtonActive,
          ]}
          onPress={() => setMode('home')}
        >
          <Text
            style={
              mode === 'home'
                ? styles.pathButtonTextActive
                : styles.pathButtonText
            }
          >
            I'm at home
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.pathButton,
            mode === 'costco' && styles.pathButtonActive,
          ]}
          onPress={() => setMode('costco')}
        >
          <Text
            style={
              mode === 'costco'
                ? styles.pathButtonTextActive
                : styles.pathButtonText
            }
          >
            Just went to Costco
          </Text>
        </Pressable>
      </View>

      <SectionList
        sections={displayItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListFooterComponent={
          !showAll ? (
            <Pressable
              style={styles.showAllButton}
              onPress={() => setShowAll(true)}
            >
              <Text style={styles.showAllText}>
                Show all {ingredients.length} staples
              </Text>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.footer}>
        <Pressable
          style={styles.skipButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
        <Pressable style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>
            Done ({selected.size} items)
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function buildSections(ingredients: Ingredient[]) {
  const groups: Record<string, Ingredient[]> = {};
  for (const ing of ingredients) {
    const label = CATEGORY_LABELS[ing.category as IngredientCategory] ?? ing.category;
    if (!groups[label]) groups[label] = [];
    groups[label].push(ing);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 6,
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
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999999',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  ingredientRowSelected: {
    backgroundColor: Colors.brand.green100,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.green700,
  },
  ingredientInfo: {
    flex: 1,
    gap: 2,
  },
  ingredientName: {
    fontSize: 15,
    color: '#333333',
  },
  ingredientNameSelected: {
    fontWeight: '600',
    color: Colors.brand.green900,
  },
  ingredientDetail: {
    fontSize: 12,
    color: '#999999',
  },
  showAllButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  showAllText: {
    fontSize: 15,
    color: Colors.brand.green700,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
