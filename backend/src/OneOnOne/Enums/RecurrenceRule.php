<?php

namespace Src\OneOnOne\Enums;

enum RecurrenceRule: string
{
    case Weekly = 'weekly';
    case Biweekly = 'biweekly';
    case Monthly = 'monthly';
}
