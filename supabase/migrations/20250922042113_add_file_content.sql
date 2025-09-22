create table "public"."FileContent" (
    "id" uuid not null default gen_random_uuid(),
    "box" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "content" text not null default ''::text
);

alter table "public"."FileContent" enable row level security;

CREATE UNIQUE INDEX "FileContent_pkey" ON public."FileContent" USING btree (id);
alter table "public"."FileContent" add constraint "FileContent_pkey" PRIMARY KEY using index "FileContent_pkey";

alter table "public"."FileContent" add constraint "FileContent_box_fkey" FOREIGN KEY (box) REFERENCES "Box"(id) ON DELETE CASCADE not valid;
alter table "public"."FileContent" validate constraint "FileContent_box_fkey";

grant delete on table "public"."FileContent" to "anon";
grant insert on table "public"."FileContent" to "anon";
grant references on table "public"."FileContent" to "anon";
grant select on table "public"."FileContent" to "anon";
grant trigger on table "public"."FileContent" to "anon";
grant truncate on table "public"."FileContent" to "anon";
grant update on table "public"."FileContent" to "anon";

grant delete on table "public"."FileContent" to "authenticated";
grant insert on table "public"."FileContent" to "authenticated";
grant references on table "public"."FileContent" to "authenticated";
grant select on table "public"."FileContent" to "authenticated";
grant trigger on table "public"."FileContent" to "authenticated";
grant truncate on table "public"."FileContent" to "authenticated";
grant update on table "public"."FileContent" to "authenticated";

grant delete on table "public"."FileContent" to "service_role";
grant insert on table "public"."FileContent" to "service_role";
grant references on table "public"."FileContent" to "service_role";
grant select on table "public"."FileContent" to "service_role";
grant trigger on table "public"."FileContent" to "service_role";
grant truncate on table "public"."FileContent" to "service_role";
grant update on table "public"."FileContent" to "service_role";

create policy "Allow public insert on FileContent"
on "public"."FileContent"
as permissive
for insert
to anon, authenticated
with check (true);

create policy "Allow service role select on FileContent"
on "public"."FileContent"
as permissive
for select
to service_role
using (true);

create policy "Deny public select on FileContent"
on "public"."FileContent"
as permissive
for select
to anon, authenticated
using (false);