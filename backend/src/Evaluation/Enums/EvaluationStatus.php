<?php

namespace Src\Evaluation\Enums;

enum EvaluationStatus: string
{
    case PendingSelf = 'pending_self';
    case PendingManager = 'pending_manager';
    case Completed = 'completed';
    case Closed = 'closed';
}
