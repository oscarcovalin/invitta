create table "public"."studio_invitations" (
  "id"                            uuid                     not null default gen_random_uuid(),
  "studio_id"                     uuid                     not null,
  "template_id"                   text,
  "title"                         text                     not null,
  "slug"                          text                     not null,
  "event_type"                    text                     default 'general'::text,
  "honoree_name"                  text,
  "event_date"                    date,
  "event_time"                    time without time zone,
  "welcome_text"                  text,
  "main_photo_url"                text,
  "gallery_urls"                  jsonb                    default '[]'::jsonb,
  "music_url"                     text,
  "color_primary"                 text,
  "color_secondary"               text,
  "font_family"                   text,
  "ceremony_name"                 text,
  "ceremony_address"              text,
  "ceremony_map_url"              text,
  "reception_name"                text,
  "reception_address"             text,
  "reception_map_url"             text,
  "gift_table_url"                text,
  "dress_code"                    text,
  "itinerary"                     jsonb                    default '[]'::jsonb,
  "whatsapp_number"               text,
  "published"                     boolean                  default false,
  "created_at"                    timestamp with time zone default now(),
  "updated_at"                    timestamp with time zone default now(),
  "father_name"                   text,
  "mother_name"                   text,
  "godparents"                    jsonb                    default '[]'::jsonb,
  "instagram_hashtag"             text,
  "font_preset"                   text                     default 'classic'::text,
  "background_image_url"          text,
  "music_title"                   text,
  "music_artist"                  text,
  "visual_theme"                  text                     default 'rose-floral'::text,
  "thank_you_title"               text                     default 'Con cariño'::text,
  "thank_you_message"             text                     default 'Gracias por ser parte de mis XV años'::text,
  "thank_you_signature"           text                     default ''::text,
  "hashtag_section_title"         text                     default 'Comparte el momento'::text,
  "hashtag_section_message"       text                     default 'Usa el hashtag en tus fotos y videos para que no se pierda ningún recuerdo.'::text,
  "studio_name"                   text                     default 'Invitta Studio'::text,
  "studio_logo_url"               text                     default ''::text,
  "music_player_brand_enabled"    boolean                  default true,
  "studio_whatsapp"               text                     default ''::text,
  "studio_cta_enabled"            boolean                  default true,
  "studio_cta_text"               text                     default 'Quiero una invitación así'::text,
  "studio_cta_message"            text                     default 'Hola, me interesa contratar una invitación digital como esta.'::text,
  "link_builder_enabled"          boolean                  default true,
  "link_builder_pin"              text                     default ''::text,
  "link_builder_title"            text                     default 'Generador de pase personalizado'::text,
  "link_builder_message"          text                     default 'Crea un enlace rápido para invitados de último momento.'::text,
  "evento_id"                     uuid,
  "published_at"                  timestamp with time zone,
  "expires_at"                    timestamp with time zone,
  "palette_preset"                text                     not null default 'original'::text,
  "title_color"                   text,
  "body_color"                    text,
  "accent_color"                  text,
  "custom_font_url"               text,
  "custom_font_name"              text,
  "custom_font_targets"           text[]                   not null default ARRAY['titles'::text,
  'subtitles'::text,
  'names'::text],
  "client_dashboard_email"        text,
  "client_dashboard_user_id"      uuid,
  "client_dashboard_enabled"      boolean                  not null default false,
  "client_dashboard_last_sent_at" timestamp with time zone,
  "section_backgrounds"           jsonb                    not null default '{}'::jsonb,
  "typography_fonts"              jsonb                    default '{}'::jsonb,
  "bg_enabled"                    boolean                  default false,
  "bg_scope"                      text                     default 'all'::text,
  "bg_overlay_enabled"            boolean                  default true,
  "bg_overlay_color"              text                     default '#000000'::text,
  "bg_overlay_opacity"            numeric                  default 0.35,
  "bg_position"                   text                     default 'center'::text,
  "bg_size"                       text                     default 'cover'::text,
  "bg_blur"                       integer                  default 0,
  "credit_cost"                   integer                  not null default 1,
  "credit_charged_at"             timestamp with time zone,
  "qr_enabled"                    boolean                  not null default false,
  "qr_credit_cost"                integer                  not null default 0,
  "qr_credit_charged_at"          timestamp with time zone,
  "gift_options"                  jsonb                    not null default '[]'::jsonb,
  "dress_code_details"            text,
  "children_note"                 text,
  "children_label"                text,
  "section_visibility"            jsonb                    not null default '{}'::jsonb,
  "bg_image_opacity"              numeric                  not null default 0.18,
  "bride_father_name"             text,
  "bride_mother_name"             text,
  "groom_father_name"             text,
  "groom_mother_name"             text,
  "honor_witness_name"            text,
  "shared_album_enabled"          boolean                  not null default false,
  "lodging_options"               jsonb                    not null default '[]'::jsonb,
  constraint "studio_invitations_bg_image_opacity_range" check (((bg_image_opacity >= (0)::numeric) AND (bg_image_opacity <= 0.60))),
  constraint "studio_invitations_client_dashboard_user_id_fkey" foreign key (client_dashboard_user_id) references auth.users(id) on delete set null,
  constraint "studio_invitations_credit_cost_positive" check ((credit_cost >= 1)),
  constraint "studio_invitations_evento_id_fkey" foreign key (evento_id) references public.eventos(id) on delete set null,
  constraint "studio_invitations_gift_options_is_array" check ((jsonb_typeof(gift_options) = 'array'::text)),
  constraint "studio_invitations_lodging_options_is_array" check ((jsonb_typeof(lodging_options) = 'array'::text)),
  constraint "studio_invitations_pkey" primary key (id),
  constraint "studio_invitations_qr_credit_cost_non_negative" check ((qr_credit_cost >= 0)),
  constraint "studio_invitations_slug_key" unique (slug),
  constraint "studio_invitations_studio_id_fkey" foreign key (studio_id) references public.studios(id) on delete cascade
);

alter table "public"."studio_invitations"
  enable row level security;

create index idx_studio_invitations_event_type on public.studio_invitations using btree (event_type);

create index idx_studio_invitations_published on public.studio_invitations using btree (published);

create index idx_studio_invitations_slug on public.studio_invitations using btree (slug);

create index idx_studio_invitations_studio_id on public.studio_invitations using btree (studio_id);

create index idx_studio_invitations_template_id on public.studio_invitations using btree (template_id);

create unique index studio_invitations_evento_id_unique_idx on public.studio_invitations using btree (evento_id)
  where (evento_id is not null);

create index studio_invitations_expires_at_idx on public.studio_invitations using btree (expires_at)
  where ((published is TRUE) AND (expires_at is not null));

create trigger set_studio_invitation_lifecycle_trigger
  before insert or update of published, template_id on public.studio_invitations
  for each row
  execute function public.set_studio_invitation_lifecycle();

create trigger set_studio_invitations_updated_at
  before update on public.studio_invitations
  for each row
  execute function public.set_updated_at();

create trigger sync_studio_invitation_access_config_trigger
  after insert or update of template_id, evento_id on public.studio_invitations
  for each row
  execute function public.sync_studio_invitation_access_config();

create trigger trg_consume_studio_invitation_credit
  before insert on public.studio_invitations
  for each row
  execute function public.consume_studio_invitation_credit();

create policy "public_can_read_published_invitations" on "public"."studio_invitations"
  for select
  to "anon"
  using ((published = true));

create policy "studio_invitations_delete_members" on "public"."studio_invitations"
  for delete
  to "authenticated"
  using (public.is_invitta_studio_member(studio_id));

create policy "studio_invitations_insert_members" on "public"."studio_invitations"
  for insert
  to "authenticated"
  with check (public.is_invitta_studio_member(studio_id));

create policy "studio_invitations_select_members" on "public"."studio_invitations"
  for select
  to "authenticated"
  using (public.is_invitta_studio_member(studio_id));

create policy "studio_invitations_update_members" on "public"."studio_invitations"
  for update
  to "authenticated"
  using (public.is_invitta_studio_member(studio_id))
  with check (public.is_invitta_studio_member(studio_id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."studio_invitations" to "anon", "authenticated", "postgres", "service_role";

comment on column "public"."studio_invitations"."accent_color" is 'Optional curated accent color override as a hexadecimal value.';

comment on column "public"."studio_invitations"."bg_image_opacity" is 'Opacity of the decorative image overlay, from 0 to 0.60.';

comment on column "public"."studio_invitations"."body_color" is 'Optional curated body text color override as a hexadecimal value.';

comment on column "public"."studio_invitations"."bride_father_name" is 'Optional name of the bride''s father for wedding invitations.';

comment on column "public"."studio_invitations"."bride_mother_name" is 'Optional name of the bride''s mother for wedding invitations.';

comment on column "public"."studio_invitations"."custom_font_name" is 'Studio-facing label for the custom invitation font.';

comment on column "public"."studio_invitations"."custom_font_targets" is 'Allowed custom font areas: titles, subtitles, names and body.';

comment on column "public"."studio_invitations"."custom_font_url" is 'Public Storage URL for an optional WOFF2, WOFF, TTF or OTF display font.';

comment on column "public"."studio_invitations"."expires_at" is 'End of the paid publication period derived from the selected package.';

comment on column "public"."studio_invitations"."gallery_urls" is 'Lista JSON de URLs de fotografías adicionales.';

comment on column "public"."studio_invitations"."gift_options" is 'Configurable gift options for Studio invitations. Supports registry links and bank transfer details. Public invitation render must hide empty/demo gift cards for real Studio invitations.';

comment on column "public"."studio_invitations"."groom_father_name" is 'Optional name of the groom''s father for wedding invitations.';

comment on column "public"."studio_invitations"."groom_mother_name" is 'Optional name of the groom''s mother for wedding invitations.';

comment on column "public"."studio_invitations"."honor_witness_name" is 'Nombre del testigo de honor para bodas';

comment on column "public"."studio_invitations"."itinerary" is 'Lista JSON flexible para horarios del evento.';

comment on column "public"."studio_invitations"."lodging_options" is 'Optional lodging cards. Each item contains name, address, phone and map_url.';

comment on column "public"."studio_invitations"."palette_preset" is 'Curated invitation palette. original preserves the template defaults.';

comment on column "public"."studio_invitations"."published_at" is 'Start of the current paid publication period. NULL preserves legacy invitations.';

comment on column "public"."studio_invitations"."section_visibility" is 'Optional public sections enabled per invitation. Keys: family, locations, itinerary, gallery, registry, rsvp, music.';

comment on column "public"."studio_invitations"."shared_album_enabled" is 'Enables the premium guest photo album for this invitation.';

comment on column "public"."studio_invitations"."slug" is 'Identificador público único para cargar la invitación.';

comment on column "public"."studio_invitations"."title_color" is 'Optional curated title color override as a hexadecimal value.';

comment on table "public"."studio_invitations" is 'Invitaciones digitales creadas por estudios dentro de Invitta Studio.';
