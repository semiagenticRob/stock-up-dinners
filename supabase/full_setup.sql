-- Stock Up Dinners — Initial Schema
-- All tables for V1 MVP

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

------------------------------------------------------------
-- USERS (extended from Supabase Auth)
------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_ends_at TIMESTAMPTZ
);

-- RLS: users can only read/update their own row
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own row"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

------------------------------------------------------------
-- INGREDIENTS (seeded, read-only for users)
------------------------------------------------------------
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('protein', 'canned', 'grain', 'oil_condiment', 'dairy', 'frozen', 'produce')),
  default_unit TEXT NOT NULL
    CHECK (default_unit IN ('lb', 'oz', 'fl_oz', 'count', 'can')),
  package_size NUMERIC NOT NULL,
  package_unit TEXT NOT NULL
    CHECK (package_unit IN ('lb', 'oz', 'fl_oz', 'count', 'can')),
  is_perishable BOOLEAN NOT NULL DEFAULT FALSE,
  shelf_life_days INTEGER,
  shopping_aisle INTEGER NOT NULL DEFAULT 0,
  costco_link TEXT,
  notes TEXT,
  seed_version INTEGER NOT NULL DEFAULT 1
);

-- RLS: everyone can read ingredients (they're public seed data)
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingredients are readable by authenticated users"
  ON public.ingredients FOR SELECT
  TO authenticated
  USING (true);

------------------------------------------------------------
-- USER_INVENTORY
------------------------------------------------------------
CREATE TABLE public.user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id),
  quantity NUMERIC NOT NULL DEFAULT 0,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ingredient_id)
);

CREATE INDEX idx_user_inventory_user ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_perishable ON public.user_inventory(user_id, purchased_at);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own inventory"
  ON public.user_inventory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

------------------------------------------------------------
-- MEALS (seeded)
------------------------------------------------------------
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'dinner',
  default_servings INTEGER NOT NULL DEFAULT 4,
  prep_time_minutes INTEGER NOT NULL DEFAULT 0,
  cook_time_minutes INTEGER NOT NULL DEFAULT 0,
  total_time_minutes INTEGER NOT NULL DEFAULT 0,
  storage_type TEXT NOT NULL DEFAULT 'PAN'
    CHECK (storage_type IN ('PAN', '2-PAN', 'BAG', 'COMBO')),
  storage_instructions TEXT NOT NULL DEFAULT '',
  reheat_instructions TEXT NOT NULL DEFAULT '',
  instructions JSONB NOT NULL DEFAULT '[]',
  thumbnail_url TEXT,
  cycle INTEGER NOT NULL DEFAULT 1,
  meal_number INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  seed_version INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meals are readable by authenticated users"
  ON public.meals FOR SELECT
  TO authenticated
  USING (true);

------------------------------------------------------------
-- MEAL_INGREDIENTS (join table)
------------------------------------------------------------
CREATE TABLE public.meal_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id),
  quantity_per_serving NUMERIC NOT NULL,
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

CREATE INDEX idx_meal_ingredients_meal ON public.meal_ingredients(meal_id);

ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meal ingredients are readable by authenticated users"
  ON public.meal_ingredients FOR SELECT
  TO authenticated
  USING (true);

------------------------------------------------------------
-- COOK_LOG
------------------------------------------------------------
CREATE TABLE public.cook_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES public.meals(id),
  servings_cooked INTEGER NOT NULL DEFAULT 4
    CHECK (servings_cooked BETWEEN 1 AND 10),
  cooked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cook_log_user ON public.cook_log(user_id, cooked_at DESC);

ALTER TABLE public.cook_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own cook log"
  ON public.cook_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

------------------------------------------------------------
-- SHOPPING_LISTS
------------------------------------------------------------
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Shopping List',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_shopping_lists_user ON public.shopping_lists(user_id);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own shopping lists"
  ON public.shopping_lists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

------------------------------------------------------------
-- SHOPPING_LIST_ITEMS
------------------------------------------------------------
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id),
  quantity_needed NUMERIC NOT NULL DEFAULT 0,
  packages_to_buy INTEGER NOT NULL DEFAULT 1,
  is_checked BOOLEAN NOT NULL DEFAULT FALSE,
  checked_at TIMESTAMPTZ
);

CREATE INDEX idx_shopping_list_items_list ON public.shopping_list_items(shopping_list_id);

ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Users can access shopping list items for their own shopping lists
CREATE POLICY "Users can CRUD own shopping list items"
  ON public.shopping_list_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists sl
      WHERE sl.id = shopping_list_id
      AND sl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shopping_lists sl
      WHERE sl.id = shopping_list_id
      AND sl.user_id = auth.uid()
    )
  );

------------------------------------------------------------
-- AUTO-UPDATE updated_at TRIGGER
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- Seed: 75 Costco Master Staple Ingredients
-- shopping_aisle: 1=Produce, 2=Meat/Seafood, 3=Dairy, 4=Frozen, 5=Canned, 6=Grains/Pasta, 7=Oils/Condiments/Seasonings
-- shelf_life_days: NULL for shelf-stable, number for perishable items

INSERT INTO public.ingredients (id, name, category, default_unit, package_size, package_unit, is_perishable, shelf_life_days, shopping_aisle, notes, seed_version) VALUES

-- PROTEINS (16 items)
('00000000-0000-0000-0001-000000000001', 'Rotisserie Chicken', 'protein', 'lb', 3, 'lb', TRUE, 4, 2, '$4.99 loss leader. Shred for salads, bowls, soups, tacos.', 1),
('00000000-0000-0000-0001-000000000002', 'KS Chicken Breasts, Boneless Skinless (frozen)', 'protein', 'lb', 6.5, 'lb', FALSE, NULL, 4, 'Core lean protein. Resealable bag.', 1),
('00000000-0000-0000-0001-000000000003', 'KS Chicken Tenderloins, Boneless Skinless (frozen)', 'protein', 'lb', 6, 'lb', FALSE, NULL, 4, 'Quick-thaw. Grilling, baking, stir-fry.', 1),
('00000000-0000-0000-0001-000000000004', 'Ground Beef (fresh, 90/10 or 85/15)', 'protein', 'lb', 5, 'lb', TRUE, 3, 2, 'Sold by weight. Tacos, bolognese, chili.', 1),
('00000000-0000-0000-0001-000000000005', 'Ground Turkey (fresh)', 'protein', 'lb', 4, 'lb', TRUE, 3, 2, 'Leaner swap for ground beef.', 1),
('00000000-0000-0000-0001-000000000006', 'Ground Bison (fresh)', 'protein', 'lb', 3, 'lb', TRUE, 3, 2, 'Lower fat, higher protein than beef.', 1),
('00000000-0000-0000-0001-000000000007', 'Pork Tenderloin (fresh, 2-pack)', 'protein', 'lb', 3.5, 'lb', TRUE, 4, 2, 'Lean, versatile. Roast, slice, stir-fry.', 1),
('00000000-0000-0000-0001-000000000008', 'KS Thick Sliced Bacon (2-pack)', 'protein', 'lb', 3, 'lb', TRUE, 14, 2, 'Breakfast staple, flavor base.', 1),
('00000000-0000-0000-0001-000000000009', 'KS Frozen Wild Alaskan Sockeye Salmon Fillets', 'protein', 'lb', 3, 'lb', FALSE, NULL, 4, 'Individually vacuum-packed, 5-7 oz portions.', 1),
('00000000-0000-0000-0001-000000000010', 'Frozen Cod Fillets', 'protein', 'lb', 3, 'lb', FALSE, NULL, 4, 'Lean white fish. Tacos, baking, pan-sear.', 1),
('00000000-0000-0000-0001-000000000011', 'KS Frozen Raw Shrimp (tail-off)', 'protein', 'lb', 2, 'lb', FALSE, NULL, 4, 'Quick-thaw. Stir-fry, pasta, tacos.', 1),
('00000000-0000-0000-0001-000000000012', 'KS Canned Albacore Tuna (8-ct)', 'protein', 'can', 8, 'count', FALSE, NULL, 5, 'Solid white, packed in water. 7 oz per can.', 1),
('00000000-0000-0000-0001-000000000013', 'KS Canned Wild Alaskan Pink Salmon (6-ct)', 'protein', 'can', 6, 'count', FALSE, NULL, 5, 'Boneless, skinless. Patties, salads. 6 oz per can.', 1),
('00000000-0000-0000-0001-000000000014', 'KS Canned Chicken Breast (6-ct)', 'protein', 'can', 6, 'count', FALSE, NULL, 5, 'Chunk breast in water. 12.5 oz per can.', 1),
('00000000-0000-0000-0001-000000000015', 'KS Cage-Free Eggs (24-ct)', 'protein', 'count', 24, 'count', TRUE, 28, 3, 'Also avail in 60-ct.', 1),
('00000000-0000-0000-0001-000000000016', 'Organic Firm Tofu', 'protein', 'lb', 2, 'lb', TRUE, 7, 3, 'Plant protein. Stir-fry, scramble, soup.', 1),

-- CANNED GOODS (10 items)
('00000000-0000-0000-0002-000000000017', 'KS Organic Diced Tomatoes (8-ct)', 'canned', 'can', 8, 'count', FALSE, NULL, 5, 'Sauces, soups, chili. 14.5 oz per can.', 1),
('00000000-0000-0000-0002-000000000018', 'KS Organic Tomato Sauce (12-ct)', 'canned', 'can', 12, 'count', FALSE, NULL, 5, 'Base for marinara, enchilada, curry. 15 oz per can.', 1),
('00000000-0000-0000-0002-000000000019', 'KS Organic Tomato Paste (12-ct)', 'canned', 'can', 12, 'count', FALSE, NULL, 5, 'Concentrated flavor for sauces, stews. 6 oz per can.', 1),
('00000000-0000-0000-0002-000000000020', 'S&W Organic Black Beans (8-ct)', 'canned', 'can', 8, 'count', FALSE, NULL, 5, 'Burritos, bowls, salads, soups. 15 oz per can.', 1),
('00000000-0000-0000-0002-000000000021', 'S&W Organic Garbanzo Beans (8-ct)', 'canned', 'can', 8, 'count', FALSE, NULL, 5, 'Curries, hummus, salads, roasting. 15.5 oz per can.', 1),
('00000000-0000-0000-0002-000000000022', 'Thai Kitchen Organic Coconut Milk (6-ct)', 'canned', 'can', 6, 'count', FALSE, NULL, 5, 'Full-fat. Curries, soups, dairy-free. 13.66 fl oz per can.', 1),
('00000000-0000-0000-0002-000000000023', 'KS Organic Chicken Stock (6-ct)', 'canned', 'fl_oz', 192, 'fl_oz', FALSE, NULL, 5, '6 x 32 fl oz cartons. Soups, rice, deglazing, sauces.', 1),
('00000000-0000-0000-0002-000000000024', 'Better Than Bouillon (Chicken)', 'canned', 'oz', 8, 'oz', FALSE, NULL, 5, 'Concentrate. ~38 cups. Soups, gravies, flavor base.', 1),
('00000000-0000-0000-0002-000000000025', 'Del Monte Canned Corn, Whole Kernel (12-ct)', 'canned', 'can', 12, 'count', FALSE, NULL, 5, 'Salads, tacos, soups, cornbread. 15.25 oz per can.', 1),
('00000000-0000-0000-0002-000000000026', 'Rao''s Marinara Sauce (2-ct jars)', 'canned', 'count', 2, 'count', FALSE, NULL, 5, 'Premium jarred sauce. 28 oz per jar. Quick pasta nights.', 1),

-- GRAINS & PASTA (8 items)
('00000000-0000-0000-0003-000000000027', 'KS Thai Hom Mali Jasmine Rice', 'grain', 'lb', 25, 'lb', FALSE, NULL, 6, 'Pennies per serving. Bowls, stir-fry, sides.', 1),
('00000000-0000-0000-0003-000000000028', 'Royal Basmati Rice', 'grain', 'lb', 20, 'lb', FALSE, NULL, 6, 'Pilafs, curries, biryani.', 1),
('00000000-0000-0000-0003-000000000029', 'KS Organic Quinoa', 'grain', 'lb', 4.5, 'lb', FALSE, NULL, 6, 'Complete protein. Salads, bowls, sides.', 1),
('00000000-0000-0000-0003-000000000030', 'Dry Pasta — Spaghetti (8-pack)', 'grain', 'lb', 8, 'lb', FALSE, NULL, 6, 'Barilla/Garofalo. Core weeknight staple. 1 lb per box.', 1),
('00000000-0000-0000-0003-000000000031', 'Dry Pasta — Short Cuts (6-pack)', 'grain', 'lb', 6, 'lb', FALSE, NULL, 6, 'Penne/rotini. Baked pasta, salads, one-pot. 1 lb per box.', 1),
('00000000-0000-0000-0003-000000000032', 'Rolled Oats (large canister)', 'grain', 'lb', 5, 'lb', FALSE, NULL, 6, 'Oatmeal, baking, smoothies, overnight oats.', 1),
('00000000-0000-0000-0003-000000000033', 'Flour Tortillas (large, bulk pack)', 'grain', 'count', 20, 'count', TRUE, 14, 6, 'Burritos, wraps, quesadillas.', 1),
('00000000-0000-0000-0003-000000000034', 'Bread (Dave''s Killer or equiv., 2-pack)', 'grain', 'lb', 3.4, 'lb', TRUE, 7, 6, 'Sandwich staple. Nutrient-dense.', 1),

-- OILS, CONDIMENTS & SEASONINGS (13 items)
('00000000-0000-0000-0004-000000000035', 'KS Organic Extra Virgin Olive Oil', 'oil_condiment', 'fl_oz', 67.6, 'fl_oz', FALSE, NULL, 7, 'Cooking, dressings.', 1),
('00000000-0000-0000-0004-000000000036', 'Avocado Oil (Chosen Foods or equiv.)', 'oil_condiment', 'fl_oz', 33.8, 'fl_oz', FALSE, NULL, 7, 'High smoke point. Sauteing, roasting, air frying.', 1),
('00000000-0000-0000-0004-000000000037', 'KS Organic Virgin Coconut Oil', 'oil_condiment', 'fl_oz', 84, 'fl_oz', FALSE, NULL, 7, 'Baking, sauteing, dairy-free cooking.', 1),
('00000000-0000-0000-0004-000000000038', 'Avocado Oil Spray (2-pack)', 'oil_condiment', 'oz', 16, 'oz', FALSE, NULL, 7, 'Air fryer, sheet pan, quick grease.', 1),
('00000000-0000-0000-0004-000000000039', 'Soy Sauce (Kikkoman or KS)', 'oil_condiment', 'fl_oz', 54, 'fl_oz', FALSE, NULL, 7, 'Marinades, stir-fry, dipping.', 1),
('00000000-0000-0000-0004-000000000040', 'Balsamic Vinegar', 'oil_condiment', 'fl_oz', 33.8, 'fl_oz', FALSE, NULL, 7, 'Dressings, glazes, roasted vegetables.', 1),
('00000000-0000-0000-0004-000000000041', 'Apple Cider Vinegar', 'oil_condiment', 'fl_oz', 128, 'fl_oz', FALSE, NULL, 7, 'Dressings, marinades, baking.', 1),
('00000000-0000-0000-0004-000000000042', 'Honey (raw, large jar)', 'oil_condiment', 'oz', 80, 'oz', FALSE, NULL, 7, 'Sweetener, marinades, dressings, baking.', 1),
('00000000-0000-0000-0004-000000000043', 'Sea Salt / Himalayan Pink Salt', 'oil_condiment', 'oz', 36, 'oz', FALSE, NULL, 7, 'Universal seasoning.', 1),
('00000000-0000-0000-0004-000000000044', 'Black Pepper (large grinder)', 'oil_condiment', 'oz', 12.3, 'oz', FALSE, NULL, 7, 'Universal seasoning.', 1),
('00000000-0000-0000-0004-000000000045', 'Garlic Powder (large container)', 'oil_condiment', 'oz', 18, 'oz', FALSE, NULL, 7, 'Everyday seasoning base.', 1),
('00000000-0000-0000-0004-000000000046', 'KS Minced Garlic (jar)', 'oil_condiment', 'oz', 48, 'oz', FALSE, NULL, 7, 'Time-saver. Sautes, sauces, marinades.', 1),
('00000000-0000-0000-0004-000000000047', 'KS Organic Peanut Butter (2-ct)', 'oil_condiment', 'oz', 56, 'oz', FALSE, NULL, 7, 'Just peanuts + salt. Snack, sauces, smoothies. 28 oz per jar.', 1),

-- DAIRY & DAIRY ALTERNATIVES (9 items)
('00000000-0000-0000-0005-000000000048', 'Kerrygold Butter, Salted (4-ct sticks)', 'dairy', 'oz', 32, 'oz', TRUE, 60, 3, 'Grass-fed. Cooking, baking, finishing.', 1),
('00000000-0000-0000-0005-000000000049', 'KS Organic Greek Yogurt (plain, nonfat)', 'dairy', 'oz', 48, 'oz', TRUE, 14, 3, '18-23g protein/cup. Breakfast, sauces.', 1),
('00000000-0000-0000-0005-000000000050', 'KS Shredded Mozzarella (2-ct bags)', 'dairy', 'oz', 80, 'oz', TRUE, 21, 3, 'Pizza, baked pasta, quesadillas. 2 x 2.5 lb bags.', 1),
('00000000-0000-0000-0005-000000000051', 'KS Parmigiano Reggiano (wedge)', 'dairy', 'oz', 24, 'oz', TRUE, 42, 3, '24-mo aged, imported. Save rinds for stock.', 1),
('00000000-0000-0000-0005-000000000052', 'Tillamook Medium Cheddar Block', 'dairy', 'oz', 40, 'oz', TRUE, 28, 3, 'Slicing, shredding, snacking.', 1),
('00000000-0000-0000-0005-000000000053', 'Cream Cheese (4-ct blocks)', 'dairy', 'oz', 32, 'oz', TRUE, 21, 3, 'Philadelphia or KS. Dips, baking, sauces. 4 x 8 oz.', 1),
('00000000-0000-0000-0005-000000000054', 'Whole Milk or 2% (KS Organic)', 'dairy', 'fl_oz', 128, 'fl_oz', TRUE, 10, 3, 'Drinking, cooking, baking.', 1),
('00000000-0000-0000-0005-000000000055', 'KS Almond Milk, Unsweetened (6-ct)', 'dairy', 'fl_oz', 192, 'fl_oz', FALSE, NULL, 3, 'Shelf-stable. Dairy-free. Smoothies, cereal, coffee. 6 x 32 fl oz.', 1),
('00000000-0000-0000-0005-000000000056', 'Cottage Cheese (large tub)', 'dairy', 'oz', 48, 'oz', TRUE, 14, 3, 'High protein snack. Bowls, dips, baking sub.', 1),

-- FROZEN (12 items)
('00000000-0000-0000-0006-000000000057', 'KS Organic Frozen Broccoli Florets (4-ct bags)', 'frozen', 'lb', 4, 'lb', FALSE, NULL, 4, 'Microwavable bags. Stir-fry, soups, sides. 4 x 1 lb.', 1),
('00000000-0000-0000-0006-000000000058', 'KS Stir-Fry Vegetable Blend', 'frozen', 'lb', 5.5, 'lb', FALSE, NULL, 4, 'Quick weeknight veggie base.', 1),
('00000000-0000-0000-0006-000000000059', 'KS Organic Frozen Green Beans (extra fine)', 'frozen', 'lb', 5, 'lb', FALSE, NULL, 4, 'Side dish, casseroles, sautes.', 1),
('00000000-0000-0000-0006-000000000060', 'Frozen Cauliflower', 'frozen', 'lb', 4, 'lb', FALSE, NULL, 4, 'Rice sub, mash, roasting, soups.', 1),
('00000000-0000-0000-0006-000000000061', 'KS Three Berry Blend (frozen)', 'frozen', 'lb', 4, 'lb', FALSE, NULL, 4, 'Smoothies, oatmeal, yogurt bowls, baking.', 1),
('00000000-0000-0000-0006-000000000062', 'KS Frozen Blueberries (organic)', 'frozen', 'lb', 3, 'lb', FALSE, NULL, 4, 'Also avail: Wild Blueberries, 5 lb.', 1),
('00000000-0000-0000-0006-000000000063', 'Frozen Organic Mango Chunks', 'frozen', 'lb', 5, 'lb', FALSE, NULL, 4, 'Smoothies, salsas, desserts.', 1),
('00000000-0000-0000-0006-000000000064', 'KS Frozen Pineapple Chunks', 'frozen', 'lb', 5, 'lb', FALSE, NULL, 4, 'Smoothies, stir-fry, grilling, snacking.', 1),
('00000000-0000-0000-0006-000000000065', 'KS Frozen Chicken Tenderloins', 'frozen', 'lb', 6, 'lb', FALSE, NULL, 4, 'Same as Protein #3. Quick-thaw.', 1),
('00000000-0000-0000-0006-000000000066', 'Frozen Shelled Edamame', 'frozen', 'lb', 3, 'lb', FALSE, NULL, 4, 'High-protein snack, salad topper, stir-fry.', 1),
('00000000-0000-0000-0006-000000000067', 'Just Bare Chicken Breast Chunks (frozen)', 'frozen', 'lb', 4, 'lb', FALSE, NULL, 4, 'Lightly breaded. Air fryer ready.', 1),
('00000000-0000-0000-0006-000000000068', 'Frozen Spinach', 'frozen', 'lb', 3, 'lb', FALSE, NULL, 4, 'Smoothies, soups, scrambles, pasta add-in.', 1),

-- PRODUCE STAPLES (7 items)
('00000000-0000-0000-0007-000000000069', 'Bananas', 'produce', 'lb', 3, 'lb', TRUE, 5, 1, 'Smoothies, snacking, baking. Always in stock.', 1),
('00000000-0000-0000-0007-000000000070', 'Apples (Cosmic Crisp/Fuji/Honeycrisp)', 'produce', 'lb', 5, 'lb', TRUE, 14, 1, 'Snacking, salads. Variety rotates.', 1),
('00000000-0000-0000-0007-000000000071', 'Onions (yellow or sweet)', 'produce', 'lb', 10, 'lb', TRUE, 30, 1, 'Foundation aromatic. Every cuisine.', 1),
('00000000-0000-0000-0007-000000000072', 'Garlic (whole heads, mesh bag)', 'produce', 'lb', 2, 'lb', TRUE, 21, 1, 'Foundation aromatic.', 1),
('00000000-0000-0000-0007-000000000073', 'Potatoes (russet or gold)', 'produce', 'lb', 10, 'lb', TRUE, 21, 1, 'Roasting, mashing, baking, soups.', 1),
('00000000-0000-0000-0007-000000000074', 'Sweet Potatoes', 'produce', 'lb', 5, 'lb', TRUE, 14, 1, 'Roasting, bowls, mashing, soups.', 1),
('00000000-0000-0000-0007-000000000075', 'Baby Spinach (organic)', 'produce', 'lb', 1, 'lb', TRUE, 5, 1, 'Salads, smoothies, sautes, scrambles.', 1);
-- Seed: 14 Meals — Cycle 1 (Cook Day 1 + Cook Day 2)
-- All quantity_per_serving values are in the ingredient's default_unit, for 1 serving (default_servings = 4)

-- ============================================================
-- MEALS
-- ============================================================

INSERT INTO public.meals (id, name, description, default_servings, prep_time_minutes, cook_time_minutes, total_time_minutes, storage_type, storage_instructions, reheat_instructions, instructions, cycle, meal_number, seed_version) VALUES

-- Cook Day 1 → Week 1
('10000000-0000-0000-0000-000000000001', 'Chicken Burrito Bowls', 'Diced chicken with black beans, corn, and cheddar over jasmine rice.', 4, 15, 25, 40, 'COMBO',
  'Foil pan: diced chicken + black beans + corn mixed. Gallon bag: rice frozen flat. Quart bag: shredded cheddar.',
  'Thaw overnight. Spread rice in foil pan, cover, bake 375F 20 min. Reheat chicken-bean pan covered at 375F 25 min. Serve bowl-style with cheddar and spinach on top.',
  '[{"step":1,"text":"Season chicken breasts with salt, pepper, and garlic powder. Bake at 400F for 22-25 min."},{"step":2,"text":"Cool chicken and dice into bite-sized pieces."},{"step":3,"text":"Cook jasmine rice (1.5 cups dry for 4 servings)."},{"step":4,"text":"Drain and rinse black beans and corn."},{"step":5,"text":"Mix diced chicken, black beans, and corn together in a foil pan."},{"step":6,"text":"Portion rice into gallon freezer bag, flatten for stacking."},{"step":7,"text":"Shred cheddar into a quart bag. Keep spinach fresh for day-of."}]',
  1, 1, 1),

('10000000-0000-0000-0000-000000000002', 'Beef Bolognese over Spaghetti', 'Rich meat sauce over spaghetti with parmesan.', 4, 15, 60, 75, '2-PAN',
  'Foil pan 1: Bolognese meat sauce. Foil pan 2: cooked spaghetti tossed with EVOO. Quart bag: grated parm.',
  'Thaw overnight. Bake sauce pan covered at 375F 25-30 min, stirring halfway. Bake pasta pan covered at 350F 20 min (sprinkle 2 tbsp water over pasta before sealing). Serve sauce over pasta, top with parm.',
  '[{"step":1,"text":"Dice onion. Brown 1.5 lb ground beef with onion and minced garlic."},{"step":2,"text":"Add 3 cans diced tomatoes, 2 cans tomato paste, salt, pepper, garlic powder."},{"step":3,"text":"Simmer on low 45-60 min (this is a mega-batch — half goes to Meal 7)."},{"step":4,"text":"Cook 1.5 lb spaghetti. Drain and toss with a drizzle of EVOO."},{"step":5,"text":"Portion half the Bolognese into a foil pan."},{"step":6,"text":"Portion spaghetti into a second foil pan."},{"step":7,"text":"Grate parm into a quart bag."}]',
  1, 2, 1),

('10000000-0000-0000-0000-000000000003', 'Teriyaki Salmon & Broccoli Rice', 'Glazed salmon fillets with steamed broccoli over jasmine rice.', 4, 10, 20, 30, '2-PAN',
  'Foil pan 1: salmon fillets with steamed broccoli alongside. Foil pan 2: jasmine rice. Small jar: teriyaki glaze (fridge, don''t freeze).',
  'Thaw overnight. Bake rice pan covered at 350F 20 min. Bake salmon-broccoli pan covered at 325F 15-18 min. Drizzle glaze at the table.',
  '[{"step":1,"text":"Season 4 salmon portions with soy sauce, honey, and garlic."},{"step":2,"text":"Bake at 400F from frozen, 18-20 min."},{"step":3,"text":"Steam or roast 1 lb frozen broccoli."},{"step":4,"text":"Cook jasmine rice (1.5 cups dry)."},{"step":5,"text":"Make teriyaki glaze: soy sauce + honey + minced garlic. Store in jar in fridge."},{"step":6,"text":"Arrange salmon and broccoli in foil pan 1, rice in foil pan 2."}]',
  1, 3, 1),

('10000000-0000-0000-0000-000000000004', 'Chicken & Veggie Stir-Fry', 'Chicken strips with stir-fry vegetables in soy-garlic sauce over rice.', 4, 15, 20, 35, 'COMBO',
  'Foil pan: chicken strips + stir-fry vegetables mixed. Gallon bag: rice frozen flat. Small container: soy-garlic sauce.',
  'Thaw overnight. Spread rice in foil pan, cover, bake 375F 20 min. Reheat stir-fry pan covered at 375F 20-25 min. Toss with sauce or serve on side.',
  '[{"step":1,"text":"Thaw ~2.5 lb chicken tenderloins, slice into strips."},{"step":2,"text":"Stir-fry chicken in avocado oil with garlic and soy sauce until cooked through."},{"step":3,"text":"Cook half the stir-fry blend bag (~2.75 lb) in avocado oil with soy sauce and garlic."},{"step":4,"text":"Cook jasmine rice (1.5 cups dry)."},{"step":5,"text":"Combine chicken and vegetables in a foil pan."},{"step":6,"text":"Portion rice into gallon freezer bag."},{"step":7,"text":"Mix soy-garlic sauce in a small container."}]',
  1, 4, 1),

('10000000-0000-0000-0000-000000000005', 'Turkey Chili', 'Hearty chili with ground turkey, black beans, tomatoes, and corn.', 4, 10, 30, 40, 'PAN',
  'Single foil pan: everything in one. Quart bag: shredded cheddar for topping.',
  'Thaw overnight. Bake covered at 375F 30-35 min, stirring once halfway. Top with cheddar at the table.',
  '[{"step":1,"text":"Dice onion. Brown 2 lb ground turkey with onion and garlic."},{"step":2,"text":"Add 2 cans diced tomatoes, 1 can tomato paste, 2 cans black beans (drained), 2 cans corn (drained)."},{"step":3,"text":"Season with garlic powder, salt, pepper."},{"step":4,"text":"Simmer 30 min."},{"step":5,"text":"Ladle into a single foil pan."},{"step":6,"text":"Shred cheddar into a quart bag."}]',
  1, 5, 1),

('10000000-0000-0000-0000-000000000006', 'Coconut Shrimp Curry', 'Shrimp in coconut curry sauce with stir-fry vegetables over rice.', 4, 15, 20, 35, '2-PAN',
  'Foil pan 1: shrimp curry with vegetables in coconut sauce. Foil pan 2: jasmine rice.',
  'Thaw overnight. Bake rice pan covered at 350F 20 min. Bake curry pan covered at 350F 20-25 min (don''t go higher — coconut milk can break at high heat). Stir gently.',
  '[{"step":1,"text":"Thaw 2 lb shrimp. Quick saute in coconut oil with garlic."},{"step":2,"text":"Saute onion and garlic in coconut oil."},{"step":3,"text":"Add 2 cans coconut milk, 1 tbsp soy sauce, salt. Simmer 10 min."},{"step":4,"text":"Add remaining stir-fry vegetables and shrimp to the curry."},{"step":5,"text":"Cook jasmine rice (1.5 cups dry)."},{"step":6,"text":"Portion curry into pan 1, rice into pan 2."}]',
  1, 6, 1),

('10000000-0000-0000-0000-000000000007', 'Baked Penne Bolognese', 'Penne with Bolognese sauce, spinach, and bubbly mozzarella.', 4, 10, 40, 50, 'PAN',
  'Single foil pan: fully assembled casserole — penne + Bolognese + spinach + tomato sauce + mozzarella on top.',
  'Thaw overnight. Bake covered at 375F 30 min, then uncover and bake 10 min more until cheese is bubbly and golden.',
  '[{"step":1,"text":"Cook 2 lb short-cut pasta (penne). Drain."},{"step":2,"text":"Thaw and squeeze dry frozen spinach."},{"step":3,"text":"Layer in foil pan: penne → remaining Bolognese from Meal 2 → squeezed spinach → tomato sauce → mozzarella on top."},{"step":4,"text":"If eating now, bake at 375F for 20 min uncovered. Otherwise seal and freeze."}]',
  1, 7, 1),

-- Cook Day 2 → Week 2
('10000000-0000-0000-0000-000000000008', 'Chicken Tikka-Style Bowls', 'Tikka-spiced chicken with garbanzo beans in creamy tomato sauce over basmati rice.', 4, 20, 25, 45, '2-PAN',
  'Foil pan 1: tikka chicken chunks in sauce + garbanzo beans. Foil pan 2: basmati rice. Fresh spinach day-of.',
  'Thaw overnight. Bake rice pan covered at 350F 20 min. Bake tikka pan covered at 375F 25-30 min, stirring once. Serve over rice with fresh spinach.',
  '[{"step":1,"text":"Cut ~3 lb chicken breast into chunks."},{"step":2,"text":"Marinate in yogurt + garlic + tomato paste + garlic powder + salt."},{"step":3,"text":"Bake at 425F for 18-20 min."},{"step":4,"text":"Make tikka sauce: saute onion and garlic, add 2 cans tomato sauce + 1 can tomato paste + garlic powder + salt. Simmer 15 min. Stir in yogurt."},{"step":5,"text":"Cook basmati rice (2 cups dry)."},{"step":6,"text":"Combine chicken and drained garbanzo beans in tikka sauce."},{"step":7,"text":"Portion into pan 1 (tikka) and pan 2 (rice)."}]',
  1, 8, 1),

('10000000-0000-0000-0000-000000000009', 'Roasted Pork Tenderloin Plates', 'Sliced pork medallions with roasted sweet potatoes and buttered green beans.', 4, 15, 30, 45, '2-PAN',
  'Foil pan 1: sliced pork medallions. Foil pan 2: roasted sweet potatoes and sauteed green beans.',
  'Thaw overnight. Bake both pans covered at 350F 20-25 min.',
  '[{"step":1,"text":"Season both pork tenderloins with salt, pepper, garlic powder. Drizzle olive oil."},{"step":2,"text":"Roast at 400F for 20-25 min until 145F internal. Rest 10 min, slice into medallions."},{"step":3,"text":"Cube sweet potatoes, toss with avocado oil, salt, pepper. Roast at 400F 25-30 min."},{"step":4,"text":"Saute 2 lb frozen green beans in butter with minced garlic, salt, pepper."},{"step":5,"text":"Arrange pork medallions in pan 1."},{"step":6,"text":"Sweet potatoes and green beans in pan 2."}]',
  1, 9, 1),

('10000000-0000-0000-0000-000000000010', 'Fish Taco Kits', 'Seasoned cod with black beans, corn, and cabbage in flour tortillas.', 4, 15, 15, 30, 'COMBO',
  'Gallon bag 1: seasoned cod flakes + black beans + corn frozen flat. Gallon bag 2: shredded cabbage or spinach (fridge). Tortillas in original packaging.',
  'Thaw fish-bean bag overnight. Transfer to foil pan, cover, bake 350F 15-20 min. Warm tortillas in dry skillet or foil in oven. Assemble at the table.',
  '[{"step":1,"text":"Season ~2 lb thawed cod with garlic powder, salt, pepper."},{"step":2,"text":"Pan-sear in avocado oil 3-4 min per side. Break into large flakes."},{"step":3,"text":"Drain and rinse black beans and corn."},{"step":4,"text":"Mix cod flakes, beans, and corn in gallon bag. Freeze flat."},{"step":5,"text":"Shred cabbage (or use baby spinach) into second bag. Refrigerate."},{"step":6,"text":"Keep tortillas in original packaging."}]',
  1, 10, 1),

('10000000-0000-0000-0000-000000000011', 'Peanut Chicken Noodles', 'Spaghetti in creamy peanut sauce with shredded chicken and edamame.', 4, 15, 20, 35, 'PAN',
  'Single foil pan: spaghetti + peanut sauce + shredded chicken + edamame all combined. Extra sauce drizzled on top.',
  'Thaw overnight. Sprinkle 3-4 tbsp water over top, cover tightly. Bake at 350F 25-30 min. Toss gently before serving.',
  '[{"step":1,"text":"Poach or bake ~2.5 lb chicken tenderloins. Shred."},{"step":2,"text":"Cook 1.5 lb spaghetti."},{"step":3,"text":"Make peanut sauce: 1 cup peanut butter + 1/4 cup soy sauce + 2 tbsp honey + 2 tbsp minced garlic + warm water to thin."},{"step":4,"text":"Cook edamame."},{"step":5,"text":"Toss spaghetti with peanut sauce, shredded chicken, and edamame."},{"step":6,"text":"Portion into foil pan. Drizzle extra sauce on top before freezing."}]',
  1, 11, 1),

('10000000-0000-0000-0000-000000000012', 'Beef & Black Bean Burritos', 'Seasoned beef and bean filling with rice and cheddar in flour tortillas.', 4, 15, 20, 35, 'COMBO',
  'Foil pan: beef + bean + corn filling. Gallon bag: rice frozen flat. Quart bag: shredded cheddar. Tortillas in original packaging.',
  'Thaw overnight. Bake filling pan covered at 375F 20-25 min. Spread rice in foil pan, bake alongside 375F 20 min. Warm tortillas. Assemble at the table.',
  '[{"step":1,"text":"Brown ~2 lb ground beef with diced onion, garlic, salt, pepper, garlic powder."},{"step":2,"text":"Add 1 can black beans (drained), 1 can corn (drained). Mix well."},{"step":3,"text":"Cook jasmine rice (1.5 cups dry)."},{"step":4,"text":"Portion filling into foil pan, rice into gallon bag."},{"step":5,"text":"Shred cheddar into quart bag."}]',
  1, 12, 1),

('10000000-0000-0000-0000-000000000013', 'Salmon Quinoa Power Bowls', 'Flaked salmon with edamame and spinach over quinoa with balsamic vinaigrette.', 4, 10, 25, 35, '2-PAN',
  'Foil pan 1: flaked salmon + edamame + squeezed spinach (layered, not mixed). Foil pan 2: quinoa. Small jar: balsamic vinaigrette (fridge).',
  'Thaw overnight. Bake quinoa pan covered at 350F 20 min. Bake salmon pan covered at 325F 15-18 min. Drizzle vinaigrette at the table.',
  '[{"step":1,"text":"Season 4 salmon portions with salt, pepper, olive oil. Bake at 400F 18-20 min. Cool and flake."},{"step":2,"text":"Cook 1.5 cups dry quinoa."},{"step":3,"text":"Cook edamame. Thaw and squeeze spinach."},{"step":4,"text":"Layer in pan 1: flaked salmon, edamame, spinach (keep distinct)."},{"step":5,"text":"Quinoa in pan 2."},{"step":6,"text":"Make vinaigrette: EVOO + balsamic + salt + pepper. Jar in fridge."}]',
  1, 13, 1),

('10000000-0000-0000-0000-000000000014', 'Chicken Parm & Pasta', 'Just Bare chicken chunks with marinara, mozzarella, and parmesan over spaghetti.', 4, 10, 35, 45, '2-PAN',
  'Foil pan 1: Just Bare chunks topped with Rao''s marinara + mozzarella + parm. Foil pan 2: spaghetti with EVOO.',
  'Thaw overnight. Bake chicken parm pan covered at 375F 25 min, then uncover 10 min until cheese is bubbly. Bake pasta pan covered at 350F 20 min. Serve chicken over pasta.',
  '[{"step":1,"text":"Bake or air-fry Just Bare chicken chunks per package directions."},{"step":2,"text":"Cook 1 lb spaghetti. Toss with EVOO."},{"step":3,"text":"Spread chicken in foil pan 1. Top with Rao''s marinara, shredded mozzarella, grated parm."},{"step":4,"text":"Spaghetti in pan 2."}]',
  1, 14, 1);
-- Seed: Meal Ingredients for Cycle 1 (14 meals)
-- quantity_per_serving is normalized to the ingredient's default_unit, per 1 serving
-- Total for 4 servings = quantity_per_serving × 4

-- ============================================================
-- Meal 1: Chicken Burrito Bowls (serves 4)
-- Total: ~3 lb chicken, 2 cans black beans, 1 can corn, ~2 cups rice, cheddar, spinach
-- ============================================================
INSERT INTO public.meal_ingredients (meal_id, ingredient_id, quantity_per_serving, is_optional, notes) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 0.75, FALSE, 'diced'),       -- Chicken Breast: 3 lb / 4 = 0.75 lb
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000027', 0.375, FALSE, NULL),          -- Jasmine Rice: 1.5 lb / 4 = 0.375 lb (1.5 cups dry ≈ 1.5 lb cooked base)
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000020', 0.5, FALSE, 'drained'),       -- Black Beans: 2 cans / 4 = 0.5 can
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000025', 0.25, FALSE, 'drained'),      -- Corn: 1 can / 4 = 0.25 can
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0005-000000000052', 2, FALSE, 'shredded'),        -- Cheddar: 8 oz / 4 = 2 oz
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0007-000000000075', 0.0625, TRUE, 'fresh, day-of'), -- Baby Spinach: 0.25 lb / 4
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0004-000000000043', 0.25, FALSE, NULL),           -- Salt: ~1 oz / 4 = 0.25 oz
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0004-000000000044', 0.125, FALSE, NULL),          -- Pepper: ~0.5 oz / 4
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0004-000000000045', 0.25, FALSE, NULL),           -- Garlic Powder: ~1 oz / 4

-- ============================================================
-- Meal 2: Beef Bolognese over Spaghetti (serves 4)
-- Note: shares Bolognese mega-batch with Meal 7, but each meal is self-contained for ingredient tracking
-- ============================================================
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000004', 0.375, FALSE, 'browned'),     -- Ground Beef: 1.5 lb / 4 = 0.375 lb
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0003-000000000030', 0.375, FALSE, NULL),          -- Spaghetti: 1.5 lb / 4 = 0.375 lb
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0002-000000000017', 0.375, FALSE, NULL),          -- Diced Tomatoes: 1.5 cans / 4 = 0.375 can
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0002-000000000019', 0.25, FALSE, NULL),           -- Tomato Paste: 1 can / 4 = 0.25 can
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0005-000000000051', 0.75, FALSE, 'grated'),       -- Parm: 3 oz / 4 = 0.75 oz
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0007-000000000071', 0.125, FALSE, 'diced'),       -- Onion: 0.5 lb / 4 = 0.125 lb
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0004-000000000046', 0.5, FALSE, NULL),            -- Minced Garlic: 2 oz / 4 = 0.5 oz
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0004-000000000035', 0.5, FALSE, 'drizzle on pasta'), -- EVOO: 2 fl oz / 4 = 0.5 fl oz
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0004-000000000043', 0.25, FALSE, NULL),           -- Salt
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0004-000000000044', 0.125, FALSE, NULL),          -- Pepper
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0004-000000000045', 0.25, FALSE, NULL),           -- Garlic Powder

-- ============================================================
-- Meal 3: Teriyaki Salmon & Broccoli Rice (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-000000000009', 0.375, FALSE, NULL),          -- Salmon: 1.5 lb / 4 (4 portions)
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0003-000000000027', 0.375, FALSE, NULL),          -- Jasmine Rice
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0006-000000000057', 0.25, FALSE, 'steamed'),      -- Broccoli: 1 lb / 4
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0004-000000000039', 1, FALSE, 'teriyaki glaze'),   -- Soy Sauce: 4 fl oz / 4 = 1 fl oz
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0004-000000000042', 0.5, FALSE, 'teriyaki glaze'), -- Honey: 2 oz / 4 = 0.5 oz
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0004-000000000046', 0.25, FALSE, 'teriyaki glaze'), -- Minced Garlic

-- ============================================================
-- Meal 4: Chicken & Veggie Stir-Fry (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0001-000000000003', 0.625, FALSE, 'sliced into strips'), -- Chicken Tenderloins: 2.5 lb / 4
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0003-000000000027', 0.375, FALSE, NULL),          -- Jasmine Rice
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0006-000000000058', 0.344, FALSE, NULL),          -- Stir-Fry Blend: ~1.375 lb / 4 (half of 2.75 lb)
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0004-000000000039', 0.75, FALSE, NULL),           -- Soy Sauce: 3 fl oz / 4
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0004-000000000046', 0.5, FALSE, NULL),            -- Minced Garlic
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0004-000000000036', 0.5, FALSE, 'for searing'),   -- Avocado Oil: 2 fl oz / 4

-- ============================================================
-- Meal 5: Turkey Chili (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000005', 0.5, FALSE, 'browned'),       -- Ground Turkey: 2 lb / 4
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0002-000000000017', 0.5, FALSE, NULL),            -- Diced Tomatoes: 2 cans / 4
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0002-000000000019', 0.25, FALSE, NULL),           -- Tomato Paste: 1 can / 4
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0002-000000000020', 0.5, FALSE, 'drained'),       -- Black Beans: 2 cans / 4
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0002-000000000025', 0.5, FALSE, 'drained'),       -- Corn: 2 cans / 4
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0005-000000000052', 2, FALSE, 'shredded, topping'), -- Cheddar: 8 oz / 4
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0007-000000000071', 0.125, FALSE, 'diced'),       -- Onion
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0004-000000000046', 0.5, FALSE, NULL),            -- Minced Garlic
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0004-000000000045', 0.25, FALSE, NULL),           -- Garlic Powder
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0004-000000000043', 0.25, FALSE, NULL),           -- Salt
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0004-000000000044', 0.125, FALSE, NULL),          -- Pepper

-- ============================================================
-- Meal 6: Coconut Shrimp Curry (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000011', 0.5, FALSE, 'sauteed'),       -- Shrimp: 2 lb / 4
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0003-000000000027', 0.375, FALSE, NULL),          -- Jasmine Rice
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0002-000000000022', 0.5, FALSE, NULL),            -- Coconut Milk: 2 cans / 4
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0006-000000000058', 0.344, FALSE, NULL),          -- Stir-Fry Blend: ~1.375 lb / 4
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0004-000000000039', 0.25, FALSE, NULL),           -- Soy Sauce: 1 fl oz / 4 = 0.25
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0004-000000000046', 0.5, FALSE, NULL),            -- Minced Garlic
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0007-000000000071', 0.125, FALSE, 'diced'),       -- Onion
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0004-000000000037', 0.25, FALSE, 'for sauteing'), -- Coconut Oil: ~1 fl oz / 4 (using fl_oz)
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0004-000000000043', 0.25, FALSE, NULL),           -- Salt

-- ============================================================
-- Meal 7: Baked Penne Bolognese (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-000000000004', 0.375, FALSE, 'from Bolognese'), -- Ground Beef: 1.5 lb / 4
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0003-000000000031', 0.5, FALSE, NULL),            -- Short-Cut Pasta: 2 lb / 4
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0002-000000000018', 0.25, FALSE, NULL),           -- Tomato Sauce: 1 can / 4
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0002-000000000026', 0.25, FALSE, NULL),           -- Rao's Marinara: 1 jar / 4
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0005-000000000050', 4, FALSE, 'on top'),          -- Mozzarella: 16 oz / 4 = 4 oz
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0006-000000000068', 0.25, FALSE, 'thawed, squeezed'), -- Frozen Spinach: 1 lb / 4
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0002-000000000017', 0.375, FALSE, 'from Bolognese'), -- Diced Tomatoes: shared
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0002-000000000019', 0.25, FALSE, 'from Bolognese'), -- Tomato Paste: shared
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0005-000000000048', 0.25, FALSE, NULL),           -- Butter: 1 oz / 4 (for sauteing)

-- ============================================================
-- Meal 8: Chicken Tikka-Style Bowls (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0001-000000000002', 0.75, FALSE, 'chunks, marinated'), -- Chicken Breast: 3 lb / 4
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0003-000000000028', 0.5, FALSE, NULL),            -- Basmati Rice: 2 lb / 4
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0002-000000000018', 0.5, FALSE, NULL),            -- Tomato Sauce: 2 cans / 4
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0002-000000000019', 0.25, FALSE, NULL),           -- Tomato Paste: 1 can / 4
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0002-000000000021', 0.5, FALSE, 'drained'),       -- Garbanzo Beans: 2 cans / 4
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0005-000000000049', 1.5, FALSE, 'for marinade and sauce'), -- Greek Yogurt: 6 oz / 4
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0007-000000000075', 0.0625, TRUE, 'fresh, day-of'), -- Baby Spinach
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0007-000000000071', 0.125, FALSE, 'diced'),       -- Onion
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0004-000000000046', 0.5, FALSE, NULL),            -- Minced Garlic
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0004-000000000045', 0.25, FALSE, NULL),           -- Garlic Powder
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0004-000000000043', 0.25, FALSE, NULL),           -- Salt

-- ============================================================
-- Meal 9: Roasted Pork Tenderloin Plates (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0001-000000000007', 0.875, FALSE, 'sliced medallions'), -- Pork Tenderloin: 3.5 lb / 4
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0007-000000000074', 0.625, FALSE, 'cubed, roasted'),   -- Sweet Potatoes: 2.5 lb / 4
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0006-000000000059', 0.5, FALSE, 'sauteed'),       -- Green Beans: 2 lb / 4
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0005-000000000048', 0.5, FALSE, 'for green beans'), -- Butter: 2 oz / 4
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0004-000000000035', 0.5, FALSE, 'drizzle on pork'), -- EVOO
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0004-000000000036', 0.5, FALSE, 'for sweet potatoes'), -- Avocado Oil
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0004-000000000046', 0.25, FALSE, NULL),           -- Minced Garlic
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0004-000000000043', 0.25, FALSE, NULL),           -- Salt
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0004-000000000044', 0.125, FALSE, NULL),          -- Pepper
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0004-000000000045', 0.25, FALSE, NULL),           -- Garlic Powder

-- ============================================================
-- Meal 10: Fish Taco Kits (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0001-000000000010', 0.5, FALSE, 'seared, flaked'), -- Cod: 2 lb / 4
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0003-000000000033', 2, FALSE, NULL),              -- Flour Tortillas: 8 / 4 = 2 per serving
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0002-000000000020', 0.25, FALSE, 'drained'),      -- Black Beans: 1 can / 4
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0002-000000000025', 0.25, FALSE, 'drained'),      -- Corn: 1 can / 4
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0007-000000000075', 0.0625, TRUE, 'sub for cabbage'), -- Baby Spinach
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0004-000000000036', 0.5, FALSE, 'for searing'),   -- Avocado Oil
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0004-000000000045', 0.125, FALSE, NULL),          -- Garlic Powder
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0004-000000000043', 0.125, FALSE, NULL),          -- Salt
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0004-000000000044', 0.0625, FALSE, NULL),         -- Pepper

-- ============================================================
-- Meal 11: Peanut Chicken Noodles (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0001-000000000003', 0.625, FALSE, 'shredded'),    -- Chicken Tenderloins: 2.5 lb / 4
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0003-000000000030', 0.375, FALSE, NULL),          -- Spaghetti: 1.5 lb / 4
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0004-000000000047', 2, FALSE, 'peanut sauce'),    -- Peanut Butter: 8 oz / 4 (1 cup ≈ 8 oz)
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0004-000000000039', 1, FALSE, 'peanut sauce'),    -- Soy Sauce: 4 fl oz / 4 (1/4 cup)
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0004-000000000042', 0.5, FALSE, 'peanut sauce'),  -- Honey: 2 oz / 4 (2 tbsp)
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0004-000000000046', 0.5, FALSE, 'peanut sauce'),  -- Minced Garlic: 2 oz / 4 (2 tbsp)
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0006-000000000066', 0.1875, FALSE, NULL),         -- Edamame: 0.75 lb / 4

-- ============================================================
-- Meal 12: Beef & Black Bean Burritos (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0001-000000000004', 0.5, FALSE, 'seasoned'),      -- Ground Beef: 2 lb / 4
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0003-000000000033', 2, FALSE, NULL),              -- Flour Tortillas: 8 / 4
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0003-000000000027', 0.375, FALSE, NULL),          -- Jasmine Rice
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0002-000000000020', 0.25, FALSE, 'drained'),      -- Black Beans: 1 can / 4
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0002-000000000025', 0.25, FALSE, 'drained'),      -- Corn: 1 can / 4
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0005-000000000052', 2, FALSE, 'shredded'),        -- Cheddar: 8 oz / 4
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0007-000000000071', 0.125, FALSE, 'diced'),       -- Onion
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0004-000000000046', 0.25, FALSE, NULL),           -- Minced Garlic
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0004-000000000045', 0.125, FALSE, NULL),          -- Garlic Powder
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0004-000000000043', 0.125, FALSE, NULL),          -- Salt
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0004-000000000044', 0.0625, FALSE, NULL),         -- Pepper

-- ============================================================
-- Meal 13: Salmon Quinoa Power Bowls (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0001-000000000009', 0.375, FALSE, 'flaked'),      -- Salmon: 1.5 lb / 4
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0003-000000000029', 0.375, FALSE, NULL),          -- Quinoa: 1.5 lb / 4
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0006-000000000066', 0.1875, FALSE, NULL),         -- Edamame: 0.75 lb / 4
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0006-000000000068', 0.25, FALSE, 'thawed, squeezed'), -- Frozen Spinach: 1 lb / 4
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0004-000000000035', 0.5, FALSE, 'vinaigrette'),   -- EVOO
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0004-000000000040', 0.5, FALSE, 'vinaigrette'),   -- Balsamic Vinegar
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0004-000000000043', 0.125, FALSE, NULL),          -- Salt
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0004-000000000044', 0.0625, FALSE, NULL),         -- Pepper

-- ============================================================
-- Meal 14: Chicken Parm & Pasta (serves 4)
-- ============================================================
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0006-000000000067', 0.5, FALSE, 'baked/air-fried'), -- Just Bare Chunks: 2 lb / 4
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0003-000000000030', 0.25, FALSE, NULL),           -- Spaghetti: 1 lb / 4
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0002-000000000026', 0.25, FALSE, NULL),           -- Rao's Marinara: 1 jar / 4
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0005-000000000050', 4, FALSE, 'shredded, on top'), -- Mozzarella: 16 oz / 4
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0005-000000000051', 0.75, FALSE, 'grated'),       -- Parm: 3 oz / 4
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0004-000000000035', 0.25, FALSE, 'on pasta'),     -- EVOO
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0005-000000000048', 0.25, FALSE, NULL);           -- Butter: 1 oz / 4
