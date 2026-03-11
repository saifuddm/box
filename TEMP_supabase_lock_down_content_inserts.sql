-- Temporary SQL for a new Supabase migration
-- Goal: prevent direct anon/authenticated inserts into content tables.

-- 1) Remove direct INSERT privileges for public API roles.
revoke insert on table public."TextContent" from anon, authenticated;
revoke insert on table public."ImageContent" from anon, authenticated;
revoke insert on table public."FileContent" from anon, authenticated;

-- 2) Remove permissive public INSERT RLS policies.
drop policy if exists "Allow public insert on TextContent" on public."TextContent";
drop policy if exists "Allow public insert on ImageContent" on public."ImageContent";
drop policy if exists "Allow public insert on FileContent" on public."FileContent";

-- 3) Keep explicit INSERT policies for service_role (edge functions / server routes).
drop policy if exists "Allow service role insert on TextContent" on public."TextContent";
create policy "Allow service role insert on TextContent"
on public."TextContent"
as permissive
for insert
to service_role
with check (true);

drop policy if exists "Allow service role insert on ImageContent" on public."ImageContent";
create policy "Allow service role insert on ImageContent"
on public."ImageContent"
as permissive
for insert
to service_role
with check (true);

drop policy if exists "Allow service role insert on FileContent" on public."FileContent";
create policy "Allow service role insert on FileContent"
on public."FileContent"
as permissive
for insert
to service_role
with check (true);
