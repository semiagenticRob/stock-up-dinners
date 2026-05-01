-- Live shopping sessions (spec § 8.2 / spec § 6.3 commit step).
--
-- Two tables: a session header and a line-item child. On commit we convert
-- each line item into a pantry_lot in the same transaction (via the
-- commit_shopping_session() function below).

create table public.shopping_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_shopping_sessions
  before update on public.shopping_sessions
  for each row execute function public.set_updated_at();

create index idx_shopping_sessions_user_open
  on public.shopping_sessions(user_id)
  where committed_at is null;

create table public.shopping_session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.shopping_sessions(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  source_sku_id uuid references public.costco_skus(id) on delete set null,
  /** Quantity in the ingredient's canonical_unit, totaled for the line. */
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_shopping_session_items
  before update on public.shopping_session_items
  for each row execute function public.set_updated_at();

create index idx_session_items_session on public.shopping_session_items(session_id);

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.shopping_sessions enable row level security;
create policy "users_select_own" on public.shopping_sessions for select using (auth.uid() = user_id);
create policy "users_insert_own" on public.shopping_sessions for insert with check (auth.uid() = user_id);
create policy "users_update_own" on public.shopping_sessions for update using (auth.uid() = user_id);
create policy "users_delete_own" on public.shopping_sessions for delete using (auth.uid() = user_id);

alter table public.shopping_session_items enable row level security;
create policy "session_items_select" on public.shopping_session_items for select using (
  exists (select 1 from public.shopping_sessions s
            where s.id = shopping_session_items.session_id and s.user_id = auth.uid())
);
create policy "session_items_insert" on public.shopping_session_items for insert with check (
  exists (select 1 from public.shopping_sessions s
            where s.id = shopping_session_items.session_id and s.user_id = auth.uid())
);
create policy "session_items_update" on public.shopping_session_items for update using (
  exists (select 1 from public.shopping_sessions s
            where s.id = shopping_session_items.session_id and s.user_id = auth.uid())
);
create policy "session_items_delete" on public.shopping_session_items for delete using (
  exists (select 1 from public.shopping_sessions s
            where s.id = shopping_session_items.session_id and s.user_id = auth.uid())
);

-- =============================================================================
-- commit_shopping_session — atomically turn a session into pantry lots
-- =============================================================================
--
-- Walks shopping_session_items, derives expires_on from the ingredient's
-- shelf life for its default storage state, inserts pantry_lots, marks the
-- session committed_at = now().
--
-- Returns: count of pantry_lots inserted.

create or replace function public.commit_shopping_session(p_session_id uuid)
returns int
language plpgsql
security invoker
as $$
declare
  v_owner uuid;
  v_committed timestamptz;
  v_count int := 0;
  v_today date := current_date;
  v_item record;
  v_ing record;
  v_expires date;
begin
  select user_id, committed_at into v_owner, v_committed
    from public.shopping_sessions
    where id = p_session_id
    for update;
  if v_owner is null then
    raise exception 'Shopping session % not found', p_session_id;
  end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'Shopping session % does not belong to caller', p_session_id;
  end if;
  if v_committed is not null then
    raise exception 'Shopping session % is already committed', p_session_id;
  end if;

  for v_item in
    select id, ingredient_id, source_sku_id, quantity
      from public.shopping_session_items
      where session_id = p_session_id
  loop
    select id, default_storage,
           shelf_life_pantry_days, shelf_life_fridge_days, shelf_life_freezer_days
      into v_ing
      from public.ingredients
      where id = v_item.ingredient_id;

    if v_ing.id is null then
      raise exception 'Unknown ingredient %', v_item.ingredient_id;
    end if;

    v_expires := case v_ing.default_storage
      when 'frozen' then
        case when v_ing.shelf_life_freezer_days is null then null
             else v_today + v_ing.shelf_life_freezer_days end
      when 'refrigerated' then
        case when v_ing.shelf_life_fridge_days is null then null
             else v_today + v_ing.shelf_life_fridge_days end
      else
        case when v_ing.shelf_life_pantry_days is null then null
             else v_today + v_ing.shelf_life_pantry_days end
    end;

    insert into public.pantry_lots(
      user_id, ingredient_id, source_sku_id,
      quantity_initial, quantity_remaining,
      acquired_on, storage_state, expires_on
    ) values (
      v_owner, v_item.ingredient_id, v_item.source_sku_id,
      v_item.quantity, v_item.quantity,
      v_today, v_ing.default_storage, v_expires
    );
    v_count := v_count + 1;
  end loop;

  update public.shopping_sessions
    set committed_at = now()
    where id = p_session_id;

  return v_count;
end;
$$;

revoke all on function public.commit_shopping_session(uuid) from public;
grant execute on function public.commit_shopping_session(uuid) to authenticated;
