-- v2 initial schema — implements docs/specs/2026-04-30-v2-web-rebuild-spec.md § 5.
--
-- Conventions:
--   * UUID primary keys via gen_random_uuid().
--   * created_at / updated_at on every table (updated_at maintained by trigger).
--   * All weights in grams (integer). All volumes in milliliters (integer).
--     All counts as integers. Unit choice is per-ingredient via canonical_unit.
--   * RLS enabled on every user-owned table; catalog tables are world-readable
--     to authenticated users and writable only via service-role.

create extension if not exists "pgcrypto";

-- =============================================================================
-- Generic timestamp trigger
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Enums
-- =============================================================================

create type public.canonical_unit as enum ('grams', 'milliliters', 'count');
create type public.storage_state as enum ('pantry', 'refrigerated', 'frozen');
create type public.subscription_status as enum (
  'none', 'trialing', 'active', 'past_due', 'canceled'
);
create type public.receipt_scan_status as enum (
  'uploaded', 'processing', 'awaiting_review', 'committed', 'failed'
);
create type public.suggestion_tier as enum (
  'perishable_priority', 'cookable', 'substitutable', 'almost'
);

-- =============================================================================
-- Catalog tables (admin-managed; readable by authenticated users)
-- =============================================================================

create table public.substitution_groups (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_substitution_groups
  before update on public.substitution_groups
  for each row execute function public.set_updated_at();

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  canonical_unit public.canonical_unit not null,
  category text not null,
  shelf_life_pantry_days integer,
  shelf_life_fridge_days integer,
  shelf_life_freezer_days integer,
  default_storage public.storage_state not null,
  is_assumed_staple boolean not null default false,
  substitution_group_id uuid references public.substitution_groups(id) on delete set null,
  allergen_tags text[] not null default '{}',
  dietary_tags text[] not null default '{}',
  meat_type text,
  default_par integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_ingredients
  before update on public.ingredients
  for each row execute function public.set_updated_at();

create index idx_ingredients_substitution_group
  on public.ingredients(substitution_group_id)
  where substitution_group_id is not null;
create index idx_ingredients_category on public.ingredients(category);

create table public.costco_skus (
  id uuid primary key default gen_random_uuid(),
  sku_code text,
  display_name text not null,
  receipt_aliases text[] not null default '{}',
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_costco_skus
  before update on public.costco_skus
  for each row execute function public.set_updated_at();

create index idx_costco_skus_active on public.costco_skus(is_active) where is_active;

create table public.sku_ingredient_mappings (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references public.costco_skus(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_sku_ingredient_mappings
  before update on public.sku_ingredient_mappings
  for each row execute function public.set_updated_at();

create index idx_sku_mappings_sku on public.sku_ingredient_mappings(sku_id);
create index idx_sku_mappings_ingredient on public.sku_ingredient_mappings(ingredient_id);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  servings integer not null check (servings > 0),
  prep_minutes integer,
  cook_minutes integer,
  instructions jsonb not null default '[]'::jsonb,
  hero_image_url text,
  dietary_tags text[] not null default '{}',
  meat_types text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_recipes
  before update on public.recipes
  for each row execute function public.set_updated_at();

create index idx_recipes_active on public.recipes(is_active) where is_active;

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  display_quantity text,
  allow_substitution boolean not null default true,
  is_optional boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_recipe_ingredients
  before update on public.recipe_ingredients
  for each row execute function public.set_updated_at();

create index idx_recipe_ingredients_recipe on public.recipe_ingredients(recipe_id);
create index idx_recipe_ingredients_ingredient on public.recipe_ingredients(ingredient_id);

-- =============================================================================
-- User-owned tables (RLS-isolated by user_id = auth.uid())
-- =============================================================================

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarded_at timestamptz,
  stripe_customer_id text unique,
  subscription_status public.subscription_status not null default 'none',
  subscription_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_user_profiles
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dietary_filters text[] not null default '{}',
  blocked_ingredients uuid[] not null default '{}',
  blocked_meats text[] not null default '{}',
  allergens text[] not null default '{}',
  use_soon_threshold_days integer not null default 3 check (use_soon_threshold_days between 1 and 14),
  default_threshold_pct integer not null default 15 check (default_threshold_pct between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_user_preferences
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

create table public.pantry_lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  source_sku_id uuid references public.costco_skus(id) on delete set null,
  quantity_initial integer not null check (quantity_initial > 0),
  quantity_remaining integer not null check (quantity_remaining >= 0),
  acquired_on date not null,
  storage_state public.storage_state not null,
  expires_on date,
  is_depleted boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pantry_lots_remaining_le_initial
    check (quantity_remaining <= quantity_initial)
);
create trigger set_updated_at_pantry_lots
  before update on public.pantry_lots
  for each row execute function public.set_updated_at();

create index idx_pantry_lots_user_ingredient_active
  on public.pantry_lots(user_id, ingredient_id, is_depleted);
create index idx_pantry_lots_user_expires
  on public.pantry_lots(user_id, expires_on)
  where is_depleted = false;

create table public.pantry_par_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  par_quantity integer check (par_quantity > 0),
  threshold_pct integer check (threshold_pct between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ingredient_id)
);
create trigger set_updated_at_pantry_par_overrides
  before update on public.pantry_par_overrides
  for each row execute function public.set_updated_at();

create table public.cook_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  servings_cooked integer not null check (servings_cooked > 0),
  cooked_at timestamptz not null default now(),
  reverted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_cook_events
  before update on public.cook_events
  for each row execute function public.set_updated_at();

create index idx_cook_events_user_cooked_at
  on public.cook_events(user_id, cooked_at desc)
  where reverted_at is null;

create table public.cook_event_consumptions (
  id uuid primary key default gen_random_uuid(),
  cook_event_id uuid not null references public.cook_events(id) on delete cascade,
  pantry_lot_id uuid not null references public.pantry_lots(id) on delete restrict,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity_consumed integer not null check (quantity_consumed > 0),
  was_substitution boolean not null default false,
  recipe_ingredient_id uuid references public.recipe_ingredients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_cook_event_consumptions
  before update on public.cook_event_consumptions
  for each row execute function public.set_updated_at();

create index idx_cook_consumptions_event on public.cook_event_consumptions(cook_event_id);
create index idx_cook_consumptions_lot on public.cook_event_consumptions(pantry_lot_id);

create table public.recipe_suggestions_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  suggested_at timestamptz not null default now(),
  suggestion_tier public.suggestion_tier not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_recipe_suggestions_log
  before update on public.recipe_suggestions_log
  for each row execute function public.set_updated_at();

create index idx_suggestions_user_recipe_recent
  on public.recipe_suggestions_log(user_id, recipe_id, suggested_at desc);

create table public.receipt_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  status public.receipt_scan_status not null default 'uploaded',
  ocr_raw_text text,
  parsed_items jsonb,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_receipt_scans
  before update on public.receipt_scans
  for each row execute function public.set_updated_at();

create index idx_receipt_scans_user_status on public.receipt_scans(user_id, status);

-- =============================================================================
-- Row-Level Security
-- =============================================================================

-- Catalog tables: world-readable to authenticated users; writes via service-role only.
alter table public.ingredients enable row level security;
alter table public.substitution_groups enable row level security;
alter table public.costco_skus enable row level security;
alter table public.sku_ingredient_mappings enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;

create policy "catalog: ingredients readable" on public.ingredients
  for select to authenticated using (true);
create policy "catalog: substitution_groups readable" on public.substitution_groups
  for select to authenticated using (true);
create policy "catalog: costco_skus readable" on public.costco_skus
  for select to authenticated using (true);
create policy "catalog: sku_ingredient_mappings readable" on public.sku_ingredient_mappings
  for select to authenticated using (true);
create policy "catalog: recipes readable" on public.recipes
  for select to authenticated using (true);
create policy "catalog: recipe_ingredients readable" on public.recipe_ingredients
  for select to authenticated using (true);

-- User-owned tables: every CRUD verb requires auth.uid() = user_id.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'user_profiles',
    'user_preferences',
    'pantry_lots',
    'pantry_par_overrides',
    'cook_events',
    'recipe_suggestions_log',
    'receipt_scans'
  ]) loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "users_select_own" on public.%I for select using (auth.uid() = user_id)',
      t
    );
    execute format(
      'create policy "users_insert_own" on public.%I for insert with check (auth.uid() = user_id)',
      t
    );
    execute format(
      'create policy "users_update_own" on public.%I for update using (auth.uid() = user_id)',
      t
    );
    execute format(
      'create policy "users_delete_own" on public.%I for delete using (auth.uid() = user_id)',
      t
    );
  end loop;
end;
$$;

-- cook_event_consumptions has no direct user_id; isolate via cook_events.
alter table public.cook_event_consumptions enable row level security;

create policy "consumption_select_via_event" on public.cook_event_consumptions
  for select using (
    exists (
      select 1 from public.cook_events ce
      where ce.id = cook_event_consumptions.cook_event_id
        and ce.user_id = auth.uid()
    )
  );
create policy "consumption_insert_via_event" on public.cook_event_consumptions
  for insert with check (
    exists (
      select 1 from public.cook_events ce
      where ce.id = cook_event_consumptions.cook_event_id
        and ce.user_id = auth.uid()
    )
  );
create policy "consumption_update_via_event" on public.cook_event_consumptions
  for update using (
    exists (
      select 1 from public.cook_events ce
      where ce.id = cook_event_consumptions.cook_event_id
        and ce.user_id = auth.uid()
    )
  );
create policy "consumption_delete_via_event" on public.cook_event_consumptions
  for delete using (
    exists (
      select 1 from public.cook_events ce
      where ce.id = cook_event_consumptions.cook_event_id
        and ce.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Auto-create user_profiles + user_preferences on auth.users insert
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  insert into public.user_preferences (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
