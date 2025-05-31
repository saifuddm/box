drop policy "Allow public select on Box" on "public"."Box";

revoke select on table "public"."TextContent" from "anon";

revoke select on table "public"."TextContent" from "authenticated";

create policy "Allow service role select on TextContent"
on "public"."Box"
as permissive
for select
to service_role
using (true);



