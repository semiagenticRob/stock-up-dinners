import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import Colors from '@/constants/Colors';
import { AISLE_LABELS } from '@/constants/categories';
import { useColorScheme } from '@/components/useColorScheme';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useInventory } from '@/hooks/useInventory';
import { useIngredients } from '@/hooks/useIngredients';
import { ShoppingListItemWithIngredient, Ingredient } from '@/types/database';
import { formatQuantity } from '@/utils/units';

export default function ShoppingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const {
    activeList,
    items,
    isLoading,
    createList,
    addItem,
    checkOffItem,
    uncheckItem,
    removeItem,
  } = useShoppingList();
  const { upsertItem: addToInventory } = useInventory();
  const { ingredients: allIngredients } = useIngredients();

  const [showAddModal, setShowAddModal] = useState(false);

  // Group items by aisle
  const unchecked = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  const aisleGroups = groupByAisle(unchecked);

  const handleCheckOff = async (item: ShoppingListItemWithIngredient) => {
    // Check off the item
    await checkOffItem(item.id);
    // Add full package to inventory
    const packageAmount =
      item.packages_to_buy * item.ingredient.package_size;
    await addToInventory(item.ingredient_id, packageAmount);
  };

  const handleUncheck = async (item: ShoppingListItemWithIngredient) => {
    await uncheckItem(item.id);
    // Note: we don't remove from inventory on uncheck — user can adjust manually
  };

  const handleAddIngredient = async (ingredient: Ingredient) => {
    if (!activeList) {
      await createList();
    }
    await addItem(ingredient.id, ingredient.package_size, ingredient.package_size);
    setShowAddModal(false);
  };

  // No active list
  if (!activeList && !isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyState, { borderColor: colors.border }]}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No shopping list yet
          </Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Create a list for your next Costco run
          </Text>
          <Pressable
            style={styles.createButton}
            onPress={() => createList('Costco Run')}
          >
            <Text style={styles.createButtonText}>Create Shopping List</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with list name + add button */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.listName, { color: colors.text }]}>
          {activeList?.name ?? 'Shopping List'}
        </Text>
        <View style={styles.headerActions}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {unchecked.length} remaining
          </Text>
          <Pressable
            style={styles.addChip}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addChipText}>+ Add</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Unchecked items grouped by aisle */}
        {aisleGroups.map(({ aisle, items: aisleItems }) => (
          <View key={aisle}>
            <Text style={[styles.aisleHeader, { color: colors.textSecondary }]}>
              {AISLE_LABELS[aisle] ?? `Aisle ${aisle}`}
            </Text>
            {aisleItems.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onCheck={() => handleCheckOff(item)}
                onRemove={() => {
                  Alert.alert('Remove item?', item.ingredient.name, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => removeItem(item.id),
                    },
                  ]);
                }}
                colors={colors}
                checked={false}
              />
            ))}
          </View>
        ))}

        {/* Checked items */}
        {checked.length > 0 && (
          <View>
            <Text style={[styles.aisleHeader, { color: colors.textSecondary }]}>
              In Cart ({checked.length})
            </Text>
            {checked.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onCheck={() => handleUncheck(item)}
                onRemove={() => removeItem(item.id)}
                colors={colors}
                checked={true}
              />
            ))}
          </View>
        )}

        {unchecked.length === 0 && checked.length > 0 && (
          <View style={styles.allDone}>
            <Text style={styles.allDoneEmoji}>✅</Text>
            <Text style={[styles.allDoneText, { color: colors.text }]}>
              Shopping complete!
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              All items checked off. Your inventory has been updated.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add item modal */}
      <AddToListModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        ingredients={allIngredients}
        existingIds={new Set(items.map((i) => i.ingredient_id))}
        onAdd={handleAddIngredient}
        colors={colors}
      />
    </View>
  );
}

function ShoppingItemRow({
  item,
  onCheck,
  onRemove,
  colors,
  checked,
}: {
  item: ShoppingListItemWithIngredient;
  onCheck: () => void;
  onRemove: () => void;
  colors: typeof Colors.light;
  checked: boolean;
}) {
  return (
    <Pressable
      style={[styles.itemRow, { backgroundColor: colors.surface }]}
      onPress={onCheck}
      onLongPress={onRemove}
    >
      <View
        style={[
          styles.checkbox,
          checked && { backgroundColor: Colors.brand.green500, borderColor: Colors.brand.green500 },
        ]}
      >
        {checked && <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.itemName,
            { color: colors.text },
            checked && styles.itemNameChecked,
          ]}
          numberOfLines={1}
        >
          {item.ingredient.name}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          {item.packages_to_buy} × {formatQuantity(item.ingredient.package_size, item.ingredient.package_unit)}
        </Text>
      </View>
    </Pressable>
  );
}

function AddToListModal({
  visible,
  onClose,
  ingredients,
  existingIds,
  onAdd,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  existingIds: Set<string>;
  onAdd: (ingredient: Ingredient) => void;
  colors: typeof Colors.light;
}) {
  const [search, setSearch] = useState('');

  const filtered = ingredients.filter(
    (i) =>
      !existingIds.has(i.id) &&
      i.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort by aisle for Costco store layout
  filtered.sort((a, b) => a.shopping_aisle - b.shopping_aisle);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Add to Shopping List
          </Text>
          <Pressable onPress={onClose}>
            <Text style={{ color: Colors.brand.green700, fontSize: 16 }}>
              Done
            </Text>
          </Pressable>
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.addRow, { borderBottomColor: colors.border }]}
              onPress={() => onAdd(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.addRowName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {AISLE_LABELS[item.shopping_aisle]} ·{' '}
                  {formatQuantity(item.package_size, item.package_unit)}
                </Text>
              </View>
              <Text style={{ color: Colors.brand.green700, fontWeight: '600' }}>
                + Add
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

function groupByAisle(items: ShoppingListItemWithIngredient[]) {
  const groups = new Map<number, ShoppingListItemWithIngredient[]>();
  for (const item of items) {
    const aisle = item.ingredient.shopping_aisle;
    if (!groups.has(aisle)) groups.set(aisle, []);
    groups.get(aisle)!.push(item);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([aisle, items]) => ({ aisle, items }));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.brand.green700,
  },
  addChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  aisleHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  allDone: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  allDoneEmoji: {
    fontSize: 48,
  },
  allDoneText: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 12,
    margin: 16,
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
  modal: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  addRowName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
});
