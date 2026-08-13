export type ActivityAuditAction = 'UPDATED' | 'DELETED';

export interface ActivityAuditLog {
  id: number;
  activityId: number;
  action: ActivityAuditAction;
  performedBy: number;
  performedByName: string;
  performedAt: string;
  detail: string | null;
}
