<?php

namespace Src\Evaluation\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Src\Evaluation\Enums\EvaluationFlowType;
use Src\Evaluation\Enums\EvaluationStatus;
use Src\Evaluation\Enums\EvaluationType;
use Src\SmartForm\Models\SmartForm;

class Evaluation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'created_by', 'assigned_to', 'status', 'type',
        'flow_type', 'month', 'year', 'smart_form_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => EvaluationStatus::class,
            'type' => EvaluationType::class,
            'flow_type' => EvaluationFlowType::class,
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'assigned_to');
    }

    public function smartForm(): BelongsTo
    {
        return $this->belongsTo(SmartForm::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(EvaluationResponse::class);
    }
}
