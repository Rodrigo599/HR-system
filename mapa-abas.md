# Mapa Eixo → Abas — HR Compass

**Data:** 2026-05-01
**Projeto:** proj-20260501-b81131 / Fase 1
**Origem:** Auditoria UX + RBAC (briefing Pedro 2026-05-01)
**Critério:** Cada eixo tem ≥5 abas listadas com 1 frase de relevância

---

## Como ler este mapa

- **Eixo** = problema central identificado por Pedro
- **Aba** = tela, aba ou sub-view do HR Compass que precisa ser auditada para aquele eixo
- Mesma aba pode aparecer em múltiplos eixos (sobreposição esperada)

---

## Eixo 1 — Duplo Papel (Gestor + Colaborador)

Pedro é gestor de um time E colaborador com gestor acima dele. O sistema não trata os dois papéis ao mesmo tempo.

| # | Aba | Relevância |
|---|-----|------------|
| 1 | `Dashboard > Vista Gestor` | Mostra dados do time de Pedro, mas ignora Pedro como liderado — sem toggle para ver o próprio desenvolvimento |
| 2 | `Dashboard > Vista Colaborador` | Mostra Pedro como liderado, mas exige alternância manual de modo (viewMode toggle) em vez de coexistência |
| 3 | `PDI > Aba "Meus PDIs" (my)` | Deve conter só os PDIs onde Pedro é avaliado; conflito quando o sistema confunde papel de gestor |
| 4 | `PDI > Aba "Time" (team)` | Deve mostrar PDIs dos liderados de Pedro; só aparece corretamente no modo gestor — não coexiste com vista pessoal |
| 5 | `Avaliações > Aba "Minhas" (my)` | Avaliações onde Pedro é o avaliado (papel liderado); precisa ser isolada de avaliações que Pedro conduz como gestor |
| 6 | `Avaliações > Aba "Time" (team)` | Avaliações dos liderados que Pedro conduz como gestor; deve coexistir com "Minhas" sem um excluir o outro |
| 7 | `Perfil (Profile)` | Local onde o papel do usuário é configurado; duplo papel (gestor+colaborador) precisa ser representável aqui |
| 8 | `Calendário > Escopo Pessoal` | Eventos de Pedro como liderado (tarefas PDI, avaliações próprias); precisa coexistir com visão de equipe do gestor |

**Resultado (≥5 abas?):** SIM — 8 abas

---

## Eixo 2 — KPIs

Gestor define KPIs para a sua área; liderado vê apenas os seus. Hoje o sistema não separa bem quem define e quem acompanha.

| # | Aba | Relevância |
|---|-----|------------|
| 1 | `KPIs (página principal)` | Exibe lista de KPIs mas sem separação clara entre "KPIs que Pedro define como gestor" e "KPIs que Pedro cumpre como liderado" |
| 2 | `Dashboard > GestorDashboard > KpiSummaryChart` | Resumo dos KPIs do time do gestor; pode misturar KPIs pessoais do próprio Pedro |
| 3 | `Dashboard > ColaboradorDashboard` | Mostra KPIs pessoais do Pedro como liderado; precisa filtrar apenas os da sua área, não de outras |
| 4 | `Admin > Aba KPIs` | Admin define KPIs globais e vincula a setores; gestor deveria ter permissão similar para sua área |
| 5 | `Admin > Aba Setores` | KPIs são vinculados a setores; define quais KPIs cada colaborador vê — ponto central de configuração |
| 6 | `KPIs > KpiEvolutionChart` | Evolução histórica de um KPI individual; precisa filtrar por papel para não mostrar progresso errado |
| 7 | `KPIs > KpiComparisonChart` | Compara KPIs entre períodos ou colaboradores; pode expor KPIs de outros indevidamente |
| 8 | `Histórico (History)` | Registra metas e KPIs por período; deve separar o que Pedro registrou como gestor vs. como liderado |

**Resultado (≥5 abas?):** SIM — 8 abas

---

## Eixo 3 — PDIs

Mesma lógica dos KPIs: PDI que aparece para o Pedro como gestor (avaliado) não está correto. Deve aparecer só para Pedro como liderado.

| # | Aba | Relevância |
|---|-----|------------|
| 1 | `PDI > Aba "Meus PDIs" (my)` | Pedro como liderado — deve conter apenas PDIs criados pelo gestor DO Pedro, não PDIs que Pedro criou para outros |
| 2 | `PDI > Aba "Time" (team)` | Pedro como gestor — PDIs dos seus liderados; precisa estar separado completamente de "Meus PDIs" |
| 3 | `Dashboard > GestorDashboard > PdiProgressChart` | Gráfico de progresso dos PDIs do time; pode incluir o próprio Pedro indevidamente na lista de liderados |
| 4 | `Dashboard > ColaboradorDashboard` | Seção de progresso de PDI pessoal; deve refletir o PDI de Pedro como liderado, não os que ele gerencia |
| 5 | `Avaliações > Aba "Minhas"` | Avaliações culturais/desempenho geram itens de PDI; se papel estiver errado, item vai para a pessoa errada |
| 6 | `SmartForms` | Formulários de avaliação que alimentam PDIs; papel incorreto no contexto gera PDI para destinatário errado |
| 7 | `Calendário > Escopo Pessoal` | Tarefas de PDI com `due_date` aparecem no calendário pessoal; deve mostrar só tarefas do PDI de Pedro como liderado |
| 8 | `Histórico (History)` | Histórico de ciclos de PDI; precisa diferenciar ciclos onde Pedro participou como gestor vs. como liderado |

**Resultado (≥5 abas?):** SIM — 8 abas

---

## Eixo 4 — Calendário

Calendário aparece vazio em produção. A causa raiz é que os dados reais (PDI tasks, avaliações, dependentes) não estão sendo buscados ou filtrados corretamente por papel.

| # | Aba | Relevância |
|---|-----|------------|
| 1 | `Calendário > Visão Mês` | Grade mensal; funciona com dados mock em DEMO_MODE mas em produção depende de dados reais que não chegam |
| 2 | `Calendário > Visão Lista` | Lista de eventos do mês; mesmo problema — lista vazia em produção porque as queries retornam zero eventos |
| 3 | `Calendário > Escopo Pessoal` | Filtra eventos pessoais do usuário; `useAllPdiTasks` e `useEvaluations` precisam retornar dados para popular |
| 4 | `Calendário > Escopo Time` | Visão panorâmica do time (gestor/admin); busca dados de todos os liderados — provavelmente não implementado para produção |
| 5 | `PDI > Aba "Meus PDIs"` | Tarefas de PDI têm `due_date`; são a principal fonte de eventos do tipo `pdi_task` no calendário |
| 6 | `Avaliações > Aba "Minhas"` | Avaliações têm `month`/`year`; alimentam o calendário como tipo `evaluation` — dependência direta |
| 7 | `Admin > Aba Dependentes` | Aniversários de dependentes (filhos, cônjuge) alimentam o calendário como tipo `birthday` |
| 8 | `Dashboard > AlertsPanel` | Alertas de ações pendentes que deveriam se conectar ao calendário mas hoje são desacoplados |

**Resultado (≥5 abas?):** SIM — 8 abas

---

## Eixo 5 — Privacidade

Apenas admin deve ver certas informações pessoais dos colaboradores. Hoje não há camada de controle explícita implementada.

| # | Aba | Relevância |
|---|-----|------------|
| 1 | `Admin > Aba Usuários` | Admin vê lista completa com dados pessoais (nome, setor, papel, gestor); correto, mas sem mascaramento de campos sensíveis |
| 2 | `Admin > CreateUserDialog` | Criação de usuário com dados sensíveis; apenas admin deve acessar — verificar se RBAC bloqueia outros papéis na rota |
| 3 | `Admin > HierarchyView` | Expõe estrutura gestor-liderado; colaboradores podem ver a hierarquia completa? Precisa ser auditado |
| 4 | `Perfil (Profile)` | Dados pessoais do próprio usuário; quem pode ver o perfil de outro? Gestor vê perfil do liderado? |
| 5 | `Dashboard > AdminDashboard` | Visão agregada de todos os colaboradores de todos os setores; gestor de uma área não deveria ver dados de outras |
| 6 | `KPIs (página)` | KPIs de outros colaboradores podem estar visíveis para quem não tem relação de gestão com eles |
| 7 | `Avaliações > Aba "Time"` | Gestor vê avaliações dos liderados (correto), mas colaborador pode ver avaliações de colegas laterais? |
| 8 | `Admin > Aba Dependentes` | Dados de familiares dos colaboradores (nome, data nascimento, parentesco); dados altamente sensíveis sem controle de acesso explícito |

**Resultado (≥5 abas?):** SIM — 8 abas

---

## Eixo 6 — UX Admin

Admin precisa enxergar claramente "este KPI pertence ao setor X, aquele colaborador pertence ao setor Y". Hoje a navegação admin não tem essa separação visual.

| # | Aba | Relevância |
|---|-----|------------|
| 1 | `Admin > Aba Setores` | Gerencia setores mas sem visão integrada — ao clicar num setor, não agrupa KPIs e colaboradores daquele setor |
| 2 | `Admin > Aba KPIs` | Lista todos os KPIs sem agrupamento visual por setor; admin precisa scrollar para entender qual KPI pertence a onde |
| 3 | `Admin > Aba Usuários` | Lista usuários com filtro de setor (UserFilters), mas a view default não organiza por setor — exige filtragem manual |
| 4 | `Admin > HierarchyView` | Tenta mostrar hierarquia gestor-liderado, mas não é claro quais setores cada nó representa |
| 5 | `Admin > Aba Dependentes` | Lista dependentes sem contexto de a qual setor/colaborador cada dependente pertence |
| 6 | `Dashboard > AdminDashboard` | Visão geral mas sem separação de métricas por setor — admin não sabe qual número pertence a qual área |
| 7 | `Admin > FirstAccessChecklist` | Checklist de configuração inicial; pode confundir admin sobre a ordem correta de criar setores → KPIs → usuários |
| 8 | `Admin > UserFilters` | Filtros de usuário existem mas não estão aplicados como modo de navegação default por setor |

**Resultado (≥5 abas?):** SIM — 8 abas

---

## Resumo de Cobertura

| Eixo | Abas mapeadas | Critério (≥5) |
|------|--------------|--------------|
| 1. Duplo Papel | 8 | [OK] |
| 2. KPIs | 8 | [OK] |
| 3. PDIs | 8 | [OK] |
| 4. Calendário | 8 | [OK] |
| 5. Privacidade | 8 | [OK] |
| 6. UX Admin | 8 | [OK] |

**Critério da Fase 1 atingido: SIM**

---

## Inventário de telas do sistema (referência)

| Rota | Página | Sub-views / Abas |
|------|--------|-----------------|
| `/dashboard` | Dashboard | Admin, Gestor, Colaborador |
| `/kpis` | KPIs | KpiEvolutionChart, KpiComparisonChart |
| `/pdi` | PDI | Aba "my" (Meus PDIs), Aba "team" (Time) |
| `/calendar` | Calendário | Escopo Pessoal/Time × Visão Mês/Lista |
| `/evaluations` | Avaliações | Aba "my" (Minhas), Aba "team" (Time) |
| `/history` | Histórico | — |
| `/admin` | Admin | Setores, KPIs, Usuários, Dependentes |
| `/smart-forms` | SmartForms | — |
| `/profile` | Perfil | — |
| `/auth` | Auth | — |

**Componentes internos relevantes:**
- `dashboard/`: AdminDashboard, GestorDashboard, ColaboradorDashboard, AlertsPanel, PendingActions, QuickActions, KpiSummaryChart, KpiTrendChart, PdiProgressChart, EvaluationSummaryChart
- `kpis/`: KpiComparisonChart, KpiEvolutionChart
- `evaluations/`: EvaluationRadarChart, EvaluationSmartForm
- `admin/`: CreateUserDialog, FirstAccessChecklist, HierarchyView, UserFilters
