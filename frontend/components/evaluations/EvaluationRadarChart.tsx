import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ============================================================
// Props
// ============================================================

interface EvaluationRadarChartProps {
  radarData: Array<{
    topic: string;
    autoavaliacao: number;
    gestor: number;
    media: number;
  }>;
  /**
   * 'sequential' (default): 3 series (auto, gestor, media).
   * 'blind': 2 series comparativas (vermelho=lider, azul=liderado), sem media.
   */
  variant?: "sequential" | "blind";
}

export function EvaluationRadarChart({
  radarData,
  variant = "sequential",
}: EvaluationRadarChartProps) {
  const { t } = useLanguage();

  const hasData = radarData.some((d) => d.autoavaliacao > 0 || d.gestor > 0);
  if (!hasData) return null;

  const isBlind = variant === "blind";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isBlind ? "Comparativo lider x liderado" : t("evaluationResults")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="topic" className="text-xs" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} />

            {/* Liderado (auto) — sempre presente */}
            <Radar
              name={isBlind ? "Liderado" : t("selfScore")}
              dataKey="autoavaliacao"
              stroke={isBlind ? "hsl(210 100% 50%)" : "hsl(var(--primary))"}
              fill={isBlind ? "hsl(210 100% 50%)" : "hsl(var(--primary))"}
              fillOpacity={0.3}
            />

            {/* Lider (gestor) — sempre presente, vermelho em blind */}
            <Radar
              name={isBlind ? "Lider" : t("managerScore")}
              dataKey="gestor"
              stroke={isBlind ? "hsl(0 80% 55%)" : "hsl(210 100% 50%)"}
              fill={isBlind ? "hsl(0 80% 55%)" : "hsl(210 100% 50%)"}
              fillOpacity={isBlind ? 0.25 : 0.2}
            />

            {/* Media — somente em sequencial */}
            {!isBlind && (
              <Radar
                name={t("finalScore")}
                dataKey="media"
                stroke="hsl(150 100% 40%)"
                fill="hsl(150 100% 40%)"
                fillOpacity={0.1}
              />
            )}

            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
