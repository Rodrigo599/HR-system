<?php

namespace Src\SmartForm\Enums;

enum SmartFormStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Archived = 'archived';
}
