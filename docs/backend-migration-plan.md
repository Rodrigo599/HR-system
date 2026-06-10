# HR System — Plano de Migração Backend (Laravel + DDD)

**Data:** 2026-06-10
**Referência de arquitetura:** hotelariadigital-1 (`src/Módulo/...`)
**Stack alvo:** Laravel 12, PHP 8.5, MySQL, Redis, Sanctum, Horizon
**Ambiente local:** Laravel Sail (Docker)

---

## 0. Decisão de Multitenancy

O sistema **não é multitenant hoje**, mas a arquitetura deve permitir a evolução sem refatoração de banco.

**Decisão:** preparar o terreno sem sobre-engenheirar.

### O que fazer na Fase 1
- Criar model e migration `Company` (id, name, slug, settings)
- Adicionar `company_id` em **todas** as tabelas de domínio (sectors, profiles, evaluations, kpis, pdis, etc.)
- Criar `Middleware/IdentifyTenant.php` que resolve o `company_id` pelo subdomínio ou header (desativado por padrão)
- Criar `Shared/Traits/BelongsToCompany.php` — scope global que filtra por `company_id` automaticamente em todos os models

### O que **não** fazer agora
- Não usar `stancl/tenancy` ainda — impõe estrutura pesada cedo demais
- Não criar banco separado por tenant — schema compartilhado por enquanto

### Como aticar multitenancy no futuro
Quando chegar a hora, o trabalho se resume a:
1. Popular `company_id` nos dados existentes
2. Ligar o middleware `IdentifyTenant`
3. Ativar o global scope `BelongsToCompany` em cada model

Custo de retrocompatibilidade: zero, porque as colunas já existem.

---

## 1. Estrutura de módulos (`src/`)

Seguindo o mesmo padrão do hotelariadigital, cada módulo vive em `src/NomeModulo/` e tem autonomia total. O `app/` do Laravel fica apenas com infraestrutura (Providers, Middleware, Console).

```
src/
├── Auth/
├── Organization/        # Usuários, perfis, setores, hierarquia
├── Evaluation/          # Ciclos de avaliação + respostas
├── KPI/                 # Definição e resultados de KPIs
├── PDI/                 # Planos de desenvolvimento + workflow de tarefas
├── Feedback/            # Feedback pontual (pointwise)
├── OneOnOne/            # Reuniões 1:1
├── SmartForm/           # Builder de formulários dinâmicos
├── Content/             # Itens de conteúdo + atribuições
├── Notification/        # Notificações internas
└── Shared/              # DTOs base, Traits, Interfaces reutilizáveis
```

---

## 2. Anatomia de cada módulo

Igual ao hotelariadigital. Cada módulo pode ter:

```
src/NomeModulo/
├── Controllers/
├── DTOs/
├── Enums/
├── Interfaces/
├── Jobs/
├── Models/
├── Observers/
├── Policies/
├── Requests/
├── Resources/
└── Services/
```

Nem todo módulo precisa de todas as pastas — crie somente o que usar.

---

## 3. Módulos detalhados

### 3.1 `Auth`

Autenticação via **Sanctum** (SPA tokens). Substitui o `supabase.auth`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Controllers/AuthController.php` | login, logout, me |
| `Requests/LoginRequest.php` | validação de email/senha |
| `Resources/AuthUserResource.php` | retorna user + profile + roles |
| `Services/AuthService.php` | lógica de autenticação + carga de perfil |
| `Middleware/EnsureRole.php` | substitui o `ProtectedRoute` do frontend |

**Rotas:**
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

---

### 3.2 `Organization`

Gerencia usuários, perfis, setores e hierarquia gestor→liderado. Consolida o que hoje está espalhado em `userManagementService.ts`, `profileService.ts` e `adminService.ts`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Models/User.php` | model auth (estende Authenticatable) |
| `Models/Profile.php` | dados pessoais, sector_id, manager_id |
| `Models/Sector.php` | setores/departamentos |
| `Models/UserRole.php` | papéis (admin, gestor, colaborador, analista) |
| `Models/Dependent.php` | dependentes para alertas de aniversário |
| `DTOs/CreateUserDTO.php` | criação de usuário + perfil + role |
| `DTOs/UpdateProfileDTO.php` | atualização de dados pessoais |
| `Services/UserService.php` | CRUD de usuários, ativação/desativação |
| `Services/ProfileService.php` | edição de perfil, avatar |
| `Services/HierarchyService.php` | `getTeamUserIds()`, `getDirectReports()` |
| `Observers/UserObserver.php` | cria Profile + Role `colaborador` no signup (substitui trigger SQL) |
| `Policies/UserPolicy.php` | só admin gerencia usuários |
| `Policies/ProfilePolicy.php` | usuário edita o próprio, gestor vê liderados |
| `Requests/CreateUserRequest.php` | |
| `Requests/UpdateProfileRequest.php` | |
| `Resources/UserResource.php` | |
| `Resources/ProfileResource.php` | inclui sector e roles |
| `Resources/SectorResource.php` | |
| `Enums/AppRole.php` | admin, gestor, colaborador, analista |

**Rotas:**
```
GET    /api/sectors
GET    /api/users
POST   /api/users
PUT    /api/users/{user}
DELETE /api/users/{user}
GET    /api/profile
PUT    /api/profile
GET    /api/profile/team          # liderados diretos do gestor logado
```

---

### 3.3 `Evaluation`

Ciclos de avaliação com fluxo `pending_self → pending_manager → completed`. Consolida `evaluationService.ts` e `useEvaluationForms.ts`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Models/Evaluation.php` | cabeçalho da avaliação |
| `Models/EvaluationTopic.php` | tópicos (legado, mantido como backup) |
| `Models/EvaluationResponse.php` | respostas self_score / manager_score |
| `DTOs/CreateEvaluationDTO.php` | |
| `DTOs/SubmitResponseDTO.php` | |
| `Services/EvaluationService.php` | criar, avançar status, calcular final_score |
| `Services/EvaluationQueryService.php` | listar por papel, por ano, por time |
| `Policies/EvaluationPolicy.php` | gestor/admin criam; avaliado e gestor respondem |
| `Enums/EvaluationStatus.php` | pending_self, pending_manager, completed, closed, etc. |
| `Enums/EvaluationType.php` | cultural, performance, kpi |
| `Observers/EvaluationObserver.php` | dispara notificação quando status muda |
| `Jobs/NotifyEvaluationCreatedJob.php` | email/notificação para o avaliado |
| `Requests/CreateEvaluationRequest.php` | |
| `Requests/SubmitResponseRequest.php` | |
| `Resources/EvaluationResource.php` | inclui assignee e responses |

**Rotas:**
```
GET    /api/evaluations
POST   /api/evaluations
GET    /api/evaluations/{evaluation}
PUT    /api/evaluations/{evaluation}/submit-self
PUT    /api/evaluations/{evaluation}/submit-manager
GET    /api/evaluations/history?year=2026
```

---

### 3.4 `KPI`

Definição de KPIs por setor e registro de resultados mensais. Consolida `kpiService.ts`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Models/Kpi.php` | definição do KPI (nome, meta, unidade) |
| `Models/KpiSector.php` | pivot many-to-many kpi↔sector |
| `Models/KpiResult.php` | resultado mensal por usuário |
| `DTOs/UpsertKpiResultDTO.php` | |
| `Services/KpiService.php` | CRUD de KPIs, vincular setores |
| `Services/KpiResultService.php` | upsert de resultado, histórico |
| `Services/KpiScopeService.php` | substitui `useKpiScope` — calcula quais KPIs e resultados o usuário pode ver (server-side) |
| `Policies/KpiPolicy.php` | admin gerencia; gestor vê time; colaborador vê o próprio |
| `Requests/StoreKpiRequest.php` | |
| `Requests/UpsertKpiResultRequest.php` | |
| `Resources/KpiResource.php` | |
| `Resources/KpiResultResource.php` | |
| `Enums/KpiUnit.php` | percentual, número, moeda, etc. |

**Rotas:**
```
GET    /api/kpis
POST   /api/kpis
PUT    /api/kpis/{kpi}
DELETE /api/kpis/{kpi}
GET    /api/kpi-results?month=6&year=2026
POST   /api/kpi-results
PUT    /api/kpi-results/{result}
```

---

### 3.5 `PDI`

Planos de desenvolvimento com workflow de tarefas (pending → submitted → approved/rejected). Consolida `pdiService.ts`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Models/Pdi.php` | cabeçalho do plano |
| `Models/PdiTask.php` | tarefa individual com status e revisão |
| `DTOs/CreatePdiDTO.php` | |
| `DTOs/CreatePdiTaskDTO.php` | |
| `DTOs/ReviewTaskDTO.php` | mode (approve/reject), comment |
| `Services/PdiService.php` | CRUD de PDIs, listas por usuário e por time |
| `Services/PdiTaskService.php` | criar, submeter para revisão, aprovar/rejeitar |
| `Policies/PdiPolicy.php` | usuário gerencia o próprio; gestor revisa time |
| `Observers/PdiTaskObserver.php` | notifica gestor quando tarefa é submetida |
| `Enums/PdiTaskStatus.php` | pending, submitted, approved, rejected |
| `Requests/CreatePdiRequest.php` | |
| `Requests/CreatePdiTaskRequest.php` | |
| `Requests/ReviewTaskRequest.php` | |
| `Resources/PdiResource.php` | inclui tasks |
| `Resources/PdiTaskResource.php` | |

**Rotas:**
```
GET    /api/pdis                         # PDIs do usuário logado
POST   /api/pdis
GET    /api/pdis/{pdi}/tasks
POST   /api/pdis/{pdi}/tasks
PUT    /api/pdis/{pdi}/tasks/{task}/submit
PUT    /api/pdis/{pdi}/tasks/{task}/review
GET    /api/team/pdis                    # PDIs dos liderados (gestor)
```

---

### 3.6 `Feedback`

Feedback pontual entre colaboradores com controle de visibilidade. Consolida `pointwiseFeedbackService.ts`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Models/PointwiseFeedback.php` | feedback de um usuário para outro |
| `DTOs/CreateFeedbackDTO.php` | |
| `Services/FeedbackService.php` | criar, listar recebidos/enviados, filtrar por visibilidade |
| `Policies/FeedbackPolicy.php` | remetente e destinatário veem; gestor vê do time conforme visibilidade |
| `Enums/FeedbackType.php` | positivo, construtivo, etc. |
| `Enums/FeedbackVisibility.php` | public, private, manager_only |
| `Requests/CreateFeedbackRequest.php` | |
| `Resources/FeedbackResource.php` | anonimiza remetente conforme visibilidade |

**Rotas:**
```
GET    /api/feedback/received
GET    /api/feedback/sent
POST   /api/feedback
```

---

### 3.7 `OneOnOne`

Reuniões 1:1 com pautas e notas. Consolida `oneOnOneService.ts`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Models/OneOnOne.php` | cabeçalho da reunião (manager_id, report_id, scheduled_at) |
| `Models/OneOnOneNote.php` | anotações da reunião |
| `Models/OneOnOneTopic.php` | pautas com flag `addressed` |
| `DTOs/CreateOneOnOneDTO.php` | |
| `Services/OneOnOneService.php` | CRUD, listar por gestor/liderado |
| `Policies/OneOnOnePolicy.php` | gestor e liderado gerenciam a própria reunião |
| `Requests/CreateOneOnOneRequest.php` | |
| `Resources/OneOnOneResource.php` | inclui topics e notes |

**Rotas:**
```
GET    /api/one-on-ones
POST   /api/one-on-ones
GET    /api/one-on-ones/{oneOnOne}
PUT    /api/one-on-ones/{oneOnOne}
POST   /api/one-on-ones/{oneOnOne}/notes
POST   /api/one-on-ones/{oneOnOne}/topics
PUT    /api/one-on-ones/{oneOnOne}/topics/{topic}
```

---

### 3.8 `SmartForm`

Builder de formulários dinâmicos com config tipada. Substitui o JSON opaco do Supabase. Consolida `useSmartForms.ts` e `useEvaluationForms.ts`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Models/SmartForm.php` | template do formulário (slug, category, config, status) |
| `Models/SmartFormResponse.php` | resposta preenchida (data em JSON tipado) |
| `DTOs/SmartFormConfigDTO.php` | estrutura tipada do campo `config` (substitui o Json opaco) |
| `DTOs/SubmitFormResponseDTO.php` | |
| `Services/SmartFormService.php` | CRUD de templates, listar por setor/categoria |
| `Services/SmartFormResponseService.php` | submeter, agregar respostas por formulário |
| `Policies/SmartFormPolicy.php` | admin/gestor criam; colaborador responde o que foi atribuído |
| `Requests/CreateSmartFormRequest.php` | valida a estrutura do `config` recursivamente |
| `Requests/SubmitFormResponseRequest.php` | |
| `Resources/SmartFormResource.php` | |
| `Resources/SmartFormResponseResource.php` | |
| `Enums/SmartFormCategory.php` | evaluation, feedback, survey, etc. |
| `Enums/SmartFormStatus.php` | draft, active, archived |

**Rotas:**
```
GET    /api/smart-forms
POST   /api/smart-forms
GET    /api/smart-forms/{form}
PUT    /api/smart-forms/{form}
POST   /api/smart-forms/{form}/responses
GET    /api/smart-forms/{form}/responses
GET    /api/smart-forms/{form}/aggregate
```

---

### 3.9 `Content`

Atribuição de conteúdo (treinamentos, leituras, processos) a usuários. Consolida `contentService.ts`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Models/ContentItem.php` | item de conteúdo (title, type, link_url, file_url) |
| `Models/ContentAssignment.php` | atribuição a um usuário com status de progresso |
| `DTOs/CreateContentItemDTO.php` | |
| `DTOs/AssignContentDTO.php` | |
| `Services/ContentService.php` | CRUD de itens, atribuir a usuários/setores |
| `Services/ContentProgressService.php` | atualizar status (seen, in_progress, completed) |
| `Policies/ContentPolicy.php` | admin/gestor criam e atribuem; colaborador atualiza próprio progresso |
| `Enums/ContentType.php` | training, reading, process |
| `Enums/ContentStatus.php` | not_seen, seen, in_progress, completed |
| `Requests/CreateContentItemRequest.php` | |
| `Requests/UpdateProgressRequest.php` | |
| `Resources/ContentItemResource.php` | inclui progresso do usuário logado |
| `Resources/ContentAssignmentResource.php` | |

**Rotas:**
```
GET    /api/content
POST   /api/content
POST   /api/content/{item}/assign
PUT    /api/content/assignments/{assignment}/progress
GET    /api/content/{item}/progress    # admin: taxa de conclusão
```

---

### 3.10 `Notification`

Notificações internas. Substitui a tabela `notifications` do Supabase + jobs de email.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Models/Notification.php` | notificação persistida (title, message, type, read) |
| `Services/NotificationService.php` | criar, marcar como lida, listar não lidas |
| `Jobs/SendEmailNotificationJob.php` | substitui a Edge Function do Supabase — usa Laravel Mail + Queue |
| `Mail/EvaluationAssignedMail.php` | |
| `Mail/PdiTaskSubmittedMail.php` | |
| `Resources/NotificationResource.php` | |

**Rotas:**
```
GET    /api/notifications
PUT    /api/notifications/{notification}/read
PUT    /api/notifications/read-all
```

---

## 4. Infraestrutura transversal

### 4.1 `Shared/`

```
src/Shared/
├── DTOs/
│   └── PaginatedDTO.php          # wrapper de paginação padrão
├── Traits/
│   ├── DtoFromRequest.php        # fromRequest() padrão
│   └── HasSectorScope.php        # scope para filtrar por setor
└── Interfaces/
    └── ScopedByRoleInterface.php # contrato de serviços que filtram por papel
```

### 4.2 Packages recomendados

| Package | Uso |
|---------|-----|
| `laravel/sanctum` | Auth SPA (substitui supabase.auth) |
| `spatie/laravel-permission` | Roles e policies (substitui RLS + user_roles) |
| `spatie/laravel-activitylog` | Auditoria (quem aprovou, quem criou avaliação) |
| `laravel/horizon` | Monitoramento de filas via Redis |
| `laravel/telescope` | Debug local |

### 4.3 Redis — usos

| Contexto | Driver |
|----------|--------|
| Filas (jobs de email, notificações) | `QUEUE_CONNECTION=redis` |
| Cache de queries pesadas (KPI scope, team hierarchy) | `CACHE_DRIVER=redis` |
| Sessões (se optar por session-based auth) | `SESSION_DRIVER=redis` |
| Rate limiting de rotas da API | `RateLimiter` com Redis |

### 4.4 Laravel Sail — serviços no `docker-compose.yml`

```yaml
services:
  - mysql
  - redis
  - mailpit    # captura emails em desenvolvimento
```

Comando diário: `./vendor/bin/sail up -d`
Horizon local: `./vendor/bin/sail artisan horizon`

### 4.3 Autoload em `composer.json`

```json
"autoload": {
    "psr-4": {
        "App\\": "app/",
        "Src\\": "src/"
    }
}
```

---

## 5. Migração do banco

O schema já existe nas migrations do Supabase (`supabase/migrations/`). A conversão é direta para Laravel migrations:

- UUIDs → `$table->uuid('id')->primary()`
- Enums do Postgres → Enums PHP + cast no Model
- RLS policies → Policies do Laravel (eliminadas do banco)
- Funções SQL (`get_my_team_user_ids`, etc.) → métodos em `HierarchyService`
- Trigger `handle_new_user` → `UserObserver::created()`

**Ordem de criação das migrations:**
1. `sectors`
2. `users` + `profiles`
3. `user_roles`
4. `evaluation_topics`
5. `evaluations` + `evaluation_responses`
6. `kpis` + `kpi_sectors` + `kpi_results`
7. `pdis` + `pdi_tasks`
8. `smart_forms` + `smart_form_responses`
9. `pointwise_feedback`
10. `one_on_ones` + `one_on_one_notes` + `one_on_one_topics`
11. `content_items` + `content_assignments`
12. `notifications`
13. `dependents`
14. `activity_log` (spatie)

---

## 6. Migração do frontend React

O frontend **não precisa ser reescrito**. A mudança é nos `src/services/*.ts`:

| Service atual | Mudança |
|--------------|---------|
| `supabase.auth.signInWithPassword()` | `axios.post('/api/auth/login')` |
| `supabase.from('evaluations').select()` | `axios.get('/api/evaluations')` |
| `DEMO_MODE` guards | Removidos — usar `DatabaseSeeder` com dados de demo |
| `ViewModeContext` com localStorage | Modo calculado server-side, retornado no `/api/auth/me` |

**Autenticação no frontend:**
- Login retorna token Sanctum
- Token salvo em `httpOnly cookie` ou `localStorage` (decisão a definir)
- `AuthContext` passa a chamar `/api/auth/me` em vez do Supabase

---

## 7. Ordem de implementação sugerida

### Fase 1 — Fundação
- [ ] Criar projeto Laravel 12 + configurar `src/` no autoload
- [ ] Instalar Sanctum + spatie/permission + Horizon + Telescope
- [ ] Módulo `Auth` completo (login, logout, me)
- [ ] Módulo `Organization` completo (users, profiles, sectors, hierarchy)
- [ ] Migrations de todos os módulos
- [ ] Seeders de demo (substitui DEMO_MODE)

### Fase 2 — Core de RH
- [ ] Módulo `Evaluation`
- [ ] Módulo `KPI`
- [ ] Módulo `PDI`
- [ ] Módulo `SmartForm`

### Fase 3 — Engajamento
- [ ] Módulo `Feedback`
- [ ] Módulo `OneOnOne`
- [ ] Módulo `Content`
- [ ] Módulo `Notification` + Jobs de email

### Fase 4 — Frontend
- [ ] Substituir `integrations/supabase/client.ts` por cliente Axios
- [ ] Migrar cada `src/services/*.ts` para chamar a API Laravel
- [ ] Remover todos os blocos `DEMO_MODE`
- [ ] Testar fluxos críticos: login, avaliação completa, PDI com aprovação

---

## 8. O que NÃO migrar agora

- Supabase Realtime (notificações em tempo real) — manter Supabase para isso enquanto não tiver Laravel Echo/Reverb
- Edge Function `delete-user` — migrar junto com o módulo `Organization`
- Dados existentes em produção — plano de migração de dados separado, a definir após estabilizar o schema
