<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Importa os dados legados do HR Compass (Supabase) para o schema Laravel.
 *
 * Uso:
 *   php artisan hr:import-legacy /caminho/para/export
 *   php artisan hr:import-legacy /caminho/para/export --passwords=/caminho/password_hashes.json
 *   php artisan hr:import-legacy /caminho/para/export --dry-run
 *
 * - Idempotente: upsert por UUID original (rodar 2x nao duplica).
 * - Preserva os UUIDs do Supabase, entao todas as FKs continuam validas.
 * - Senhas: se --passwords for informado (JSON {email: hash bcrypt do Supabase}),
 *   os usuarios entram com a senha antiga. Sem o arquivo, recebem senha aleatoria
 *   (bloqueados ate um admin redefinir).
 */
class ImportLegacyData extends Command
{
    protected $signature = 'hr:import-legacy
        {path : Pasta com os JSONs exportados do Supabase}
        {--passwords= : JSON {email: hash bcrypt} extraido de auth.users.encrypted_password}
        {--dry-run : Mostra contagens sem gravar nada}';

    protected $description = 'Importa dados legados do HR Compass (Supabase) preservando UUIDs';

    private string $path;

    private array $passwordHashes = [];

    public function handle(): int
    {
        $this->path = rtrim($this->argument('path'), '/');

        if (! is_dir($this->path)) {
            $this->error("Pasta nao encontrada: {$this->path}");

            return self::FAILURE;
        }

        if ($passwordsFile = $this->option('passwords')) {
            if (! is_file($passwordsFile)) {
                $this->error("Arquivo de senhas nao encontrado: {$passwordsFile}");

                return self::FAILURE;
            }
            $this->passwordHashes = json_decode(file_get_contents($passwordsFile), true) ?? [];
            $this->info(count($this->passwordHashes).' hashes de senha carregados.');
        } else {
            $this->warn('Sem --passwords: usuarios importados receberao senha aleatoria (admin precisa redefinir).');
        }

        if ($this->option('dry-run')) {
            $this->dryRun();

            return self::SUCCESS;
        }

        DB::transaction(function () {
            $this->importSectors();
            $this->importUsers();
            $this->importProfiles();
            $this->importUserRoles();
            $this->importDependents();
            $this->importEvaluationTopics();
            $this->importSmartForms();
            $this->importEvaluations();
            $this->importEvaluationResponses();
            $this->importKpis();
            $this->importKpiSectors();
            $this->importKpiResults();
            $this->importPdis();
            $this->importPdiTasks();
            $this->importOneOnOnes();
            $this->importSmartFormResponses();
        });

        $this->newLine();
        $this->info('Importacao concluida.');

        return self::SUCCESS;
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    private function load(string $table): array
    {
        $file = "{$this->path}/{$table}.json";

        if (! is_file($file)) {
            $this->warn("  [pulado] {$table}.json nao existe");

            return [];
        }

        return json_decode(file_get_contents($file), true) ?? [];
    }

    private function ts(?string $value): ?string
    {
        return $value ? Carbon::parse($value)->format('Y-m-d H:i:s') : null;
    }

    private function upsertById(string $table, array $rows): void
    {
        foreach ($rows as $row) {
            DB::table($table)->updateOrInsert(['id' => $row['id']], $row);
        }
        $this->line(sprintf('  [ok] %-25s %d linhas', $table, count($rows)));
    }

    private function dryRun(): void
    {
        $tables = [
            'sectors', 'auth_users', 'profiles', 'user_roles', 'dependents',
            'evaluation_topics', 'smart_forms', 'evaluations', 'evaluation_responses',
            'kpis', 'kpi_sectors', 'kpi_results', 'pdis', 'pdi_tasks',
            'one_on_ones', 'smart_form_responses',
        ];
        $this->info('[dry-run] Nada sera gravado. Contagens do export:');
        foreach ($tables as $table) {
            $this->line(sprintf('  %-25s %d linhas', $table, count($this->load($table))));
        }
    }

    // ---------------------------------------------------------------
    // Importadores (ordem respeita as FKs)
    // ---------------------------------------------------------------

    private function importSectors(): void
    {
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'name' => $r['name'],
            'description' => $r['description'] ?? null,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('sectors'));

        $this->upsertById('sectors', $rows);
    }

    private function importUsers(): void
    {
        // Nome vem do profile (full_name); fallback: prefixo do email.
        $names = [];
        foreach ($this->load('profiles') as $p) {
            $names[$p['user_id']] = $p['full_name'];
        }

        $rows = [];
        foreach ($this->load('auth_users') as $u) {
            $email = $u['email'];
            $rows[] = [
                'id' => $u['id'],
                'name' => $names[$u['id']] ?? Str::before($email, '@'),
                'email' => $email,
                'email_verified_at' => $this->ts($u['email_confirmed_at'] ?? null),
                'password' => $this->passwordHashes[$email] ?? Hash::make(Str::random(40)),
                'created_at' => $this->ts($u['created_at'] ?? null),
                'updated_at' => $this->ts($u['updated_at'] ?? $u['created_at'] ?? null),
            ];
        }

        $this->upsertById('users', $rows);
    }

    private function importProfiles(): void
    {
        // birth_date existia no legado mas nao ha coluna no schema novo — ver handoff.
        // manager_id e auto-referencia (profiles -> profiles): insere todos sem gestor
        // na 1a passada e liga os gestores na 2a, evitando violacao de FK por ordem.
        $legacy = $this->load('profiles');

        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'user_id' => $r['user_id'],
            'email' => $r['email'],
            'full_name' => $r['full_name'],
            'avatar_url' => $r['avatar_url'] ?? null,
            'sector_id' => $r['sector_id'] ?? null,
            'manager_id' => null,
            'preferred_language' => $r['preferred_language'] ?? 'pt',
            'active' => $r['active'] ?? true,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $legacy);

        $this->upsertById('profiles', $rows);

        foreach ($legacy as $r) {
            if (! empty($r['manager_id'])) {
                DB::table('profiles')->where('id', $r['id'])->update(['manager_id' => $r['manager_id']]);
            }
        }
    }

    private function importUserRoles(): void
    {
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'user_id' => $r['user_id'],
            'role' => $r['role'],
            'created_at' => $this->ts($r['created_at'] ?? null),
        ], $this->load('user_roles'));

        $this->upsertById('user_roles', $rows);
    }

    private function importDependents(): void
    {
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'profile_id' => $r['profile_id'],
            'name' => $r['name'],
            'birth_date' => $r['birth_date'],
            'relationship' => $r['relationship'],
            'consent' => $r['consent'] ?? false,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('dependents'));

        $this->upsertById('dependents', $rows);
    }

    private function importEvaluationTopics(): void
    {
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'name' => $r['name'],
            'description' => $r['description'] ?? null,
            'type' => $r['type'],
            'sector_id' => $r['sector_id'] ?? null,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('evaluation_topics'));

        $this->upsertById('evaluation_topics', $rows);
    }

    private function importSmartForms(): void
    {
        // created_by do legado nao tem coluna no schema novo — descartado.
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'name' => $r['name'],
            'slug' => $r['slug'],
            'config' => is_string($r['config']) ? $r['config'] : json_encode($r['config'], JSON_UNESCAPED_UNICODE),
            'status' => $r['status'] ?? 'active',
            'category' => $r['category'] ?? 'custom',
            'sector_id' => $r['sector_id'] ?? null,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('smart_forms'));

        $this->upsertById('smart_forms', $rows);
    }

    private function importEvaluations(): void
    {
        // form_id (legado) -> smart_form_id (novo).
        // Enums do fluxo cego legado nao existem no schema novo:
        //   flow_type blind_simultaneous -> blind
        //   status self_submitted -> pending_manager | both_submitted -> completed
        $statusMap = ['self_submitted' => 'pending_manager', 'both_submitted' => 'completed'];
        $flowMap = ['blind_simultaneous' => 'blind'];

        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'created_by' => $r['created_by'],
            'assigned_to' => $r['assigned_to'],
            'status' => $statusMap[$r['status']] ?? $r['status'],
            'type' => $r['type'],
            'flow_type' => $flowMap[$r['flow_type'] ?? 'sequential'] ?? $r['flow_type'] ?? 'sequential',
            'month' => $r['month'],
            'year' => $r['year'],
            'smart_form_id' => $r['form_id'] ?? null,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('evaluations'));

        $this->upsertById('evaluations', $rows);
    }

    private function importEvaluationResponses(): void
    {
        // topic_id do legado nao tem coluna no schema novo — descartado (ver handoff).
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'evaluation_id' => $r['evaluation_id'],
            'self_score' => $r['self_score'] ?? null,
            'manager_score' => $r['manager_score'] ?? null,
            'final_score' => $r['final_score'] ?? null,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('evaluation_responses'));

        $this->upsertById('evaluation_responses', $rows);
    }

    private function importKpis(): void
    {
        // sector_id legado (deprecado) ignorado — associacao vive em kpi_sectors.
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'name' => $r['name'],
            'description' => $r['description'] ?? null,
            'target_value' => $r['target_value'],
            'unit' => $r['unit'] ?? null,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('kpis'));

        $this->upsertById('kpis', $rows);
    }

    private function importKpiSectors(): void
    {
        $rows = $this->load('kpi_sectors');
        foreach ($rows as $row) {
            DB::table('kpi_sectors')->updateOrInsert(
                ['kpi_id' => $row['kpi_id'], 'sector_id' => $row['sector_id']],
                []
            );
        }
        $this->line(sprintf('  [ok] %-25s %d linhas', 'kpi_sectors', count($rows)));
    }

    private function importKpiResults(): void
    {
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'kpi_id' => $r['kpi_id'],
            'user_id' => $r['user_id'],
            'score' => $r['score'],
            'month' => $r['month'],
            'year' => $r['year'],
            'created_at' => $this->ts($r['created_at'] ?? null),
        ], $this->load('kpi_results'));

        $this->upsertById('kpi_results', $rows);
    }

    private function importPdis(): void
    {
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'user_id' => $r['user_id'],
            'title' => $r['title'],
            'description' => $r['description'] ?? null,
            'start_date' => $r['start_date'] ?? null,
            'end_date' => $r['end_date'] ?? null,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('pdis'));

        $this->upsertById('pdis', $rows);
    }

    private function importPdiTasks(): void
    {
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'pdi_id' => $r['pdi_id'],
            'title' => $r['title'],
            'description' => $r['description'] ?? null,
            'link' => $r['link'] ?? null,
            'completed' => $r['completed'] ?? false,
            'due_date' => $r['due_date'] ?? null,
            'status' => $r['status'] ?? 'pending',
            'reviewer_id' => $r['reviewer_id'] ?? null,
            'review_comment' => $r['review_comment'] ?? null,
            'reviewed_at' => $this->ts($r['reviewed_at'] ?? null),
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('pdi_tasks'));

        $this->upsertById('pdi_tasks', $rows);
    }

    private function importOneOnOnes(): void
    {
        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'manager_id' => $r['manager_id'],
            'report_id' => $r['report_id'],
            'scheduled_at' => $this->ts($r['scheduled_at']),
            'recurrence_rule' => $r['recurrence_rule'] ?? null,
            'status' => $r['status'] ?? 'scheduled',
            'notes' => $r['notes'] ?? null,
            'created_at' => $this->ts($r['created_at'] ?? null),
            'updated_at' => $this->ts($r['updated_at'] ?? $r['created_at'] ?? null),
        ], $this->load('one_on_ones'));

        $this->upsertById('one_on_ones', $rows);

        foreach (['one_on_one_topics', 'one_on_one_notes'] as $table) {
            $rows = array_map(fn ($r) => [
                'id' => $r['id'],
                'one_on_one_id' => $r['one_on_one_id'],
                'author_user_id' => $r['author_user_id'],
                'content' => $r['content'],
                'created_at' => $this->ts($r['created_at'] ?? null),
            ] + ($table === 'one_on_one_topics'
                ? ['addressed' => $r['addressed'] ?? false]
                : ['type' => $r['type'] ?? 'observation']
            ), $this->load($table));

            $this->upsertById($table, $rows);
        }
    }

    private function importSmartFormResponses(): void
    {
        // Legado: data/phase/submitted_at + evaluation_id.
        // Novo:   responses/status/completed_at (evaluation_id e phase nao existem — ver handoff).
        $slugs = DB::table('smart_forms')->pluck('slug', 'id');

        $rows = array_map(fn ($r) => [
            'id' => $r['id'],
            'form_id' => $r['form_id'],
            'form_slug' => $slugs[$r['form_id']] ?? '',
            'user_id' => $r['user_id'],
            'assigned_to' => $r['assigned_to'] ?? null,
            'assigned_by' => $r['assigned_by'] ?? null,
            'responses' => is_string($r['data']) ? $r['data'] : json_encode($r['data'], JSON_UNESCAPED_UNICODE),
            'status' => ! empty($r['submitted_at']) ? 'completed' : 'pending',
            'completed_at' => $this->ts($r['submitted_at'] ?? null),
            'created_at' => $this->ts($r['submitted_at'] ?? null),
            'updated_at' => $this->ts($r['submitted_at'] ?? null),
        ], $this->load('smart_form_responses'));

        $this->upsertById('smart_form_responses', $rows);
    }
}
