alter table "public"."ImageContent" drop column "file";

alter table "public"."ImageContent" add constraint "ImageContent_box_fkey" FOREIGN KEY (box) REFERENCES "Box"(id) ON DELETE CASCADE not valid;

alter table "public"."ImageContent" validate constraint "ImageContent_box_fkey";

create policy "Allow public insert on ImageContent"
on "public"."ImageContent"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Allow service role select on ImageContent"
on "public"."ImageContent"
as permissive
for select
to service_role
using (true);


create policy "Deny public select on ImageContent"
on "public"."ImageContent"
as permissive
for select
to anon, authenticated
using (false);



