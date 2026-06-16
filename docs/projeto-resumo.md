# HR System — Resumo do Projeto

Sistema de gestão de pessoas (RH) com frontend React + backend Laravel, voltado para ciclos de avaliação, desenvolvimento individual e comunicação entre gestores e colaboradores.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| Estado / cache | TanStack Query (React Query) |
| Backend | Laravel 12, PHP 8.4, Laravel Sail (Docker) |
| Autenticação | Laravel Sanctum (token-based) |
| API docs | Scramble (OpenAPI auto-gerado) |
| Tipos compartilhados | `api.generated.ts` gerado do schema OpenAPI |
| Testes | PHPUnit (Feature tests) |

---

## Módulos do sistema

### Organização

- **Setores** — CRUD de setores da empresa
- **Usuários** — criação e gerenciamento de colaboradores, gestores e administradores com papéis (`admin`, `gestor`, `colaborador`)
- **Perfil** — dados pessoais, setor, gestor, idioma preferido, dependentes
- **Hierarquia** — visualização da árvore gestor → liderado (`HierarchyView`)

### Avaliações

- Fluxo completo: criação pelo gestor/admin → autoavaliação pelo colaborador (`pending_self`) → avaliação do gestor (`pending_manager`) → concluída (`completed`)
- Vinculada a SmartForms para definir o formulário de perguntas
- Tipos: `360`, `performance`, `self`
- Histórico filtrado por mês, ano, colaborador e tipo

### KPIs

- Definição de indicadores com meta e unidade por setor
- Registro de resultados mensais (`upsert` por mês/ano)
- Gráficos de evolução (últimos 6 meses) e comparativo entre colaboradores

### PDI — Plano de Desenvolvimento Individual

- Criação de planos com título, descrição e prazo
- Tarefas com fluxo: `pending` → `submitted` → `approved` / `rejected`
- Notas de revisão no reject para orientar o colaborador
- Visão da equipe para gestores/admins

### Feedback

- Feedback pontual (escrito) entre membros da empresa
- Visibilidade: `private` (apenas o dono) ou `with_manager` (dono + gestor)
- Exibição contextual: colaboradores veem texto adaptado ao seu papel, gestores veem o texto completo
- Contador de caracteres em tempo real + validação mínima de 10 chars

### 1:1s (One-on-Ones)

- Agendamento de reuniões recorrentes entre gestor e liderado
- Tópicos de pauta (criação e atualização de status)
- Notas da reunião com registro histórico

### SmartForms — Formulários Dinâmicos

- Criação visual de formulários multi-etapa com drag-and-drop (DnD Kit)
- Tipos de campo: `text`, `number`, `email`, `tel`, `date`, `date-range`, `textarea`, `radio`, `checkbox-grid`, `scale`, `rating`, `yes-no`
- Suporte bilíngue nativo (PT/ES) nos títulos, subtítulos, labels e opções
- Categorias: `evaluation`, `onboarding`, `survey`, `feedback`, `custom`
- Renderer para preenchimento do formulário pelo usuário final
- Respostas armazenadas e agregadas por formulário

### Conteúdo

- Biblioteca de materiais (vídeos, artigos, PDFs, links)
- Atribuição de conteúdos a colaboradores
- Registro de progresso individual

### Calendário

- Visão mensal agregando avaliações, tarefas PDI e 1:1s
- Locale dinâmico via `date-fns` (PT/ES)

### Histórico

- Timeline de avaliações concluídas com filtros

---

## Internacionalização (i18n)

Sistema 100% traduzido em PT-BR e ES.

- **`LanguageContext`** — provedor de idioma com `t(key, params?)`, `language` e `locale` (string BCP-47 para APIs nativas do browser)
- **`pt.ts` / `es.ts`** — ~600 chaves de tradução cada, cobrindo todas as páginas, componentes, toasts, labels de enums e mensagens de validação
- **`Language = 'pt' | 'es'`** — tipo único em `translations.ts`, importado onde necessário (sem literais duplicados)
- **`LOCALE_MAP`** — `{ pt: 'pt-BR', es: 'es-ES' }` para `toLocaleString()` e `date-fns`
- Seletor de idioma no header, preferência salva no perfil do usuário

Componentes 100% internacionalizados (sem strings PT hardcoded):
- Todas as páginas (`Admin`, `Evaluations`, `Feedback`, `KPIs`, `PDI`, `Calendar`, `Content`, `OneOnOnes`, `SmartForms`, `History`)
- Componentes compartilhados (`Breadcrumbs`, `MonthSelect`, `StatusBadge`, `EmptyState`)
- KPI charts (`KpiEvolutionChart`, `KpiComparisonChart`)
- Builder de formulários (`SmartFormBuilder` e todo o subfolder `builder/`)

---

## Dashboards

Três dashboards distintos por papel:

### Admin
- Estatísticas: usuários ativos, gestores, setores, admins
- Saúde operacional: avaliações do mês, PDIs ativos, tarefas pendentes, KPI médio
- Alertas automáticos: colaboradores sem gestor, tarefas escaladas (+10 dias), avaliações pendentes
- Visão por gestor (tabela com time, PDIs, tarefas, avaliações, KPI médio)
- **Checklist de onboarding** com 4 etapas: criar setores → cadastrar usuários → criar formulário → iniciar avaliação

### Gestor
- Pendências da equipe (tarefas PDI aguardando revisão, avaliações pendentes)
- Gráficos: progresso PDI, KPI da equipe, avaliações por status

### Colaborador
- PDI pessoal com progresso
- Avaliações pendentes
- Ações rápidas

---

## Arquitetura do backend

Estrutura modular em `backend/src/` (Domain-Driven):

```
src/
├── Auth/            Controllers, Requests, Resources, Services
├── Content/         Controllers, Enums, Models, Policies, Requests, Resources, Services
├── Evaluation/      Controllers, DTOs, Enums, Models, Policies, Requests, Resources, Services
├── Feedback/        Controllers, Enums, Models, Policies, Requests, Resources, Services
├── KPI/             Controllers, DTOs, Enums, Models, Policies, Requests, Resources, Services
├── OneOnOne/        Controllers, Enums, Models, Policies, Requests, Resources, Services
├── Organization/    Controllers, DTOs, Enums, Models, Observers, Policies, Requests, Resources, Services
├── PDI/             Controllers, DTOs, Enums, Models, Policies, Requests, Resources, Services
├── SmartForm/       Controllers, Enums, Models, Policies, Requests, Resources, Services
└── Shared/          Interfaces, Traits
```

Padrões adotados:
- **Policy** para autorização em todos os recursos
- **FormRequest** para validação de entrada
- **Resource** para serialização de saída (nunca arrays inline em `whenLoaded`)
- **Service** para lógica de negócio (Controllers finos)
- **DTO** para transferência de dados entre camadas
- **Observer** (`UserObserver`) para efeitos colaterais no ciclo de vida do usuário

---

## API REST

38 endpoints sob `/api` protegidos por `auth:sanctum`:

| Grupo | Endpoints |
|-------|-----------|
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Setores | CRUD `/sectors` |
| Usuários | `/users` (index, store, update, deactivate) |
| Perfil | `/profile` (show, update, team) |
| Avaliações | CRUD + `submit-self` + `submit-manager` |
| KPIs | CRUD `/kpis` + `/kpi-results` (index, upsert) |
| PDIs | `/pdis` + tasks (store, submit, review) |
| SmartForms | CRUD + responses (store, index, aggregate) |
| Feedback | received, sent, team, store, destroy |
| 1:1s | CRUD + topics + notes |
| Conteúdo | index, store, assign, updateProgress, progress |

---

## Testes

12 arquivos de Feature tests cobrindo todos os controllers:

| Arquivo | Cobertura |
|---------|-----------|
| `AuthControllerTest` | login, me, logout, token inválido |
| `SectorControllerTest` | CRUD com autorização por papel |
| `UserControllerTest` | criação, atualização, desativação, filtros |
| `ProfileControllerTest` | show, update, team |
| `EvaluationControllerTest` | fluxo completo de avaliação |
| `KpiControllerTest` | CRUD KPI + upsert resultado |
| `PdiControllerTest` | PDI + tarefas + fluxo submit/review |
| `SmartFormControllerTest` | CRUD + responses + aggregate |
| `FeedbackControllerTest` | received, sent, team, store, destroy |
| `OneOnOneControllerTest` | 1:1s + topics + notes |
| `ContentControllerTest` | items + assign + progress |

Infraestrutura:
- `TestCase` base com helpers: `actingAsAdmin()`, `actingAsGestor()`, `actingAsColaborador()`, `createWithProfile()`
- Database in-memory (`sqlite::memory:`) com `RefreshDatabase`

---

## Bugs corrigidos

### P1 — Críticos
- Rate limit 429 na sincronização com Power BI (Ipanema)

### P2 — Funcionais
- **BUG-202**: `DialogDescription` ausente em todos os Dialogs (acessibilidade Radix UI) — corrigido em 7+ arquivos
- **BUG-204**: `toLocaleString('pt-BR')` hardcoded — substituído por `locale` dinâmico do `LanguageContext`
- **BUG-205**: Validação em tempo real ausente no `Feedback.tsx` — adicionado contador de chars e aviso de mínimo 10 chars
- **BUG-206**: Texto de visibilidade "gestor" exibido para colaboradores — corrigido com `isManagerView = isAdmin || isGestor`
- **BUG-301**: Checklist de onboarding sempre marcava "formulário" como não feito — `formsCount` estava hardcoded como `0`; corrigido para usar `useSmartForms().data.length`

### P3 — Cosméticos
- **BUG-302**: "Conteudo" sem acento — já estava correto no código, era cache de build
- Botão Close dos Dialogs (`sr-only`) sem tradução — corrigido em `dialog.tsx`
- Strings PT hardcoded em KPI tiles, PDI toasts, Calendar, MonthSelect, Breadcrumbs — todas substituídas por `t()`

---

## Refatorações

- **SmartFormBuilder.tsx** (1116 → 142 linhas) — dividido em:
  - `builder/types.ts` — tipos e constantes de estilo
  - `builder/helpers.ts` — funções utilitárias e constantes de cor
  - `builder/I18nInput.tsx` — input bilíngue PT/ES
  - `builder/FieldEditor.tsx` — configuração por tipo de campo
  - `builder/SortableField.tsx` — linha DnD de campo
  - `builder/SortableStep.tsx` — card DnD de etapa com DnD interno de campos
  - `builder/SettingsCard.tsx` — configurações gerais (textos de botões)

- **`Language` type centralizado** — eliminados literais `'pt' | 'es'` duplicados; todos os arquivos usam `import type { Language } from '@/i18n/translations'`

- **`LanguageContext`** ampliado com `locale: string` (BCP-47) derivado de `LOCALE_MAP` para uso em `toLocaleString()` e `date-fns`
