<?php

namespace Src\PDI\Services;

use App\Models\User;
use Src\PDI\DTOs\CreatePdiTaskDTO;
use Src\PDI\DTOs\ReviewTaskDTO;
use Src\PDI\Enums\PdiTaskStatus;
use Src\PDI\Models\Pdi;
use Src\PDI\Models\PdiTask;

class PdiTaskService
{
    public function create(Pdi $pdi, CreatePdiTaskDTO $dto): PdiTask
    {
        return $pdi->tasks()->create([
            'title' => $dto->title,
            'description' => $dto->description,
            'link' => $dto->link,
            'due_date' => $dto->dueDate,
            'status' => PdiTaskStatus::Pending,
        ]);
    }

    public function submit(PdiTask $task): PdiTask
    {
        abort_if(
            $task->status !== PdiTaskStatus::Pending,
            422,
            'Tarefa não pode ser submetida no status atual.'
        );

        $task->update(['status' => PdiTaskStatus::Submitted]);

        return $task->fresh();
    }

    public function review(PdiTask $task, ReviewTaskDTO $dto, User $reviewer): PdiTask
    {
        abort_if(
            $task->status !== PdiTaskStatus::Submitted,
            422,
            'Tarefa não está aguardando revisão.'
        );

        $status = $dto->decision === 'approved'
            ? PdiTaskStatus::Approved
            : PdiTaskStatus::Rejected;

        $task->update([
            'status' => $status,
            'completed' => $status === PdiTaskStatus::Approved,
            'reviewer_id' => $reviewer->id,
            'review_comment' => $dto->comment,
            'reviewed_at' => now(),
        ]);

        return $task->fresh();
    }
}
