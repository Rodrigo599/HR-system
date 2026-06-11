#!/usr/bin/env node
/**
 * Gera tipos TypeScript a partir da spec OpenAPI do backend.
 *
 * Fluxo:
 *   1. Exporta api.json via `sail artisan scramble:export`
 *   2. Roda openapi-typescript sobre o arquivo gerado
 *   3. Escreve em frontend/types/api.generated.ts
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const backendDir = resolve(root, 'backend');
const specPath = resolve(backendDir, 'api.json');
const outPath = resolve(root, 'frontend/types/api.generated.ts');

const sail = resolve(backendDir, 'vendor/bin/sail');

if (!existsSync(sail)) {
  console.error('Sail não encontrado. Rode `composer install` no backend primeiro.');
  process.exit(1);
}

console.log('1/2  Exportando spec OpenAPI via Scramble...');
execSync(`${sail} artisan scramble:export`, { cwd: backendDir, stdio: 'inherit' });

if (!existsSync(specPath)) {
  console.error(`Spec não encontrada em ${specPath}`);
  process.exit(1);
}

console.log('2/2  Gerando tipos TypeScript...');
execSync(
  `npx openapi-typescript ${specPath} -o ${outPath}`,
  { cwd: root, stdio: 'inherit' }
);

console.log(`\nTipos gerados em: frontend/types/api.generated.ts`);
