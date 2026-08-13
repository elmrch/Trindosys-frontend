import { CustomerSummary } from '../../../../shared/models/customer-summary.model';
import { PipelineStage } from './pipeline-stage.model';

export interface Opportunity {
  id: number;
  customer: CustomerSummary;
  advisorId: number | null;
  stage: PipelineStage;
  estimatedValue: number | null;
  description: string | null;
  lossReason: string | null;
  createdAt: string;
  createdBy: number | null;
  updatedAt: string;
  updatedBy: number | null;
  closedAt: string | null;
  stageChangedAt: string;
  activityCount: number;
}

export interface OpportunityRequest {
  customerId: number;
  advisorId: number | null;
  estimatedValue: number | null;
  description: string | null;
}

export interface MoveOpportunityStageRequest {
  stageId: number;
}

export interface CloseOpportunityRequest {
  stageId: number;
  lossReason: string | null;
}

export interface OpportunityBoardEvent {
  type: string;
  opportunity: Opportunity;
}
