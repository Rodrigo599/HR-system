# HR System — Estrutura e Mudanças

---

## Estrutura de pastas

```
hr-system/
├── frontend/                    # React + TypeScript
│   ├── pages/                   # Uma página por rota
│   ├── components/
│   │   ├── admin/               # CreateUserDialog, FirstAccessChecklist, HierarchyView, UserFilters
│   │   ├── dashboard/           # AdminDashboard, GestorDashboard, ColaboradorDashboard + charts
│   │   ├── evaluations/         # EvaluationRadarChart, EvaluationSmartForm
│   │   ├── feedback/            # GiveFeedback
│   │   ├── kpis/                # KpiEvolutionChart, KpiComparisonChart
│   │   ├── layout/              # DashboardLayout, Header, Sidebar, ProtectedRoute
│   │   ├── shared/              # Breadcrumbs, EmptyState, MonthSelect, StatusBadge, selects
│   │   ├── smartforms/
│   │   │   ├── SmartFormBuilder.tsx    # Orquestrador DnD de etapas
│   │   │   ├── SmartFormRenderer.tsx   # Renderer para preenchimento
│   │   │   └── builder/                # Subfolder de subcomponentes (ver abaixo)
│   │   └── ui/                  # shadcn/ui (componentes de design system)
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Usuário logado, papéis, isAdmin/isGestor
│   │   ├── LanguageContext.tsx   # t(), language, locale, setLanguage
│   │   └── ViewModeContext.tsx   # Modo de visualização (admin simulando papel)
│   ├── hooks/
│   │   ├── api/                 # Um hook por domínio (useUsers, useEvaluations, etc.)
│   │   ├── useMutation.ts       # Wrapper de mutação com toast de sucesso/erro
│   │   └── use-toast.ts         # Toast hook (shadcn)
│   ├── i18n/
│   │   ├── translations.ts      # Tipo Language = 'pt' | 'es' + TranslationKey
│   │   ├── pt.ts                # 606 chaves em PT-BR
│   │   └── es.ts                # 606 chaves em ES
│   ├── lib/
│   │   ├── apiClient.ts         # Axios com base URL e interceptor de auth
│   │   ├── enums.ts             # Funções getLabelX(t) para enums traduzidos
│   │   ├── evaluationDataTransform.ts
│   │   └── utils.ts             # cn() e helpers gerais
│   └── types/
│       ├── api.ts               # Tipos de domínio exportados (User, Evaluation, etc.)
│       ├── api.generated.ts     # Gerado automaticamente do schema OpenAPI (Scramble)
│       └── smartforms.ts        # Tipos do sistema de formulários dinâmicos
│
├── backend/                     # Laravel 12 + PHP 8.4
│   ├── src/                     # Módulos DDD (fora do app/ padrão do Laravel)
│   │   ├── Auth/
│   │   ├── Content/
│   │   ├── Evaluation/
│   │   ├── Feedback/
│   │   ├── KPI/
│   │   ├── OneOnOne/
│   │   ├── Organization/
│   │   ├── PDI/
│   │   ├── SmartForm/
│   │   └── Shared/              # Interfaces e Traits reutilizáveis
│   ├── database/
│   │   ├── migrations/          # 12 migrations ordenadas (2026_01_01_00000X)
│   │   ├── factories/           # Factories por módulo para testes
│   │   └── seeders/             # DatabaseSeeder + ElMistiSeeder
│   ├── tests/Feature/           # 11 arquivos de testes de controller
│   └── routes/api.php           # 38 endpoints REST
│
└── docs/
    ├── projeto-resumo.md        # Visão geral do sistema
    └── estrutura-e-mudancas.md  # Este arquivo
```

---

## Estrutura interna de cada módulo backend

Todos os 9 módulos em `src/` seguem o mesmo padrão:

```
ModuloX/
├── Controllers/   XController.php         — recebe HTTP, delega ao Service, retorna Resource
├── DTOs/          CreateXDTO.php          — transfere dados validados entre camadas
├── Enums/         XStatus.php             — enums PHP 8.1 backed
├── Models/        X.php                   — Eloquent com casts, relations e scopes
├── Policies/      XPolicy.php             — autorização por papel (before() para admin)
├── Requests/      CreateXRequest.php      — validação de entrada com rules()
├── Resources/     XResource.php           — serialização de saída (nunca arrays inline)
└── Services/      XService.php            — lógica de negócio isolada
```

---

## Estrutura do SmartFormBuilder (após split)

O builder foi dividido de 1116 linhas em 1 arquivo para 7 arquivos especializados:

```
smartforms/
├── SmartFormBuilder.tsx     166 ln  — orquestrador: DnD de etapas + botão adicionar + SettingsCard
├── SmartFormRenderer.tsx            — renderer para preenchimento pelo usuário
└── builder/
    ├── types.ts              20 ln  — FieldType, Lang, FIELD_TYPE_BADGE_CLASS
    ├── helpers.ts            36 ln  — getI18nPt, makeI18n, i18nToLangs, emptyField, emptyStep
    ├── I18nInput.tsx         58 ln  — input bilíngue PT/ES com tabs
    ├── FieldEditor.tsx      269 ln  — configuração de campo por tipo (select, switches, options)
    ├── SortableField.tsx    101 ln  — linha DnD de campo com FieldEditor inline
    ├── SortableStep.tsx     258 ln  — card DnD de etapa com DnD interno de campos
    └── SettingsCard.tsx      68 ln  — textos dos botões submit/next/back (colapsável)
```

---

## Sistema de i18n — como funciona

```
translations.ts
  └── Language = 'pt' | 'es'
  └── TranslationKey = keyof typeof pt   ← inferido automaticamente

pt.ts / es.ts
  └── objeto as const com 606 chaves cada

LanguageContext.tsx
  ├── language: Language
  ├── locale: string           ← 'pt-BR' | 'es-ES' via LOCALE_MAP
  ├── setLanguage(lang)
  └── t(key, params?)          ← substitui {param} por regex

Uso nos componentes:
  const { t, language, locale } = useLanguage();
  t('save')                    → 'Salvar' | 'Guardar'
  t('checklistSteps', { done: 2, total: 4 }) → '2/4 etapas'
  toLocaleString(locale)       → formata datas/números no idioma correto
  format(date, 'MMMM', { locale: DATE_FNS_LOCALE[language] })
```

---

## Mudanças realizadas nas sessões

### 1. Internacionalização (i18n) — cobertura total

**O que era:** strings PT hardcoded espalhadas por todos os arquivos.

**O que foi feito:**

| Arquivo | Strings corrigidas |
|---------|-------------------|
| `KPIs.tsx` | `'Último registro'`, `'Informe um valor numérico válido'` |
| `KpiEvolutionChart.tsx` | `'Ultimos 6 meses'` |
| `KpiComparisonChart.tsx` | `'Ultimos 6 meses'` |
| `Evaluations.tsx` | labels de tipo/formulário, empty states, `'Colaborador'` fallback |
| `Content.tsx` | `'Acessar'` |
| `Feedback.tsx` | título de seção, `toLocaleDateString('pt-BR')` |
| `OneOnOnes.tsx` | `toLocaleString('pt-BR')` |
| `PDI.tsx` | 5 toasts: `'PDI criado'`, `'Tarefa adicionada'`, `'Tarefa enviada para revisão'`, `'Tarefa aprovada'`/`'rejeitada'`, `'Informe o motivo da rejeição'` |
| `Calendar.tsx` | dias da semana array, `{ locale: ptBR }` hardcoded, `` `Avaliação: ${e.type}` `` |
| `MonthSelect.tsx` | `MONTH_LABELS` estático → `t('january')` etc. em runtime |
| `Breadcrumbs.tsx` | `ROUTE_LABELS` estático → `ROUTE_KEYS` com `TranslationKey` em runtime |
| `Admin.tsx` | tabs, headers, toasts, validações de setores e KPIs |
| `dialog.tsx` | `'Close'` → `t('close')` no botão sr-only |
| `CreateUserDialog.tsx` | `'pt' \| 'es'` literal → tipo `Language` centralizado |

**`LanguageContext` ampliado:**
- Adicionado `LOCALE_MAP: Record<Language, string> = { pt: 'pt-BR', es: 'es-ES' }`
- Adicionado `locale: string` ao contexto para uso em `toLocaleString()` e `date-fns`

**`Language` type centralizado:**
- Eliminados todos os literais `'pt' | 'es'` duplicados nos componentes
- Todos importam `import type { Language } from '@/i18n/translations'`

**Chaves adicionadas aos arquivos de tradução** (total +~80 chaves em cada idioma):
- KPIs: `kpiLastRecord`, `kpiLast6Months`, `kpiInvalidScore`
- Avaliações: `formLabel`, `typeLabel`, `evalNonePending/Desc`, `evalNoneCreated/Desc`, `newEvaluationCta`, `collaboratorFallback`, `selectCollaboratorAndForm`
- Admin — setores: `newSector`, `editSector`, `sectorCreated`, `sectorUpdated`, `sectorDeleted`, `newSectorDesc`, `editSectorDesc`
- Admin — KPIs: `newKpi`, `editKpi`, `kpiCreated`, `kpiUpdated`, `kpiDeleted`, `kpiTarget`, `kpiUnit`, `kpiFillNameTarget`, `addSector`, `newKpiDesc`, `editKpiDesc`
- Admin — geral: `adminOnly`, `users`, `sectors`, `roles`, `sector`, `email`, `newUser`, `searchUser`, `deleteIrreversible`, `newCollaboratorDesc`
- Feedback: `feedbackSentSection`, `feedbackVisibilityWithManagerLabelCollab`, `feedbackVisibilityWithManagerDescCollab`, `feedbackDescriptionCollab`
- Conteúdo: `contentAccess`
- Dialogs: `registerKpiResultDesc`, `createEvaluationDesc`, `scheduleOneOnOneDesc`, `createPdiDesc`, `createTaskDesc`, `approveTaskDesc`, `rejectTaskDesc`, `createFormDesc`
- PDI: `taskAdded`, `rejectReason`
- Calendar: `calendarEvalPrefix`, `daySun`–`daySat`
- Breadcrumbs: `navEvaluations`, `navKpis`, `navPdi`, `navCalendar`, `navHistory`, `navAdmin`, `navSmartforms`, `navFeedback`, `navOneOnOnes`, `navContent`

---

### 2. Acessibilidade — DialogDescription em todos os Dialogs

**O que era:** Radix UI exige `<DialogDescription>` em todo `<Dialog>` para acessibilidade (leitores de tela). Estava ausente em todos os dialogs.

**Arquivos corrigidos:** `KPIs.tsx`, `Evaluations.tsx`, `OneOnOnes.tsx`, `PDI.tsx` (3 dialogs), `SmartForms.tsx` (2 dialogs), `Admin.tsx` (setores e KPIs), `CreateUserDialog.tsx`

---

### 3. Split do SmartFormBuilder

**O que era:** 1 arquivo de 1116 linhas com DnD, editor de campos, configuração por tipo, input bilíngue e settings tudo junto.

**O que foi feito:** dividido em 7 arquivos especializados no folder `builder/` mantendo zero erros TypeScript.

---

### 4. Bugs corrigidos

| Bug | Problema | Solução |
|-----|----------|---------|
| BUG-202 | `DialogDescription` ausente em todos os Dialogs | Adicionado em 7+ arquivos |
| BUG-204 | `'pt-BR'` hardcoded em `toLocaleString` e `format()` | `locale` derivado do `LanguageContext` |
| BUG-205 | Sem validação em tempo real no `Feedback.tsx` | Contador de chars + aviso de mínimo 10 chars abaixo do Textarea |
| BUG-206 | Texto "gestor" de visibilidade exibido a colaboradores | `isManagerView = isAdmin \|\| isGestor` condiciona o texto |
| BUG-301 | Checklist de onboarding: "formulário" nunca marcado como feito | `formsCount={0}` hardcoded → `formsCount={smartForms.length}` via `useSmartForms()` |

---

### 5. Testes de backend

**Cobertura criada do zero** (projeto não tinha testes antes):

```
tests/Feature/
├── Auth/AuthControllerTest.php            login, me, logout, token inválido
├── Organization/SectorControllerTest.php  CRUD com autorização por papel
├── Organization/UserControllerTest.php    criação, atualização, desativação
├── Organization/ProfileControllerTest.php show, update, team
├── Evaluation/EvaluationControllerTest.php fluxo completo de avaliação
├── KPI/KpiControllerTest.php              CRUD + upsert resultado
├── PDI/PdiControllerTest.php              PDI + tarefas + fluxo submit/review
├── SmartForm/SmartFormControllerTest.php  CRUD + responses + aggregate
├── Feedback/FeedbackControllerTest.php    received, sent, team, store, destroy
├── OneOnOne/OneOnOneControllerTest.php    1:1s + topics + notes
└── Content/ContentControllerTest.php      items + assign + progress
```

**TestCase base** com helpers reutilizáveis:
```php
$this->actingAsAdmin()         // cria user admin + autentica
$this->actingAsGestor()        // cria user gestor + autentica
$this->actingAsColaborador()   // cria user colaborador + autentica
$this->createWithProfile(...)  // cria user com perfil e setor associados
```

---

### 6. Pipeline CI/CD e contrato backend/frontend

**Arquivo:** `.github/workflows/ci.yml` — dois jobs em sequência, disparados em todo push e PR.

**Job `backend`** — instala dependências PHP, roda `php artisan test` com SQLite in-memory.

**Job `contract`** (só roda se `backend` passar) — implementa o contrato de API:

```
backend (Laravel + Scramble)
  └── php artisan scramble:export → backend/api.json   (schema OpenAPI gerado automaticamente)
        └── npx openapi-typescript → frontend/types/api.generated.ts
              └── npx tsc --noEmit                      (valida que o frontend compila)
                    └── git commit automático do api.generated.ts
```

**O que isso garante na prática:**

- O backend nunca precisa escrever tipos manualmente — o Scramble lê os `Resource`, `Request` e anotações PHP e gera o OpenAPI sozinho
- Se um endpoint mudar de nome, um campo for removido de um Resource, ou um parâmetro novo virar obrigatório, o `api.generated.ts` muda e o `tsc` quebra a pipeline
- O frontend consome os tipos via `api.generated.ts`, então o TypeScript detecta na hora de compilar se algo ficou dessincronizado

**Exemplo do fluxo:**

```php
// backend: EvaluationResource.php
public function toArray($request): array {
    return [
        'id'     => $this->id,
        'status' => $this->status,   // ← campo renomeado de 'state' para 'status'
        ...
    ];
}
```

```typescript
// api.generated.ts é regenerado automaticamente
// qualquer uso de .state no frontend vira erro de compilação:
evaluation.state  // ✗ Property 'state' does not exist
evaluation.status // ✓
```

Os tipos do frontend são importados assim:

```typescript
// frontend/types/api.ts
import type { components } from './api.generated';
export type Evaluation = components['schemas']['EvaluationResource'];
export type User       = components['schemas']['UserResource'];
// ... um export por schema
```

E nos hooks/componentes:

```typescript
const { data: evaluations } = useEvaluations(); // data: Evaluation[]
```

**Módulos com schema gerado automaticamente:** Auth, Organization (User, Profile, Sector), Evaluation, KPI, PDI, SmartForm, Feedback, OneOnOne, Content.

---

## O que não mudou / fora do escopo

- `SmartFormRenderer.tsx` — não alterado
- `App.tsx` — roteamento não alterado
- `apiClient.ts` — não alterado
- `lib/enums.ts` — não alterado
- Todos os componentes `ui/` (shadcn) — intocados exceto `dialog.tsx` (sr-only close)
- Schema do banco — nenhuma migration nova adicionada nas sessões
- Seeder — não alterado
