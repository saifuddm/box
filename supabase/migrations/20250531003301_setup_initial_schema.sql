create table "public"."Box" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "password_protected" boolean not null default false,
    "password_hash" text
);


alter table "public"."Box" enable row level security;

create table "public"."ImageContent" (
    "id" uuid not null default gen_random_uuid(),
    "box" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "content" text not null default ''::text,
    "file" text not null default ''::text
);


alter table "public"."ImageContent" enable row level security;

create table "public"."TextContent" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "content" text not null default ''::text,
    "box" uuid not null default gen_random_uuid()
);


alter table "public"."TextContent" enable row level security;

CREATE UNIQUE INDEX "Box_pkey" ON public."Box" USING btree (id);

CREATE UNIQUE INDEX "ImageContent_pkey" ON public."ImageContent" USING btree (id);

CREATE UNIQUE INDEX "TextContent_pkey" ON public."TextContent" USING btree (id);

alter table "public"."Box" add constraint "Box_pkey" PRIMARY KEY using index "Box_pkey";

alter table "public"."ImageContent" add constraint "ImageContent_pkey" PRIMARY KEY using index "ImageContent_pkey";

alter table "public"."TextContent" add constraint "TextContent_pkey" PRIMARY KEY using index "TextContent_pkey";

alter table "public"."TextContent" add constraint "TextContent_box_fkey" FOREIGN KEY (box) REFERENCES "Box"(id) ON DELETE CASCADE not valid;

alter table "public"."TextContent" validate constraint "TextContent_box_fkey";

create or replace view "public"."PublicBox" as  SELECT "Box".id,
    "Box".name,
    "Box".created_at,
    "Box".password_protected
   FROM "Box";


grant delete on table "public"."Box" to "anon";

grant insert on table "public"."Box" to "anon";

grant references on table "public"."Box" to "anon";

grant select on table "public"."Box" to "anon";

grant trigger on table "public"."Box" to "anon";

grant truncate on table "public"."Box" to "anon";

grant update on table "public"."Box" to "anon";

grant delete on table "public"."Box" to "authenticated";

grant insert on table "public"."Box" to "authenticated";

grant references on table "public"."Box" to "authenticated";

grant select on table "public"."Box" to "authenticated";

grant trigger on table "public"."Box" to "authenticated";

grant truncate on table "public"."Box" to "authenticated";

grant update on table "public"."Box" to "authenticated";

grant delete on table "public"."Box" to "service_role";

grant insert on table "public"."Box" to "service_role";

grant references on table "public"."Box" to "service_role";

grant select on table "public"."Box" to "service_role";

grant trigger on table "public"."Box" to "service_role";

grant truncate on table "public"."Box" to "service_role";

grant update on table "public"."Box" to "service_role";

grant delete on table "public"."ImageContent" to "anon";

grant insert on table "public"."ImageContent" to "anon";

grant references on table "public"."ImageContent" to "anon";

grant select on table "public"."ImageContent" to "anon";

grant trigger on table "public"."ImageContent" to "anon";

grant truncate on table "public"."ImageContent" to "anon";

grant update on table "public"."ImageContent" to "anon";

grant delete on table "public"."ImageContent" to "authenticated";

grant insert on table "public"."ImageContent" to "authenticated";

grant references on table "public"."ImageContent" to "authenticated";

grant select on table "public"."ImageContent" to "authenticated";

grant trigger on table "public"."ImageContent" to "authenticated";

grant truncate on table "public"."ImageContent" to "authenticated";

grant update on table "public"."ImageContent" to "authenticated";

grant delete on table "public"."ImageContent" to "service_role";

grant insert on table "public"."ImageContent" to "service_role";

grant references on table "public"."ImageContent" to "service_role";

grant select on table "public"."ImageContent" to "service_role";

grant trigger on table "public"."ImageContent" to "service_role";

grant truncate on table "public"."ImageContent" to "service_role";

grant update on table "public"."ImageContent" to "service_role";

grant delete on table "public"."TextContent" to "anon";

grant insert on table "public"."TextContent" to "anon";

grant references on table "public"."TextContent" to "anon";

grant trigger on table "public"."TextContent" to "anon";

grant truncate on table "public"."TextContent" to "anon";

grant update on table "public"."TextContent" to "anon";

grant delete on table "public"."TextContent" to "authenticated";

grant insert on table "public"."TextContent" to "authenticated";

grant references on table "public"."TextContent" to "authenticated";

grant trigger on table "public"."TextContent" to "authenticated";

grant truncate on table "public"."TextContent" to "authenticated";

grant update on table "public"."TextContent" to "authenticated";

grant delete on table "public"."TextContent" to "service_role";

grant insert on table "public"."TextContent" to "service_role";

grant references on table "public"."TextContent" to "service_role";

grant select on table "public"."TextContent" to "service_role";

grant trigger on table "public"."TextContent" to "service_role";

grant truncate on table "public"."TextContent" to "service_role";

grant update on table "public"."TextContent" to "service_role";

create policy "Allow public insert on Box"
on "public"."Box"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Allow public select on Box"
on "public"."Box"
as permissive
for select
to anon, authenticated
using (true);


create policy "Allow public insert on TextContent"
on "public"."TextContent"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Allow service role select on TextContent"
on "public"."TextContent"
as permissive
for select
to service_role
using (true);


create policy "Deny public select on TextContent"
on "public"."TextContent"
as permissive
for select
to anon, authenticated
using (false);



