# Configuración de Base de Datos Supabase

Para configurar la base de datos para el Portal de Servicios MCS, sigue estos pasos:

## 1. Crear las Tablas

Ve al editor SQL de Supabase (https://supabase.com/dashboard/project/[tu-proyecto]/sql) y ejecuta el siguiente SQL:

```sql
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  client VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo TEXT DEFAULT '/placeholder.svg',
  domain VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sub-servicios
CREATE TABLE IF NOT EXISTS sub_services (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT REFERENCES services(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_services ENABLE ROW LEVEL SECURITY;

-- Crear políticas (permitir todas las operaciones por ahora)
CREATE POLICY "Enable all operations for users" ON users
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for clients" ON clients
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for services" ON services
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for sub_services" ON sub_services
  FOR ALL USING (true);

-- Insertar datos iniciales
INSERT INTO clients (name, logo, domain) VALUES
  ('Empresa 1', '/placeholder.svg', 'empresa1.com'),
  ('Empresa 2', '/placeholder.svg', 'empresa2.com'),
  ('Empresa 3', '/placeholder.svg', 'empresa3.com')
ON CONFLICT (domain) DO NOTHING;

INSERT INTO users (email, password_hash, client, status) VALUES
  ('juan@empresa1.com', 'password123', 'Empresa 1', 'active'),
  ('maria@empresa2.com', 'password123', 'Empresa 2', 'active')
ON CONFLICT (email) DO NOTHING;

-- Agregar servicios iniciales
INSERT INTO services (client_id, name) 
SELECT c.id, s.service_name 
FROM clients c, (
  VALUES 
    ('empresa1.com', 'Mesa de Servicios ITSM'),
    ('empresa1.com', 'Monitoreo'),
    ('empresa1.com', 'Reportes de Servicio'),
    ('empresa2.com', 'Reportes QBR'),
    ('empresa2.com', 'Alcances del Servicio (SLA)'),
    ('empresa2.com', 'Matriz de Escalación'),
    ('empresa3.com', 'Estatus de Implementaciones'),
    ('empresa3.com', 'Gestión de Recursos'),
    ('empresa3.com', 'Estatus de Polizas de Servicio')
) AS s(domain, service_name)
WHERE c.domain = s.domain;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE
    ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 2. Configurar Variables de Entorno

Asegúrate de que tu proyecto Lovable tenga configuradas las variables de entorno de Supabase:

- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Clave anónima de tu proyecto Supabase

Estas se configuran automáticamente cuando conectas Supabase a Lovable.

## 3. Verificar la Conexión

Una vez ejecutado el SQL, el portal debería poder:

1. **Crear usuarios**: Agregar nuevos usuarios con correo, contraseña y cliente
2. **Gestionar clientes**: Crear, editar y eliminar clientes con sus dominios
3. **Configurar servicios**: Agregar/eliminar servicios para cada cliente
4. **Gestionar subservicios**: Crear subservicios con nombre y URL para cada servicio

## 4. Datos de Prueba Disponibles

Después de ejecutar el script, tendrás:

- 3 clientes de ejemplo (Empresa 1, 2, 3)
- 2 usuarios de prueba
- Servicios pre-configurados para cada cliente

¡Listo! El portal ahora guardará toda la información en Supabase de forma persistente.