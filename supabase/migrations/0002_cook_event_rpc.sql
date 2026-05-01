-- Atomic RPC functions for the cook flow.
--
-- The matching engine and FIFO decrement run in TypeScript (testable, fast,
-- no DB round-trips). The DB function takes the pre-computed consumption
-- plan and applies it atomically: insert cook_event, insert consumptions,
-- decrement lots — all in one transaction.

-- =============================================================================
-- cook_recipe — record a cook event and decrement lots
-- =============================================================================
--
-- Inputs:
--   p_user_id           — must equal auth.uid() at call time (RLS-style check)
--   p_recipe_id         — nullable for free-form cooks
--   p_servings_cooked   — positive integer
--   p_consumptions      — jsonb array of:
--     [
--       { "pantry_lot_id": uuid,
--         "ingredient_id": uuid,
--         "quantity": int,
--         "was_substitution": bool,
--         "recipe_ingredient_id": uuid|null }
--     ]
--
-- Returns: the new cook_event id.
--
-- Raises if any consumption would over-draw a lot (defense-in-depth — the
-- TS layer already checks).

create or replace function public.cook_recipe(
  p_user_id uuid,
  p_recipe_id uuid,
  p_servings_cooked int,
  p_consumptions jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_event_id uuid;
  v_consumption jsonb;
  v_lot_id uuid;
  v_lot_user uuid;
  v_lot_remaining int;
  v_quantity int;
begin
  -- Caller-claimed user must be the authenticated user.
  if p_user_id is distinct from auth.uid() then
    raise exception 'p_user_id mismatch with auth.uid()';
  end if;

  insert into public.cook_events(user_id, recipe_id, servings_cooked, cooked_at)
    values (p_user_id, p_recipe_id, p_servings_cooked, now())
    returning id into v_event_id;

  for v_consumption in
    select * from jsonb_array_elements(p_consumptions)
  loop
    v_lot_id := (v_consumption->>'pantry_lot_id')::uuid;
    v_quantity := (v_consumption->>'quantity')::int;

    -- Lock + ownership + sufficiency check.
    select user_id, quantity_remaining
      into v_lot_user, v_lot_remaining
      from public.pantry_lots
      where id = v_lot_id
      for update;

    if v_lot_user is null then
      raise exception 'Pantry lot % not found', v_lot_id;
    end if;
    if v_lot_user is distinct from p_user_id then
      raise exception 'Pantry lot % does not belong to user %', v_lot_id, p_user_id;
    end if;
    if v_lot_remaining < v_quantity then
      raise exception 'Pantry lot % only has % remaining, cannot draw %',
        v_lot_id, v_lot_remaining, v_quantity;
    end if;

    update public.pantry_lots
      set quantity_remaining = quantity_remaining - v_quantity,
          is_depleted = (quantity_remaining - v_quantity = 0)
      where id = v_lot_id;

    insert into public.cook_event_consumptions(
      cook_event_id, pantry_lot_id, ingredient_id, quantity_consumed,
      was_substitution, recipe_ingredient_id
    ) values (
      v_event_id,
      v_lot_id,
      (v_consumption->>'ingredient_id')::uuid,
      v_quantity,
      coalesce((v_consumption->>'was_substitution')::boolean, false),
      nullif(v_consumption->>'recipe_ingredient_id', '')::uuid
    );
  end loop;

  return v_event_id;
end;
$$;

-- =============================================================================
-- revert_cook_event — undo a cook
-- =============================================================================

create or replace function public.revert_cook_event(p_cook_event_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_owner uuid;
  v_already_reverted timestamptz;
  v_consumption record;
begin
  select user_id, reverted_at
    into v_owner, v_already_reverted
    from public.cook_events
    where id = p_cook_event_id
    for update;

  if v_owner is null then
    raise exception 'Cook event % not found', p_cook_event_id;
  end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'Cook event % does not belong to caller', p_cook_event_id;
  end if;
  if v_already_reverted is not null then
    raise exception 'Cook event % is already reverted', p_cook_event_id;
  end if;

  for v_consumption in
    select pantry_lot_id, quantity_consumed
      from public.cook_event_consumptions
      where cook_event_id = p_cook_event_id
  loop
    update public.pantry_lots
      set quantity_remaining = quantity_remaining + v_consumption.quantity_consumed,
          is_depleted = false
      where id = v_consumption.pantry_lot_id;
  end loop;

  update public.cook_events
    set reverted_at = now()
    where id = p_cook_event_id;
end;
$$;

-- Grant execute to authenticated role only.
revoke all on function public.cook_recipe(uuid, uuid, int, jsonb) from public;
grant execute on function public.cook_recipe(uuid, uuid, int, jsonb) to authenticated;
revoke all on function public.revert_cook_event(uuid) from public;
grant execute on function public.revert_cook_event(uuid) to authenticated;
