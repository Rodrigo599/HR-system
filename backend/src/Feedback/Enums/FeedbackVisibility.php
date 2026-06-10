<?php

namespace Src\Feedback\Enums;

enum FeedbackVisibility: string
{
    case Private = 'private';
    case WithManager = 'with_manager';
}
