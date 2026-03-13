-- hide content should be set per content row
alter table "public"."TextContent"
  add column "hide_content" boolean not null default false;

alter table "public"."ImageContent"
  add column "hide_content" boolean not null default false;

alter table "public"."FileContent"
  add column "hide_content" boolean not null default false;
