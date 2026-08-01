export type StageType = 'OPEN' | 'WON' | 'LOST';

export interface PipelineStage {
  id: number;
  name: string;
  position: number;
  type: StageType;
  initial: boolean;
}

export interface PipelineStageRequest {
  name: string;
  position?: number;
  type?: StageType;
  initial: boolean;
}
