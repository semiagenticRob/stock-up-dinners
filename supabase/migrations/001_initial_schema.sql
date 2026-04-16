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
