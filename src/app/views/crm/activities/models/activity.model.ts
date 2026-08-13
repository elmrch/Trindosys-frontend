export type ActivityType = 'CALL' | 'TASK' | 'NOTE' | 'FOLLOW_UP';

export type CallResult = 'ANSWERED' | 'NOT_ANSWERED' | 'RESCHEDULED';

export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface Activity {
  id: number;
  customerId: number;
  type: ActivityType;
  authorId: number;
  authorName: string;
  activityDate: string;
  content: string | null;
  callResult: CallResult | null;
  assignedAdvisorId: number | null;
  assignedAdvisorName: string | null;
  dueDate: string | null;
  taskStatus: TaskStatus | null;
  targetDate: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCallRequest {
  occurredAt: string;
  result: CallResult;
  notes: string | null;
}

export interface CreateTaskRequest {
  description: string;
  dueDate: string;
  assignedAdvisorId: number | null;
}

export interface CreateNoteRequest {
  content: string;
}

export interface CreateFollowUpRequest {
  targetDate: string;
  reason: string;
}

export interface UpdateActivityRequest {
  content?: string;
  occurredAt?: string;
  callResult?: CallResult;
  dueDate?: string;
  taskStatus?: TaskStatus;
  assignedAdvisorId?: number | null;
  targetDate?: string;
  reason?: string;
}
