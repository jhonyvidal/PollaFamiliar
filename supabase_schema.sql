-- ============================================
-- SCHEMA POLLA FAMILIAR
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Participantes
create table if not exists participantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text,
  avatar_color text default '#3b82f6',
  created_at timestamptz default now()
);

-- Partidos
create table if not exists partidos (
  id uuid primary key default gen_random_uuid(),
  equipo_local text not null,
  equipo_visitante text not null,
  logo_local text,
  logo_visitante text,
  fecha timestamptz not null,
  goles_local integer,
  goles_visitante integer,
  estado text default 'pendiente', -- pendiente | finalizado
  jornada integer default 1,
  created_at timestamptz default now()
);

-- Pronósticos
create table if not exists pronosticos (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid references participantes(id) on delete cascade,
  partido_id uuid references partidos(id) on delete cascade,
  goles_local integer not null,
  goles_visitante integer not null,
  puntos integer default null,
  created_at timestamptz default now(),
  unique(participante_id, partido_id)
);

-- ============================================
-- RLS (Row Level Security) - Acceso público
-- ============================================
alter table participantes enable row level security;
alter table partidos enable row level security;
alter table pronosticos enable row level security;

-- Políticas de acceso libre (sin autenticación)
create policy "acceso_publico_participantes"
  on participantes for all using (true) with check (true);

create policy "acceso_publico_partidos"
  on partidos for all using (true) with check (true);

create policy "acceso_publico_pronosticos"
  on pronosticos for all using (true) with check (true);

-- ============================================
-- FUNCIÓN: Calcular puntos de un pronóstico
-- ============================================
create or replace function calcular_puntos(
  p_goles_local_real integer,
  p_goles_visitante_real integer,
  p_goles_local_pronostico integer,
  p_goles_visitante_pronostico integer
) returns integer as $$
declare
  resultado_real text;
  resultado_pronostico text;
begin
  -- Resultado exacto: 3 puntos
  if p_goles_local_real = p_goles_local_pronostico
     and p_goles_visitante_real = p_goles_visitante_pronostico then
    return 3;
  end if;

  -- Calcular resultado (G=gana local, E=empate, P=pierde local)
  if p_goles_local_real > p_goles_visitante_real then
    resultado_real := 'G';
  elsif p_goles_local_real = p_goles_visitante_real then
    resultado_real := 'E';
  else
    resultado_real := 'P';
  end if;

  if p_goles_local_pronostico > p_goles_visitante_pronostico then
    resultado_pronostico := 'G';
  elsif p_goles_local_pronostico = p_goles_visitante_pronostico then
    resultado_pronostico := 'E';
  else
    resultado_pronostico := 'P';
  end if;

  -- Resultado correcto (tendencia): 1 punto
  if resultado_real = resultado_pronostico then
    return 1;
  end if;

  return 0;
end;
$$ language plpgsql;

-- ============================================
-- FUNCIÓN: Actualizar puntos al finalizar partido
-- ============================================
create or replace function actualizar_puntos_partido()
returns trigger as $$
begin
  -- Solo actualizar si el partido está finalizado y tiene resultado
  if NEW.estado = 'finalizado'
     and NEW.goles_local is not null
     and NEW.goles_visitante is not null then
    update pronosticos
    set puntos = calcular_puntos(
      NEW.goles_local,
      NEW.goles_visitante,
      pronosticos.goles_local,
      pronosticos.goles_visitante
    )
    where partido_id = NEW.id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create or replace trigger trigger_actualizar_puntos
  after update on partidos
  for each row execute function actualizar_puntos_partido();
