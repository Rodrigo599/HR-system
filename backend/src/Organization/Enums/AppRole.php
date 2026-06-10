<?php

namespace Src\Organization\Enums;

enum AppRole: string
{
    case Admin = 'admin';
    case Gestor = 'gestor';
    case Colaborador = 'colaborador';
    case Analista = 'analista';
}
