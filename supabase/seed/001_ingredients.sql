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
