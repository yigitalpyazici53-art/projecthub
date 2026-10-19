-- is_ai_generated is superseded by the trigger-derived is_seed (which matched
-- it row for row). Nothing depended on it but its own column defaults.
alter table public.profiles drop column if exists is_ai_generated;
alter table public.projects drop column if exists is_ai_generated;
