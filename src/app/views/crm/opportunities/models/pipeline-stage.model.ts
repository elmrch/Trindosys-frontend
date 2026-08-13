export type StageType = 'OPEN' | 'WON' | 'LOST';

export interface PipelineStage {
  id: number;
  name: string;
  position: number;
  type: StageType;
  initial: boolean;
  color: string | null;
  probability: number | null;
  createdAt: string;
  createdBy: number | null;
  updatedAt: string | null;
  updatedBy: number | null;
}

export interface PipelineStageRequest {
  name: string;
  position?: number;
  type?: StageType;
  initial: boolean;
  color?: string | null;
  probability?: number | null;
}
