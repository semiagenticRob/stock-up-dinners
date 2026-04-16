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
