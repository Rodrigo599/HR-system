<?php

use Illuminate\Support\Facades\Route;
use Src\Auth\Controllers\AuthController;
use Src\Content\Controllers\ContentController;
use Src\Evaluation\Controllers\EvaluationController;
use Src\Feedback\Controllers\FeedbackController;
use Src\KPI\Controllers\KpiController;
use Src\OneOnOne\Controllers\OneOnOneController;
use Src\Organization\Controllers\DependentController;
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

    // Dependentes + aniversários
    Route::get('/dependents', [DependentController::class, 'index']);
    Route::post('/dependents', [DependentController::class, 'store']);
    Route::put('/dependents/{dependent}', [DependentController::class, 'update']);
    Route::delete('/dependents/{dependent}', [DependentController::class, 'destroy']);
    Route::get('/birthdays', [DependentController::class, 'birthdays']);

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

    // Feedback
    Route::get('/feedback/received', [FeedbackController::class, 'received']);
    Route::get('/feedback/sent', [FeedbackController::class, 'sent']);
    Route::get('/feedback/team', [FeedbackController::class, 'team']);
    Route::post('/feedback', [FeedbackController::class, 'store']);
    Route::delete('/feedback/{pointwiseFeedback}', [FeedbackController::class, 'destroy']);

    // 1:1s
    Route::get('/one-on-ones', [OneOnOneController::class, 'index']);
    Route::post('/one-on-ones', [OneOnOneController::class, 'store']);
    Route::get('/one-on-ones/{oneOnOne}', [OneOnOneController::class, 'show']);
    Route::put('/one-on-ones/{oneOnOne}', [OneOnOneController::class, 'update']);
    Route::post('/one-on-ones/{oneOnOne}/topics', [OneOnOneController::class, 'storeTopic']);
    Route::put('/one-on-ones/{oneOnOne}/topics/{topic}', [OneOnOneController::class, 'updateTopic']);
    Route::post('/one-on-ones/{oneOnOne}/notes', [OneOnOneController::class, 'storeNote']);

    // Conteúdo
    Route::get('/content', [ContentController::class, 'index']);
    Route::post('/content', [ContentController::class, 'store']);
    Route::post('/content/{contentItem}/assign', [ContentController::class, 'assign']);
    Route::put('/content/assignments/{contentAssignment}/progress', [ContentController::class, 'updateProgress']);
    Route::get('/content/{contentItem}/progress', [ContentController::class, 'progress']);
});
