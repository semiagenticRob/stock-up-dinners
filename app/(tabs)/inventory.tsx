import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/constants/categories';
import { useColorScheme } from '@/components/useColorScheme';
import { useInventory } from '@/hooks/useInventory';
import { useIngredients } from '@/hooks/useIngredients';
import { InventoryItemWithIngredient, Ingredient, IngredientCategory } from '@/types/database';
import { formatQuantity } from '@/utils/units';

function freshnessColor(daysRemaining: number | null): string {
  if (daysRemaining === null) return 'transparent';
  if (daysRemaining <= 2) return Colors.brand.red600;
  if (daysRemaining <= 5) return Colors.brand.yellow600;
  return Colors.brand.green500;
}

function freshnessLabel(daysRemaining: number | null): string {
  if (daysRemaining === null) return '';
  if (daysRemaining <= 0) return 'Expired';
  if (daysRemaining === 1) return '1 day left';
  return `${daysRemaining} days left`;
}

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { items, perishables, byCategory, isLoading, setQuantity, refetch } =
    useInventory();
  const { ingredients: allIngredients, isLoading: ingredientsLoading } =
    useIngredients();

  const [selectedTab, setSelectedTab] = useState<'perishable' | IngredientCategory>('perishable');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemWithIngredient | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  const inventoryIngredientIds = new Set(items.map((i) => i.ingredient_id));

  const handleAdjust = (item: InventoryItemWithIngredient, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    setQuantity(item.ingredient_id, newQty);
  };

  const handleEditSave = () => {
    if (!editingItem) return;
    const qty = parseFloat(editQuantity);
    if (isNaN(qty) || qty < 0) return;
    setQuantity(editingItem.ingredient_id, qty);
    setEditingItem(null);
  };

  const handleAddItem = (ingredient: Ingredient) => {
    setQuantity(ingredient.id, ingredient.package_size);
    setShowAddModal(false);
  };

  const renderInventoryItem = (item: InventoryItemWithIngredient) => (
    <View
      key={item.id}
      style={[styles.itemRow, { backgroundColor: colors.surface }]}
    >
      {item.ingredient.is_perishable && (
        <View
          style={[
            styles.freshnessBar,
            { backgroundColor: freshnessColor(item.days_remaining) },
          ]}
        />
      )}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
          {item.ingredient.name}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {formatQuantity(item.quantity, item.ingredient.default_unit)}
          </Text>
          {item.days_remaining !== null && (
            <Text
              style={{
                color: freshnessColor(item.days_remaining),
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {freshnessLabel(item.days_remaining)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.stepperRow}>
        <Pressable
          style={[styles.stepperButton, { borderColor: colors.border }]}
          onPress={() => handleAdjust(item, -getStepSize(item.ingredient))}
        >
          <Text style={styles.stepperText}>-</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setEditingItem(item);
            setEditQuantity(item.quantity.toString());
          }}
        >
          <Text style={[styles.quantityText, { color: colors.text }]}>
            {formatQuantity(item.quantity, item.ingredient.default_unit)}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.stepperButton, { borderColor: colors.border }]}
          onPress={() => handleAdjust(item, getStepSize(item.ingredient))}
        >
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  const currentItems =
    selectedTab === 'perishable'
      ? perishables
      : byCategory.find((g) => g.category === selectedTab)?.items ?? [];

  if (items.length === 0 && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyState, { borderColor: colors.border }]}>
          <FontAwesome name="archive" size={48} color={Colors.brand.green700} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your pantry is empty
          </Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Add items from the Costco staples list to start tracking
          </Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>Add Items</Text>
          </Pressable>
        </View>
        <AddItemModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          ingredients={allIngredients}
          existingIds={inventoryIngredientIds}
          onAdd={handleAddItem}
          colors={colors}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        <TabChip
          label={`Use Soon (${perishables.length})`}
          selected={selectedTab === 'perishable'}
          onPress={() => setSelectedTab('perishable')}
          colors={colors}
        />
        {CATEGORY_ORDER.map((cat) => {
          const count =
            byCategory.find((g) => g.category === cat)?.items.length ?? 0;
          if (count === 0) return null;
          return (
            <TabChip
              key={cat}
              label={`${CATEGORY_LABELS[cat]} (${count})`}
              selected={selectedTab === cat}
              onPress={() => setSelectedTab(cat)}
              colors={colors}
            />
          );
        })}
      </ScrollView>

      {/* Items list */}
      <ScrollView style={styles.itemsList} contentContainerStyle={{ paddingBottom: 100 }}>
        {currentItems.length === 0 ? (
          <Text style={[styles.emptyTab, { color: colors.textSecondary }]}>
            {selectedTab === 'perishable'
              ? 'No perishable items expiring soon'
              : 'No items in this category'}
          </Text>
        ) : (
          currentItems.map(renderInventoryItem)
        )}
      </ScrollView>

      {/* FAB to add items */}
      <Pressable
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Edit quantity modal */}
      <Modal
        visible={!!editingItem}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditingItem(null)}
        >
          <Pressable style={[styles.editModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.editTitle, { color: colors.text }]}>
              {editingItem?.ingredient.name}
            </Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
              {editingItem?.ingredient.default_unit}
            </Text>
            <View style={styles.editButtons}>
              <Pressable
                style={[styles.editCancel, { borderColor: colors.border }]}
                onPress={() => setEditingItem(null)}
              >
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.editSave} onPress={handleEditSave}>
                <Text style={styles.editSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add item modal */}
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        ingredients={allIngredients}
        existingIds={inventoryIngredientIds}
        onAdd={handleAddItem}
        colors={colors}
      />
    </View>
  );
}

function TabChip({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: typeof Colors.light;
}) {
  return (
    <Pressable
      style={[
        styles.tabChip,
        selected
          ? { backgroundColor: Colors.brand.green700 }
          : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.tabChipText,
          { color: selected ? '#FFFFFF' : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AddItemModal({
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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.addModal, { backgroundColor: colors.background }]}>
        <View style={styles.addModalHeader}>
          <Text style={[styles.addModalTitle, { color: colors.text }]}>
            Add to Inventory
          </Text>
          <Pressable onPress={onClose}>
            <Text style={{ color: Colors.brand.green700, fontSize: 16 }}>
              Done
            </Text>
          </Pressable>
        </View>
        <TextInput
          style={[styles.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder="Search ingredients..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.addItemRow, { borderBottomColor: colors.border }]}
              onPress={() => onAdd(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.addItemName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {CATEGORY_LABELS[item.category as IngredientCategory]} ·{' '}
                  {item.package_size} {item.package_unit}
                </Text>
              </View>
              <Text style={{ color: Colors.brand.green700, fontWeight: '600' }}>
                + Add
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyTab, { color: colors.textSecondary }]}>
              {search ? 'No matching ingredients' : 'All items already in inventory'}
            </Text>
          }
        />
      </View>
    </Modal>
  );
}

function getStepSize(ingredient: Ingredient): number {
  // Smart step sizes based on unit and typical usage
  switch (ingredient.default_unit) {
    case 'lb':
      return ingredient.package_size >= 10 ? 1 : 0.5;
    case 'oz':
      return ingredient.package_size >= 32 ? 4 : 2;
    case 'fl_oz':
      return ingredient.package_size >= 64 ? 8 : 4;
    case 'can':
      return 1;
    case 'count':
      return ingredient.package_size >= 20 ? 2 : 1;
    default:
      return 1;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  freshnessBar: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  itemInfo: {
    flex: 1,
    paddingLeft: 4,
    gap: 2,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 18,
    color: Colors.brand.green700,
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.green700,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
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
  emptyTab: {
    textAlign: 'center',
    padding: 32,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    width: 280,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  editInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  editCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.brand.green700,
    alignItems: 'center',
  },
  editSaveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addModal: {
    flex: 1,
    paddingTop: 60,
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  addModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchInput: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  addItemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
});
