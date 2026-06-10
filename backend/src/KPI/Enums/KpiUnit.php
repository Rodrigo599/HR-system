<?php

namespace Src\KPI\Enums;

enum KpiUnit: string
{
    case Percentual = 'percentual';
    case Numero = 'numero';
    case Moeda = 'moeda';
    case Tempo = 'tempo';
    case Custom = 'custom';
}
