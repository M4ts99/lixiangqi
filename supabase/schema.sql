create table public.player_saves (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object'
    and snapshot ? 'version'
    and snapshot->>'version' = '1'
  )
);
alter table public.player_saves enable row level security;
revoke all on public.player_saves from anon, authenticated;
grant select, insert, update on public.player_saves to authenticated;
create policy "Read own save" on public.player_saves for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Create own save" on public.player_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Update own save" on public.player_saves for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
