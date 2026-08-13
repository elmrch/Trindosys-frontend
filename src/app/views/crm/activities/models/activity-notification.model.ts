export type ActivityNotificationType = 'TASK_DUE_SOON' | 'TASK_OVERDUE' | 'FOLLOW_UP_DUE';

export interface ActivityNotification {
  id: number;
  activityId: number;
  customerId: number;
  type: ActivityNotificationType;
  message: string;
  createdAt: string;
  read: boolean;
  readAt: string | null;
}
