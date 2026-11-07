# Pruebas de sistema (Selenium)

Suite automatizada de los casos CP-01 a CP-11 del manual técnico (sección 12).

> **No la ejecutes contra producción.** Las pruebas crean, editan y eliminan
> registros (operadores, clientes, asignaciones y solicitudes).

## Requisitos

- Python 3.9 o superior y `pip install selenium`
- Google Chrome. Selenium Manager descarga el chromedriver que corresponde; si
  no hay acceso a internet, indica uno con `MAKINA_CHROMEDRIVER`.
- PostgreSQL local y `psql`

## Pasos

```bash
# 1. Base local de pruebas con el esquema y el seed
createdb makina_pruebas
DATABASE_URL=postgresql://postgres@localhost:5432/makina_pruebas tests/e2e/preparar_bd.sh

# 2. Servidor apuntando a esa base (en otra terminal)
#    .env -> DATABASE_URL=postgresql://postgres@localhost:5432/makina_pruebas
npm run build
npm start

# 3. Pruebas
python -m unittest tests/e2e/test_makina.py -v
```

Las capturas de evidencia quedan en `tests/e2e/evidencias/`.

| Variable | Uso | Por defecto |
| --- | --- | --- |
| `MAKINA_URL` | URL de la aplicación | `http://localhost:3000` |
| `MAKINA_USUARIO` / `MAKINA_CLAVE` | Usuario de prueba | `admin` / `Makina2026!` (seed) |
| `MAKINA_HEADLESS` | `0` para ver el navegador | `1` |
| `MAKINA_CHROMEDRIVER` | Ruta a un chromedriver concreto | Selenium Manager |

Vuelve a ejecutar `preparar_bd.sh` antes de cada corrida para partir de los
mismos datos (CP-07 necesita un operador libre).
