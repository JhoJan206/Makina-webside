-- Datos de ejemplo de MAKINA (los mismos que usaba el frontend).
-- Opcional: ejecutar después de migrations/001_esquema.sql.
-- Incluye un usuario de prueba (ver abajo).
-- Los ingresos y egresos se ubican en el mes actual para que el dashboard
-- muestre información apenas se instala.

BEGIN;

-- Usuario de prueba para entrar a /login en local.
--   Usuario: admin  (o el correo admin@makina.local)
--   Contraseña: Makina2026!
-- En producción no ejecutes este seed, o elimina este usuario y crea uno
-- propio con `npm run crear-usuario`.
INSERT INTO usuarios (usuario, correo, nombre, password_hash) VALUES
  ('admin', 'admin@makina.local', 'Administrador', '$2b$10$qMC040dgLD/zjJSGvosokuTV2DEfAHS7DkPFk9cuw5Pghp9q3iGDW');

INSERT INTO clientes (id_cliente, nombre_obra, nombre_empresa, nombre_responsable, telefono) VALUES
  (1, 'Obra #1',     'Constructora Andina', 'Laura Méndez',  '300 123 4567'),
  (2, 'Vía Norte',   'Vías del Norte SAS',  'Diego Ramírez', '310 456 7890'),
  (3, 'Cantera Sur', 'Agregados del Sur',   'Sandra Rojas',  '320 987 6543');

INSERT INTO operadores (id_operador, nombre, apellido, cedula, sueldo) VALUES
  (1, 'Carlos', 'Pérez',   '1.020.304.050', 3200000),
  (2, 'Jhojan', 'Jacome',  '1.098.765.432', 3500000),
  (3, 'Andrés', 'Gómez',   '1.045.678.901', 3000000),
  (4, 'Mateo',  'Salazar', '1.112.233.445', 2900000);

INSERT INTO maquinas (id_maquina, tipo, placa, valor_hora, imagen, imagen_alt) VALUES
  (1, 'Pajarita',  '387J', 85000,  '/img/maquinaria/retroexcavadora.jpg', 'Retroexcavadora amarilla trabajando en un terreno de tierra'),
  (2, 'Bulldozer', '786H', 120000, '/img/maquinaria/excavadora.jpg',      'Excavadora amarilla sobre un montón de tierra'),
  (3, 'Pajarita',  '023Y', 95000,  '/img/maquinaria/cargadora.jpg',       'Cargadora amarilla en una cantera');

INSERT INTO maquina_operador (id, id_maquina, id_operador, fecha_ingreso, fecha_salida) VALUES
  (1, 1, 1, '2026-01-15', NULL),
  (2, 1, 4, '2025-06-01', '2026-01-10'),
  (3, 1, 2, '2024-09-01', '2025-05-25'),
  (4, 2, 2, '2026-02-01', NULL),
  (5, 2, 1, '2025-03-01', '2026-01-30'),
  (6, 2, 3, '2024-11-01', '2025-02-20'),
  (7, 3, 3, '2026-03-10', NULL),
  (8, 3, 4, '2025-08-01', '2026-03-01'),
  (9, 3, 1, '2025-01-15', '2025-07-20');

-- dia = día del mes actual
INSERT INTO ingresos (id_ingreso, id_maquina, id_cliente, horas, valor_ingreso, descripcion, fecha)
SELECT id, maquina, cliente, horas, valor, 'Trabajo/proyecto',
       (date_trunc('month', CURRENT_DATE) + (dia - 1) * INTERVAL '1 day')::date
FROM (VALUES
  (1, 1, 1, 20, 1700000,  2),
  (2, 1, 2, 26, 2210000,  5),
  (3, 1, 2, 24, 2040000,  9),
  (4, 1, 1, 18, 1530000, 12),
  (5, 1, 3, 22, 1870000, 16),
  (6, 1, 1, 28, 2380000, 20),
  (7, 2, 2, 16, 1920000,  3),
  (8, 2, 2, 20, 2400000,  8),
  (9, 2, 1, 24, 2880000, 14),
  (10, 2, 3, 18, 2160000, 18),
  (11, 2, 2, 22, 2640000, 25),
  (12, 3, 3, 24, 2280000,  2),
  (13, 3, 3, 28, 2660000,  7),
  (14, 3, 1, 20, 1900000, 11),
  (15, 3, 3, 26, 2470000, 17),
  (16, 3, 2, 22, 2090000, 21),
  (17, 3, 3, 30, 2850000, 28)
) AS v (id, maquina, cliente, horas, valor, dia);

INSERT INTO egresos (id_egreso, id_maquina, valor_egreso, descripcion, fecha)
SELECT id, maquina, valor, descripcion,
       (date_trunc('month', CURRENT_DATE) + (dia - 1) * INTERVAL '1 day')::date
FROM (VALUES
  (1, 1,  850000, 'Repuesto',       4),
  (2, 1,  320000, 'Repuesto',      10),
  (3, 1,  180000, 'Mantenimiento', 15),
  (4, 1,  950000, 'Combustible',   22),
  (5, 2, 1200000, 'Combustible',    6),
  (6, 2,  480000, 'Repuesto',      12),
  (7, 2,  350000, 'Mantenimiento', 19),
  (8, 2,  670000, 'Repuesto',      27),
  (9, 3, 1450000, 'Combustible',    5),
  (10, 3, 620000, 'Repuesto',      13),
  (11, 3, 410000, 'Mantenimiento', 23)
) AS v (id, maquina, valor, descripcion, dia);

-- creado_hace = horas antes de ahora; dias_requerida = días desde hoy
INSERT INTO solicitudes (id_solicitud, id_cliente, tipo_maquina, fecha_requerida, horas_estimadas, descripcion, estado, created_at, updated_at)
SELECT id, cliente, tipo::tipo_maquina, CURRENT_DATE + dias_requerida, horas, descripcion,
       estado::estado_solicitud,
       NOW() - creado_hace * INTERVAL '1 hour',
       NOW() - actualizado_hace * INTERVAL '1 hour'
FROM (VALUES
  (6, 3, 'Bulldozer', 12, 48, 'Preparación de plataforma para el nuevo frente de explotación. Se requiere nivelar y compactar el terreno.', 'Pendiente', 3, 3),
  (5, 1, 'Pajarita',   5, 24, 'Nivelación y excavación para el acceso principal de la obra. El terreno ya está delimitado.', 'Pendiente', 26, 26),
  (4, 2, 'Bulldozer',  7, 40, 'Movimiento de tierras para ampliación de la vía. Incluye empuje y conformación del talud.', 'Contactado', 45, 24),
  (3, 3, 'Pajarita',   9, 16, 'Apertura de zanja para redes de drenaje en la zona sur de la cantera.', 'Aprobada', 72, 40),
  (2, 1, 'Bulldozer',  3, 32, 'Adecuación de la vía interna para el ingreso de volquetas de gran tonelaje.', 'Rechazada', 88, 70),
  (1, 2, 'Pajarita',  -5, 20, 'Cargue de material granular y limpieza del área de acopio.', 'Completada', 216, 110)
) AS v (id, cliente, tipo, dias_requerida, horas, descripcion, estado, creado_hace, actualizado_hace);

-- Los ids se insertaron a mano: se ajustan las secuencias
SELECT setval(pg_get_serial_sequence('clientes', 'id_cliente'), (SELECT MAX(id_cliente) FROM clientes));
SELECT setval(pg_get_serial_sequence('operadores', 'id_operador'), (SELECT MAX(id_operador) FROM operadores));
SELECT setval(pg_get_serial_sequence('maquinas', 'id_maquina'), (SELECT MAX(id_maquina) FROM maquinas));
SELECT setval(pg_get_serial_sequence('maquina_operador', 'id'), (SELECT MAX(id) FROM maquina_operador));
SELECT setval(pg_get_serial_sequence('ingresos', 'id_ingreso'), (SELECT MAX(id_ingreso) FROM ingresos));
SELECT setval(pg_get_serial_sequence('egresos', 'id_egreso'), (SELECT MAX(id_egreso) FROM egresos));
SELECT setval(pg_get_serial_sequence('solicitudes', 'id_solicitud'), (SELECT MAX(id_solicitud) FROM solicitudes));

COMMIT;
