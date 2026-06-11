# HR System

Sistema de RH com backend Laravel 13 (PHP 8.4) e frontend React + TypeScript.

## Arquitetura

```
hr-system/
├── backend/      # Laravel 13 — API REST, roda via Docker (Sail)
└── frontend/     # React + Vite — roda localmente com npm
```

## Pré-requisitos

- Docker Desktop rodando
- Node.js 22+ e npm
- PHP 8.4 + Composer (apenas para o primeiro `composer install` fora do Sail)

---

## Setup inicial

### 1. Backend (Laravel Sail)

```bash
cd backend

# Instalar dependências PHP (uma vez, fora do Docker)
composer install

# Copiar o .env e gerar a chave
cp .env.example .env
./vendor/bin/sail artisan key:generate

# Subir os containers
./vendor/bin/sail up -d

# Rodar as migrations
./vendor/bin/sail artisan migrate

# (Opcional) Popular com dados de exemplo
./vendor/bin/sail artisan db:seed
```

A API estará disponível em **http://localhost/api**.

> Todos os comandos artisan devem rodar dentro do Sail:
> `./vendor/bin/sail artisan <comando>`

### 2. Frontend (React + Vite)

```bash
# Na raiz do projeto (não dentro de backend/)
npm install

# Copiar o .env
cp .env.example .env   # VITE_API_URL=http://localhost/api

# Subir o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em **http://localhost:5173**.

---

## Comandos do dia a dia

### Backend

```bash
# Subir / parar containers
./vendor/bin/sail up -d
./vendor/bin/sail down

# Rodar testes
./vendor/bin/sail test

# Criar migration
./vendor/bin/sail artisan make:migration create_exemplo_table

# Tinker (REPL)
./vendor/bin/sail artisan tinker
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Testes
npm run test
```

### Contrato de API

Sempre que alterar um Resource ou FormRequest no Laravel, regenere os tipos TypeScript:

```bash
npm run api:types
```

Isso exporta a spec OpenAPI via Scramble e gera `frontend/types/api.generated.ts` com os tipos atualizados. O CI também faz isso automaticamente a cada push.

---

## CI

O GitHub Actions roda a cada push/PR:

1. **PHP Tests** — roda todos os feature tests com SQLite em memória
2. **API Contract** — gera a spec OpenAPI, gera os tipos TypeScript, valida com `tsc --noEmit` e commita `api.generated.ts` de volta no branch se houver mudanças
