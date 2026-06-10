<?php

use Illuminate\Support\Facades\Route;
use Src\Auth\Controllers\AuthController;
use Src\Evaluation\Controllers\EvaluationController;
use Src\KPI\Controllers\KpiController;
use Src\Organization\Controllers\ProfileController;
use Src\Organization\Controllers\SectorController;
use Src\Organization\Controllers\UserController;
use Src\PDI\Controllers\PdiController;
use Src\SmartForm\Controllers\SmartFormController;

// Autenticação pública
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Organização
    Route::get('/sectors', [SectorController::class, 'index']);
    Route::post('/sectors', [SectorController::class, 'store']);
    Route::put('/sectors/{sector}', [SectorController::class, 'update']);
    Route::delete('/sectors/{sector}', [SectorController::class, 'destroy']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::patch('/users/{user}/deactivate', [UserController::class, 'deactivate']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::get('/profile/team', [ProfileController::class, 'team']);

    // Avaliações
    Route::get('/evaluations', [EvaluationController::class, 'index']);
    Route::post('/evaluations', [EvaluationController::class, 'store']);
    Route::get('/evaluations/{evaluation}', [EvaluationController::class, 'show']);
    Route::put('/evaluations/{evaluation}/submit-self', [EvaluationController::class, 'submitSelf']);
    Route::put('/evaluations/{evaluation}/submit-manager', [EvaluationController::class, 'submitManager']);

    // KPIs
    Route::get('/kpis', [KpiController::class, 'index']);
    Route::post('/kpis', [KpiController::class, 'store']);
    Route::put('/kpis/{kpi}', [KpiController::class, 'update']);
    Route::delete('/kpis/{kpi}', [KpiController::class, 'destroy']);
    Route::get('/kpi-results', [KpiController::class, 'indexResults']);
    Route::post('/kpi-results', [KpiController::class, 'upsertResult']);

    // PDIs
    Route::get('/pdis', [PdiController::class, 'index']);
    Route::post('/pdis', [PdiController::class, 'store']);
    Route::get('/pdis/{pdi}/tasks', [PdiController::class, 'tasks']);
    Route::post('/pdis/{pdi}/tasks', [PdiController::class, 'storeTask']);
    Route::put('/pdis/{pdi}/tasks/{task}/submit', [PdiController::class, 'submitTask']);
    Route::put('/pdis/{pdi}/tasks/{task}/review', [PdiController::class, 'reviewTask']);

    // SmartForms
    Route::get('/smart-forms', [SmartFormController::class, 'index']);
    Route::post('/smart-forms', [SmartFormController::class, 'store']);
    Route::get('/smart-forms/{smartForm}', [SmartFormController::class, 'show']);
    Route::put('/smart-forms/{smartForm}', [SmartFormController::class, 'update']);
    Route::delete('/smart-forms/{smartForm}', [SmartFormController::class, 'destroy']);
    Route::post('/smart-forms/{smartForm}/responses', [SmartFormController::class, 'storeResponse']);
    Route::get('/smart-forms/{smartForm}/responses', [SmartFormController::class, 'indexResponses']);
    Route::get('/smart-forms/{smartForm}/aggregate', [SmartFormController::class, 'aggregate']);
});
