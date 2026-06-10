<?php

namespace Src\PDI\Enums;

enum PdiTaskStatus: string
{
    case Pending = 'pending';
    case Submitted = 'submitted';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
