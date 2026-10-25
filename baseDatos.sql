CREATE TABLE clientes (
  id_cliente          SERIAL PRIMARY KEY,
  nombre_obra         VARCHAR(150) NOT NULL,
  nombre_empresa      VARCHAR(150),
  nombre_responsable  VARCHAR(100),
  telefono            VARCHAR(20),
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE operadores (
  id_operador  SERIAL PRIMARY KEY,
  nombre       VARCHAR(100)   NOT NULL,
  apellido     VARCHAR(100)   NOT NULL,
  cedula       VARCHAR(20)    NOT NULL UNIQUE,
  sueldo       NUMERIC(12, 2),
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TYPE tipo_maquina AS ENUM ('Pajarita', 'Bulldozer');

CREATE TABLE maquinas (
  id_maquina   SERIAL PRIMARY KEY,
  tipo         tipo_maquina   NOT NULL,
  placa        VARCHAR(20)    NOT NULL UNIQUE,
  valor_hora   NUMERIC(12, 2) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE maquina_operador (
  id            SERIAL PRIMARY KEY,
  id_maquina    INT NOT NULL REFERENCES maquinas(id_maquina),
  id_operador   INT NOT NULL REFERENCES operadores(id_operador),
  fecha_ingreso DATE NOT NULL,
  fecha_salida  DATE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ingresos (
  id_ingreso    SERIAL PRIMARY KEY,
  id_maquina    INT            NOT NULL REFERENCES maquinas(id_maquina),
  id_cliente    INT            NOT NULL REFERENCES clientes(id_cliente),
  horas         NUMERIC(8, 2)  NOT NULL,
  valor_ingreso NUMERIC(14, 2) NOT NULL,
  descripcion   TEXT,
  fecha         DATE           NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE egresos (
  id_egreso    SERIAL PRIMARY KEY,
  id_maquina   INT            NOT NULL REFERENCES maquinas(id_maquina),
  valor_egreso NUMERIC(14, 2) NOT NULL,
  descripcion  TEXT,
  fecha        DATE           NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TYPE estado_solicitud AS ENUM (
  'Pendiente',
  'Contactado',
  'Aprobada',
  'Rechazada',
  'Completada'
);

CREATE TABLE solicitudes (
  id_solicitud     SERIAL PRIMARY KEY,
  id_cliente       INT             NOT NULL REFERENCES clientes(id_cliente),
  tipo_maquina     tipo_maquina    NOT NULL,
  fecha_requerida  DATE            NOT NULL,
  horas_estimadas  NUMERIC(8, 2)   NOT NULL,
  descripcion      TEXT,
  estado           estado_solicitud NOT NULL DEFAULT 'Pendiente',
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);