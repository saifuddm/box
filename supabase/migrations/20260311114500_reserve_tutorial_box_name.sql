-- Reserve the tutorial name for system-created boxes only.
-- 1) Enforce at most one tutorial box (case-insensitive, trimmed)
-- 2) Block anon/authenticated inserts that use the reserved name.
--    (service_role bypasses RLS, so tutorial-box Edge Function can still create it.)

do $$
begin
  if (
    select count(*)
    from public."Box"
    where lower(btrim(name)) = 'tutorial'
  ) > 1 then
    raise exception 'Multiple tutorial boxes already exist; reduce to one before applying migration.';
  end if;
end $$;

create unique index if not exists "box_single_tutorial_name_idx"
  on public."Box" ((lower(btrim(name))))
  where lower(btrim(name)) = 'tutorial';

drop policy if exists "Block reserved tutorial name on Box insert" on public."Box";

create policy "Block reserved tutorial name on Box insert"
on public."Box"
as restrictive
for insert
to anon, authenticated
with check (lower(btrim(name)) <> 'tutorial');
