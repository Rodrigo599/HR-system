import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getContentTypeLabels } from "@/lib/enums";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, ListChecks, ExternalLink, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useContentItems } from "@/hooks/api/useContent";
import type { ContentItem } from "@/types/api";

const TYPE_ICON: Record<string, typeof GraduationCap> = {
  training: GraduationCap,
  reading: BookOpen,
  process: ListChecks,
};

const TYPE_COLOR: Record<string, string> = {
  training: "bg-blue-500",
  reading: "bg-amber-500",
  process: "bg-emerald-500",
};

export default function Content() {
  const { t } = useLanguage();
  const contentTypeLabels = getContentTypeLabels(t);
  const contentQuery = useContentItems();
  const items: ContentItem[] = contentQuery.data ?? [];

  if (contentQuery.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('contentTitle')}</h1>
      </div>

      {items.length === 0 ? (
        <Card><CardContent><EmptyState icon={GraduationCap} title={t('contentEmpty')} description={t('contentEmptyDesc')} /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const Icon = TYPE_ICON[item.type] ?? GraduationCap;
            const color = TYPE_COLOR[item.type] ?? "bg-blue-500";
            const label = contentTypeLabels[item.type] ?? item.type;
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className={`p-2 rounded-md ${color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">{item.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">{label}</Badge>
                  </div>
                </CardHeader>
                {item.description && (
                  <CardContent>
                    <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                        <ExternalLink className="h-3 w-3" /> Acessar
                      </a>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
