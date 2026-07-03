import type { SmartFormConfig, SmartFormField } from "@/types/smartforms";

// Retorna todos os campos do tipo 'scale' de um SmartFormConfig (percorre todos os steps)
export function extractScaleFields(config: SmartFormConfig): SmartFormField[] {
  return config.steps.flatMap((step) =>
    step.fields.filter((f) => f.type === "scale" || f.type === "rating")
  );
}

// Converte as respostas do SmartForm no payload que a API espera em
// PUT /evaluations/{id}/submit-self|submit-manager ({ scores: [{ score }] }).
// O backend persiste UMA nota agregada por avaliacao (evaluation_responses),
// entao enviamos a media dos campos de escala/nota do formulario.
export function valuesToScoresPayload(
  values: Record<string, unknown>,
  config: SmartFormConfig | null,
): { scores: Array<{ score: number }> } {
  const scaleNames = config ? extractScaleFields(config).map((f) => f.name!) : [];
  const source = scaleNames.length > 0
    ? scaleNames.map((name) => values[name])
    : Object.values(values);

  const nums = source
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  const media = nums.length > 0
    ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
    : 0;

  // Backend valida between:0,10
  return { scores: [{ score: Math.min(10, Math.max(0, media)) }] };
}
