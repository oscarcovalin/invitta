alter table public.studio_invitations
add column if not exists thank_you_title text default 'Con cariño',
add column if not exists thank_you_message text default 'Gracias por ser parte de mis XV años',
add column if not exists thank_you_signature text default '',
add column if not exists hashtag_section_title text default 'Comparte el momento',
add column if not exists hashtag_section_message text default 'Usa el hashtag en tus fotos y videos para que no se pierda ningún recuerdo.';

update public.studio_invitations
set
  thank_you_title = 'Con cariño',
  thank_you_message = 'Gracias por ser parte de mis XV años',
  thank_you_signature = 'Familia Reyes Torres',
  hashtag_section_title = 'Comparte el momento',
  hashtag_section_message = 'Usa el hashtag en tus fotos y videos para que no se pierda ningún recuerdo.'
where slug = 'paola-xv';