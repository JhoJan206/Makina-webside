-- Esquema de MAKINA para Supabase (PostgreSQL).
-- Ejecutar una sola vez en el SQL Editor de Supabase (o con `supabase db push`).

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

CREATE TYPE tipo_maquina AS ENUM ('Pajarita', 'Bulldozer');

CREATE TYPE estado_solicitud AS ENUM (
  'Pendiente',
  'Contactado',
  'Aprobada',
  'Rechazada',
  'Completada'
);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

CREATE TABLE usuarios (
  id_usuario     SERIAL PRIMARY KEY,
  usuario        VARCHAR(50)  NOT NULL UNIQUE,
  correo         VARCHAR(150) NOT NULL UNIQUE,
  nombre         VARCHAR(150) NOT NULL,
  password_hash  TEXT         NOT NULL,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE clientes (
  id_cliente          SERIAL PRIMARY KEY,
  nombre_obra         VARCHAR(150) NOT NULL,
  nombre_empresa      VARCHAR(150),
  nombre_responsable  VARCHAR(100),
  telefono            VARCHAR(20),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE operadores (
  id_operador  SERIAL PRIMARY KEY,
  nombre       VARCHAR(100)   NOT NULL,
  apellido     VARCHAR(100)   NOT NULL,
  cedula       VARCHAR(20)    NOT NULL UNIQUE,
  sueldo       NUMERIC(12, 2) CHECK (sueldo >= 0),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maquinas (
  id_maquina   SERIAL PRIMARY KEY,
  tipo         tipo_maquina   NOT NULL,
  placa        VARCHAR(20)    NOT NULL UNIQUE,
  valor_hora   NUMERIC(12, 2) NOT NULL CHECK (valor_hora >= 0),
  imagen       TEXT,
  imagen_alt   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maquina_operador (
  id            SERIAL PRIMARY KEY,
  id_maquina    INT  NOT NULL REFERENCES maquinas(id_maquina) ON DELETE CASCADE,
  id_operador   INT  NOT NULL REFERENCES operadores(id_operador) ON DELETE CASCADE,
  fecha_ingreso DATE NOT NULL,
  fecha_salida  DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CHECK (fecha_salida IS NULL OR fecha_salida >= fecha_ingreso)
);

CREATE TABLE ingresos (
  id_ingreso    SERIAL PRIMARY KEY,
  id_maquina    INT            NOT NULL REFERENCES maquinas(id_maquina),
  id_cliente    INT            NOT NULL REFERENCES clientes(id_cliente),
  horas         NUMERIC(8, 2)  NOT NULL CHECK (horas > 0),
  valor_ingreso NUMERIC(14, 2) NOT NULL CHECK (valor_ingreso >= 0),
  descripcion   TEXT,
  fecha         DATE           NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE egresos (
  id_egreso    SERIAL PRIMARY KEY,
  id_maquina   INT            NOT NULL REFERENCES maquinas(id_maquina),
  valor_egreso NUMERIC(14, 2) NOT NULL CHECK (valor_egreso >= 0),
  descripcion  TEXT,
  fecha        DATE           NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE solicitudes (
  id_solicitud     SERIAL PRIMARY KEY,
  id_cliente       INT              NOT NULL REFERENCES clientes(id_cliente),
  tipo_maquina     tipo_maquina     NOT NULL,
  fecha_requerida  DATE             NOT NULL,
  horas_estimadas  NUMERIC(8, 2)    NOT NULL CHECK (horas_estimadas > 0),
  descripcion      TEXT,
  estado           estado_solicitud NOT NULL DEFAULT 'Pendiente',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

-- Una máquina solo puede tener una asignación abierta a la vez
CREATE UNIQUE INDEX maquina_operador_abierta_maquina
  ON maquina_operador (id_maquina) WHERE fecha_salida IS NULL;

CREATE INDEX maquina_operador_id_operador ON maquina_operador (id_operador);
CREATE INDEX ingresos_id_maquina ON ingresos (id_maquina);
CREATE INDEX ingresos_id_cliente ON ingresos (id_cliente);
CREATE INDEX ingresos_fecha ON ingresos (fecha);
CREATE INDEX egresos_id_maquina ON egresos (id_maquina);
CREATE INDEX egresos_fecha ON egresos (fecha);
CREATE INDEX solicitudes_id_cliente ON solicitudes (id_cliente);
CREATE INDEX solicitudes_estado ON solicitudes (estado);

-- ---------------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------------

CREATE TRIGGER usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER operadores_updated_at BEFORE UPDATE ON operadores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER maquinas_updated_at BEFORE UPDATE ON maquinas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER maquina_operador_updated_at BEFORE UPDATE ON maquina_operador
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER ingresos_updated_at BEFORE UPDATE ON ingresos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER egresos_updated_at BEFORE UPDATE ON egresos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER solicitudes_updated_at BEFORE UPDATE ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Supabase expone el esquema public por su API REST (anon key). Se activa RLS
-- sin políticas para que nadie pueda leer ni escribir por esa vía: el backend
-- de Express se conecta directo a Postgres con el rol `postgres`, que no se ve
-- afectado por RLS.

ALTER TABLE usuarios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE operadores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE maquinas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE maquina_operador ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes      ENABLE ROW LEVEL SECURITY;
