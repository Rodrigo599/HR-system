<?php

namespace Src\Content\Enums;

enum ContentStatus: string
{
    case NotSeen = 'not_seen';
    case Seen = 'seen';
    case InProgress = 'in_progress';
    case Completed = 'completed';
}
