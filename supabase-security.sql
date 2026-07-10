-- Run this file once in Supabase SQL Editor.
-- Admin account: alexandermuwka@gmail.com
-- Admin UID: eb549008-aaa8-43d8-a7b3-a8feb3acd167

begin;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'profile', 'cv_sections', 'projects', 'project_images',
        'services', 'contacts', 'site_settings'
      ])
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end $$;

alter table public.profile enable row level security;
alter table public.cv_sections enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.services enable row level security;
alter table public.contacts enable row level security;
alter table public.site_settings enable row level security;

create policy public_read_profile on public.profile
  for select to anon, authenticated using (true);
create policy public_read_cv on public.cv_sections
  for select to anon, authenticated using (true);
create policy public_read_services on public.services
  for select to anon, authenticated using (true);
create policy public_read_contacts on public.contacts
  for select to anon, authenticated using (true);
create policy public_read_site_settings on public.site_settings
  for select to anon, authenticated using (true);

create policy public_read_published_projects on public.projects
  for select to anon, authenticated
  using (
    status = 'published'
    or auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid
  );

create policy public_read_published_project_images on public.project_images
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = project_images.project_id
        and (
          projects.status = 'published'
          or auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid
        )
    )
  );

create policy admin_manage_profile on public.profile
  for all to authenticated
  using (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid)
  with check (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid);
create policy admin_manage_cv on public.cv_sections
  for all to authenticated
  using (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid)
  with check (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid);
create policy admin_manage_projects on public.projects
  for all to authenticated
  using (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid)
  with check (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid);
create policy admin_manage_project_images on public.project_images
  for all to authenticated
  using (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid)
  with check (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid);
create policy admin_manage_services on public.services
  for all to authenticated
  using (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid)
  with check (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid);
create policy admin_manage_contacts on public.contacts
  for all to authenticated
  using (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid)
  with check (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid);
create policy admin_manage_site_settings on public.site_settings
  for all to authenticated
  using (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid)
  with check (auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid);

grant select on public.profile, public.cv_sections, public.projects,
  public.project_images, public.services, public.contacts, public.site_settings
  to anon, authenticated;
grant insert, update, delete on public.profile, public.cv_sections, public.projects,
  public.project_images, public.services, public.contacts, public.site_settings
  to authenticated;

update storage.buckets
set public = true,
    file_size_limit = 26214400,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      'image/x-icon', 'application/pdf'
    ]
where id = 'portfolio';

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on storage.objects', policy_row.policyname);
  end loop;
end $$;

create policy public_read_portfolio_files on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'portfolio');
create policy admin_insert_portfolio_files on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portfolio'
    and auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid
  );
create policy admin_update_portfolio_files on storage.objects
  for update to authenticated
  using (
    bucket_id = 'portfolio'
    and auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid
  )
  with check (
    bucket_id = 'portfolio'
    and auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid
  );
create policy admin_delete_portfolio_files on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'portfolio'
    and auth.uid() = 'eb549008-aaa8-43d8-a7b3-a8feb3acd167'::uuid
  );

commit;
