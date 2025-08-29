-- Database tables for the MCS Service Portal
-- Execute this SQL in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  client VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo TEXT DEFAULT '/placeholder.svg',
  domain VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sub-services table
CREATE TABLE IF NOT EXISTS sub_services (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT REFERENCES services(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_services ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allow all operations - you can restrict these later

CREATE POLICY "Enable all operations for users" ON users
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for clients" ON clients
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for services" ON services
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for sub_services" ON sub_services
  FOR ALL USING (true);

-- Insert some initial data
INSERT INTO clients (name, logo, domain) VALUES
  ('Empresa 1', '/placeholder.svg', 'empresa1.com'),
  ('Empresa 2', '/placeholder.svg', 'empresa2.com'),
  ('Empresa 3', '/placeholder.svg', 'empresa3.com')
ON CONFLICT (domain) DO NOTHING;

INSERT INTO users (email, password_hash, client, status) VALUES
  ('juan@empresa1.com', 'password123', 'Empresa 1', 'active'),
  ('maria@empresa2.com', 'password123', 'Empresa 2', 'active')
ON CONFLICT (email) DO NOTHING;

-- Add some initial services
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

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE
    ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();