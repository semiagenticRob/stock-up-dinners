-- Bump the use-soon threshold default from 3 days to 7 days.
--
-- Driven by product feedback during the M2 settings build: 3 days is too tight
-- for real-life use and missed too many items the user wanted flagged early.
-- 7 days is the new default for new users; existing rows still on the old
-- default value (3) are bumped — leaving customized values alone.

alter table public.user_preferences
  alter column use_soon_threshold_days set default 7;

update public.user_preferences
  set use_soon_threshold_days = 7
  where use_soon_threshold_days = 3;
