<?php

namespace Src\Feedback\Enums;

enum FeedbackType: string
{
    case Kudos = 'kudos';
    case Adjustment = 'adjustment';
    case Observation = 'observation';
}
