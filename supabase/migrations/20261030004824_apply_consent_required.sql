-- New /apply submissions must carry the 18+ and policy confirmations.
-- Applied after the form that sends them was deployed. Existing rows are
-- grandfathered (NOT VALID); they're purged by the retention job.

alter table public.builder_applications
  add constraint builder_applications_consent_required
  check (age_confirmed and policies_accepted and policy_version is not null) not valid;
