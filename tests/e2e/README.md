# Pruebas de sistema (Selenium)

Suite automatizada de los casos CP-01 a CP-29 (login, máquinas, operadores,
asignaciones, clientes, ingresos/egresos, dashboard, solicitudes, navegación,
vista móvil y botón de ayuda). Al terminar genera el reporte
**`docs/Reporte de Pruebas MAKINA.pdf`** con el resumen, los hallazgos y las
capturas de cada caso.

> **No la ejecutes contra producción.** Las pruebas crean, editan y eliminan
> registros (máquinas, operadores, clientes, asignaciones, movimientos y solicitudes).

## Requisitos

- Python 3.9 o superior: `pip install selenium fpdf2`
- Google Chrome. Selenium Manager descarga el chromedriver que corresponde; si
  no hay acceso a internet, indica uno con `MAKINA_CHROMEDRIVER`.
- `npm install` (incluye `embedded-postgres`, una base PostgreSQL desechable;
  no hace falta instalar Postgres ni Docker)

## Pasos (tres terminales)

```bash
# 1. Base local con el esquema y el seed (se recrea en cada arranque)
node tests/e2e/bd_local.mjs

# 2. Servidor apuntando a esa base, en el puerto 3002
PORT=3002 DATABASE_URL=postgres://postgres:postgres@localhost:5544/postgres node index.js --dev

# 3. Pruebas + reporte PDF
MAKINA_URL=http://localhost:3002 python tests/e2e/ejecutar_pruebas.py
```

En Claude Code el paso 2 es la configuración `makina-pruebas` de `.claude/launch.json`.
Reinicia `bd_local.mjs` antes de cada corrida para partir de los mismos datos
(CP-07 necesita un operador libre). Para correr sin PDF:
`python -m unittest tests/e2e/test_makina.py -v`.

Las capturas de evidencia quedan en `tests/e2e/evidencias/`.

| Variable | Uso | Por defecto |
| --- | --- | --- |
| `MAKINA_URL` | URL de la aplicación | `http://localhost:3000` |
| `MAKINA_USUARIO` / `MAKINA_CLAVE` | Usuario de prueba | `admin` / `Makina2026!` (seed) |
| `MAKINA_HEADLESS` | `0` para ver el navegador | `1` |
| `MAKINA_CHROMEDRIVER` | Ruta a un chromedriver concreto | Selenium Manager |
| `MAKINA_REPORTE` | Ruta del PDF | `docs/Reporte de Pruebas MAKINA.pdf` |

También sigue disponible `preparar_bd.sh` si prefieres un PostgreSQL instalado con `psql`.
