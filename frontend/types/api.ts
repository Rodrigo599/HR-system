/**
 * Contratos de API gerados automaticamente pelo Scramble (backend) + openapi-typescript.
 * Para regenerar: npm run api:types
 *
 * Este arquivo reexporta os tipos gerados com nomes legíveis para o restante do frontend.
 * Não edite os tipos aqui diretamente — edite os Resources/Requests no Laravel e regenere.
 */
import type { SmartFormConfig } from '@/types/smartforms';
import type { components } from '@/types/api.generated';

// Primitivos
export type AppRole = components['schemas']['AppRole'];

// Recursos de organização
export type Sector    = components['schemas']['SectorResource'];
export type Profile   = components['schemas']['ProfileResource'];
export type User      = components['schemas']['UserResource'];
export type AuthUser  = components['schemas']['AuthUserResource'];

// Avaliações
export type Evaluation         = components['schemas']['EvaluationResource'];
export type EvaluationResponse = components['schemas']['EvaluationResponseResource'];

// KPIs
export type Kpi       = components['schemas']['KpiResource'];
export type KpiResult = components['schemas']['KpiResultResource'];

// PDI
export type Pdi     = components['schemas']['PdiResource'];
export type PdiTask = components['schemas']['PdiTaskResource'];

// 1:1
export type OneOnOne      = components['schemas']['OneOnOneResource'];
export type OneOnOneTopic = components['schemas']['OneOnOneTopicResource'];
export type OneOnOneNote  = components['schemas']['OneOnOneNoteResource'];

// Feedback
export type PointwiseFeedback = components['schemas']['FeedbackResource'];

// Smart Forms
export type SmartForm         = components['schemas']['SmartFormResource'] & { config: SmartFormConfig };
export type SmartFormResponse = components['schemas']['SmartFormResponseResource'];

// Conteúdo
export type ContentItem       = components['schemas']['ContentItemResource'];
export type ContentAssignment = components['schemas']['ContentAssignmentResource'];

// Wrappers padrão das respostas Laravel Resource
export interface ApiList<T> { data: T[] }
export interface ApiItem<T> { data: T }
