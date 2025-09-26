-- 1) Make the view run as invoker (Postgres 15+), so it doesn't bypass RLS
alter view public."PublicBox" set (security_invoker = true);

-- 2) Revoke overly broad table privileges from public roles
revoke all on table public."Box" from public;
revoke all on table public."Box" from anon, authenticated;

-- Keep service role full access
grant all on table public."Box" to service_role;

-- 3) Grant column-level read-only on safe columns only
grant select (id, name, created_at, password_protected) on table public."Box" to anon, authenticated;

-- 4) Ensure RLS allows selecting rows (column privacy is enforced by the grants above)
drop policy if exists "Allow public select on Box" on public."Box";
create policy "Public can select rows on Box"
on public."Box"
as permissive
for select
to anon, authenticated
using (true);

-- 5) View privileges: select-only for API roles
revoke all on table public."PublicBox" from public, anon, authenticated, service_role;
grant select on table public."PublicBox" to anon, authenticated, service_role;

-- 6) public to create boxes, grant insert and keep your insert RLS policy
grant insert on table public."Box" to anon, authenticated;