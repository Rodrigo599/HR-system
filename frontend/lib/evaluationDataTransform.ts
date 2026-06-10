import type { SmartFormConfig, SmartFormField } from "@/types/smartforms";

// Retorna todos os campos do tipo 'scale' de um SmartFormConfig (percorre todos os steps)
export function extractScaleFields(config: SmartFormConfig): SmartFormField[] {
  return config.steps.flatMap((step) =>
    step.fields.filter((f) => f.type === "scale" || f.type === "rating")
  );
}
