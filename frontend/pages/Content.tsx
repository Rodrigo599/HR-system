import React, { useState } from "react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, BookOpen, ListChecks, ExternalLink, Plus, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useContentItems } from "@/hooks/api/useContent";
import type { ContentItem } from "@/types/api";

const TYPE_META: Record<string, { label: string; icon: typeof GraduationCap; color: string }> = {
  training: { label: "Treinamento", icon: GraduationCap, color: "bg-blue-500" },
  reading: { label: "Leitura", icon: BookOpen, color: "bg-amber-500" },
  process: { label: "Processo", icon: ListChecks, color: "bg-emerald-500" },
};

export default function Content() {
  const { isAdmin, isGestor } = useAuth();
  const { toast } = useToast();

  const contentQuery = useContentItems();
  const items: ContentItem[] = contentQuery.data ?? [];

  if (contentQuery.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conteúdo</h1>
      </div>

      {items.length === 0 ? (
        <Card><CardContent><EmptyState icon={GraduationCap} title="Nenhum conteúdo disponível" description="Conteúdos atribuídos aparecem aqui." /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const meta = TYPE_META[item.type] ?? TYPE_META.training;
            const Icon = meta.icon;
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className={`p-2 rounded-md ${meta.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">{item.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">{meta.label}</Badge>
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
