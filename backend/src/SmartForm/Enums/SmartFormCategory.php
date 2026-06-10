<?php

namespace Src\SmartForm\Enums;

enum SmartFormCategory: string
{
    case Evaluation = 'evaluation';
    case Onboarding = 'onboarding';
    case Survey = 'survey';
    case Feedback = 'feedback';
    case Custom = 'custom';
}
