-- One-off cleanup: requests real users sent to seed (example) accounts can
-- never be answered. Remove only the PENDING ones; nothing else is touched.
-- At the time of writing this removed 26 connection requests and 1 application.

delete from public.connections c
using public.profiles receiver, public.profiles sender
where c.receiver_id = receiver.id
  and c.sender_id = sender.id
  and c.status = 'pending'
  and receiver.is_seed
  and not sender.is_seed;

delete from public.applications a
using public.projects pr, public.profiles applicant
where a.project_id = pr.id
  and a.applicant_id = applicant.id
  and a.status = 'pending'
  and pr.is_seed
  and not applicant.is_seed;
