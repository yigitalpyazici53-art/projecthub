-- A real link field for projects. Until now /projects/new and onboarding
-- appended "GitHub: <url>" to tech_stack, where it showed up as a tech pill.
-- Only http(s) URLs are accepted, so a stored value is always safe as an href.

alter table public.projects add column if not exists link_url text;

alter table public.projects drop constraint if exists projects_link_url_http;
alter table public.projects
  add constraint projects_link_url_http
  check (link_url is null or link_url ~* '^https?://[^\s]+$');

-- Move links out of tech_stack: take the first http(s) URL, then strip the
-- "<Label>: <url>" segment (and a dangling " | " separator) from tech_stack.
update public.projects
set
  link_url = substring(tech_stack from '(https?://[^\s|,]+)'),
  tech_stack = nullif(
    trim(both ' |,' from regexp_replace(
      tech_stack,
      '\s*\|?\s*((GitHub|Link|Website|Demo)\s*:\s*)?https?://[^\s|,]+',
      '',
      'gi'
    )),
    ''
  )
where link_url is null
  and tech_stack ~* 'https?://';
