-- HR Compass Seed Data
-- Sectors for El Misti Hotels

INSERT INTO sectors (name, description) VALUES
  ('Recepção', 'Front desk e atendimento ao hóspede'),
  ('Housekeeping', 'Limpeza e manutenção de quartos'),
  ('A&B', 'Alimentos e Bebidas - restaurante, bar e cozinha'),
  ('Admin', 'Finanças, RH e operações')
ON CONFLICT DO NOTHING;

-- Default evaluation topics (cultural)
INSERT INTO evaluation_topics (name, description, type, sector_id) VALUES
  ('Trabalho em equipe', 'Colaboracao com colegas', 'cultural', NULL),
  ('Comunicação', 'Clareza e efetividade ao se comunicar', 'cultural', NULL),
  ('Proatividade', 'Iniciativa e antecipacao de problemas', 'cultural', NULL),
  ('Pontualidade', 'Cumprimento de horarios e prazos', 'performance', NULL),
  ('Atendimento ao hóspede', 'Qualidade do serviço ao cliente', 'performance', NULL),
  ('Cumprimento de processos', 'Aderencia a procedimentos operacionais', 'performance', NULL)
ON CONFLICT DO NOTHING;

-- Default KPIs
INSERT INTO kpis (name, description, target_value, unit, sector_id) VALUES
  ('NPS Hóspedes', 'Net Promoter Score do hóspede', 80, 'pts', NULL),
  ('Ocupação', 'Taxa de ocupação mensal', 75, '%', NULL),
  ('Ticket Médio', 'Valor médio por reserva', 150, 'USD', NULL),
  ('Tempo Check-in', 'Tempo médio de check-in', 5, 'min', NULL),
  ('Reviews Positivos', 'Porcentagem de reviews 4-5 estrelas', 90, '%', NULL)
ON CONFLICT DO NOTHING;
