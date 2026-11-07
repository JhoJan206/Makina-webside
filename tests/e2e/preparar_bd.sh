#!/usr/bin/env bash
# Recrea una base LOCAL de pruebas con el esquema y el seed de MAKINA.
# Uso: DATABASE_URL=postgresql://postgres@localhost:5432/makina_pruebas tests/e2e/preparar_bd.sh
# Nunca lo apuntes a la base de Supabase de producción: borra todos los datos.
set -euo pipefail
: "${DATABASE_URL:?Define DATABASE_URL con una base local de pruebas}"
case "$DATABASE_URL" in
  *localhost*|*127.0.0.1*) ;;
  *) echo "Por seguridad solo se permite una base en localhost." >&2; exit 1 ;;
esac
psql "$DATABASE_URL" -q -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f supabase/migrations/001_esquema.sql
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f supabase/seed.sql > /dev/null
echo "Base de pruebas lista."
