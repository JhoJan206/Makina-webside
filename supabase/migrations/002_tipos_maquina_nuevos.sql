-- Agrega dos tipos de máquina al ENUM tipo_maquina:
--   'Pajarita' (retroexcavadora), 'Bulldozer', 'Excavadora', 'Motoniveladora'
--
-- Ejecutar una sola vez en el SQL Editor de Supabase (o con `supabase db push`),
-- después de 001_esquema.sql. No modifica ningún dato existente.

ALTER TYPE tipo_maquina ADD VALUE IF NOT EXISTS 'Excavadora';
ALTER TYPE tipo_maquina ADD VALUE IF NOT EXISTS 'Motoniveladora';
