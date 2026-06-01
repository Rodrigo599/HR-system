-- HR Compass: SmartForm template "Feedback Mensal — Recepção" (PDF do Lulo)
-- Migration: 2026-05-03
--
-- Estrutura:
--   Step 1 — Cultura (10 itens, escala 1–10)
--   Step 2 — Competências Técnicas (9 itens, escala 1–10)
--   Step 3 — Metas e Resultados (3 metas, meta + resultado por pessoa)
--   Step 4 — Reflexão (pergunta aberta sobre encantamento)
--
-- Categoria 'evaluation' — vai pro fluxo de avaliacoes; combina com flow_type='blind_simultaneous'.

INSERT INTO public.smart_forms (name, slug, status, category, config)
VALUES (
  'Feedback Mensal - Recepção',
  'feedback-mensal-recepcao',
  'active',
  'evaluation',
  $${
    "steps": [
      {
        "title": {"pt": "Cultura", "es": "Cultura"},
        "subtitle": {"pt": "Avalie de 1 a 10 cada item", "es": "Evalúa de 1 a 10 cada ítem"},
        "fields": [
          {"type": "scale", "name": "cultura-aprender", "label": {"pt": "Demonstra interesse por aprender e melhora continuamente"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "cultura-hospitalidade", "label": {"pt": "Atendimento caloroso e hospitalidade em todas as interações"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "cultura-energia", "label": {"pt": "Trabalha com energia e transmite entusiasmo"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "cultura-detalhes", "label": {"pt": "Cuida dos detalhes e busca excelência no serviço"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "cultura-resultados", "label": {"pt": "Foco em resultados, metas claras e busca superá-las"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "cultura-flexivel", "label": {"pt": "Adaptável e flexível a novos contextos"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "cultura-equipe", "label": {"pt": "Trabalha em equipe, respeito e colaboração"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "cultura-responsabilidade", "label": {"pt": "Assume erros e busca soluções"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "cultura-encantamento", "label": {"pt": "Encanta o hóspede e antecipa necessidades"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "cultura-cuidado", "label": {"pt": "Importa-se genuinamente com trabalho, equipe e hóspedes"}, "required": true, "min": 1, "max": 10}
        ]
      },
      {
        "title": {"pt": "Competências Técnicas", "es": "Competencias Técnicas"},
        "subtitle": {"pt": "Avalie de 1 a 10 cada item", "es": "Evalúa de 1 a 10 cada ítem"},
        "fields": [
          {"type": "scale", "name": "tec-checkin", "label": {"pt": "Realiza check-in / check-out garantindo informações completas"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "tec-iniciativa", "label": {"pt": "Toma iniciativa de forma colaborativa em todos os turnos"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "tec-hospedar", "label": {"pt": "Hospeda e atende necessidades dos hóspedes"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "tec-quartos", "label": {"pt": "Controla quartos com precisão"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "tec-caixa", "label": {"pt": "Responsável com o Caixa, segue procedimentos"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "tec-organizacao", "label": {"pt": "Mantém a recepção organizada com qualidade"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "tec-passagem", "label": {"pt": "Compartilha informações com colegas de turno"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "tec-followup", "label": {"pt": "Acompanha problemas/solicitações até solução"}, "required": true, "min": 1, "max": 10},
          {"type": "scale", "name": "tec-procedimentos", "label": {"pt": "Respeita procedimentos operacionais (rotina 100% do turno)"}, "required": true, "min": 1, "max": 10}
        ]
      },
      {
        "title": {"pt": "Metas e Resultados", "es": "Metas y Resultados"},
        "subtitle": {"pt": "Registre meta e resultado de cada item", "es": "Registra meta y resultado de cada ítem"},
        "fields": [
          {"type": "text", "name": "meta1-pier1-meta", "label": {"pt": "#PIER1 / LATE CHECK-OUT — Meta"}, "required": false},
          {"type": "text", "name": "meta1-pier1-resultado", "label": {"pt": "#PIER1 / LATE CHECK-OUT — Resultado"}, "required": false},
          {"type": "text", "name": "meta2-reviews-resp-meta", "label": {"pt": "REVIEWS E RESPOSTAS — Meta"}, "required": false},
          {"type": "text", "name": "meta2-reviews-resp-resultado", "label": {"pt": "REVIEWS E RESPOSTAS — Resultado"}, "required": false},
          {"type": "text", "name": "meta3-reviews-meta", "label": {"pt": "REVIEWS — Meta"}, "required": false},
          {"type": "text", "name": "meta3-reviews-resultado", "label": {"pt": "REVIEWS — Resultado"}, "required": false}
        ]
      },
      {
        "title": {"pt": "Reflexão final", "es": "Reflexión final"},
        "subtitle": {"pt": "Reserve um momento para refletir", "es": "Reserva un momento para reflexionar"},
        "fields": [
          {
            "type": "textarea",
            "name": "encantamento-mes",
            "label": {"pt": "Quantas vezes você sentiu que encantou um hóspede ou colega? Descreva 3 situações", "es": "¿Cuántas veces sentiste que encantaste a un huésped o colega? Describe 3 situaciones"},
            "required": false,
            "placeholder": {"pt": "Escreva 3 situações específicas...", "es": "Escribe 3 situaciones específicas..."}
          }
        ]
      }
    ],
    "submit": {"pt": "Enviar avaliação mensal", "es": "Enviar evaluación mensual"}
  }$$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  config = EXCLUDED.config,
  status = EXCLUDED.status,
  updated_at = now();
