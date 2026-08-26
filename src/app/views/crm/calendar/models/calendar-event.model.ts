export type CalendarEventType = 'LLAMADA' | 'REUNION' | 'VISITA' | 'RECORDATORIO' | 'OTRO';
export type CalendarEventStatus = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
export type RelatedEntityType = 'OPORTUNIDAD' | 'CLIENTE' | 'TICKET';

export interface CalendarEventResponse {
  id: number;
  title: string;
  description: string | null;
  startDatetime: string;
  endDatetime: string | null;
  allDay: boolean;
  eventType: CalendarEventType;
  status: CalendarEventStatus;
  assignedUserId: number;
  assignedUserName: string;
  createdByUserId: number;
  createdByName: string;
  relatedEntityType: RelatedEntityType | null;
  relatedEntityId: number | null;
  relatedEntityName: string | null;
  reminderMinutesBefore: number | null;
  reminderSent: boolean;
  location: string | null;
  externalCalendarId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventRequest {
  title: string;
  description?: string;
  startDatetime: string;
  endDatetime?: string;
  allDay?: boolean;
  eventType: CalendarEventType;
  assignedUserId: number;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: number;
  reminderMinutesBefore?: number;
  location?: string;
}

export interface CalendarAuditEntry {
  id: number;
  calendarEventId: number;
  action: string;
  performedBy: number;
  performedByName: string;
  performedAt: string;
  detail: string;
}

export const EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; text: string; dot: string }> = {
  LLAMADA: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  REUNION: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  VISITA: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  RECORDATORIO: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  OTRO: { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' },
};

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  LLAMADA: 'Llamada',
  REUNION: 'Reunión',
  VISITA: 'Visita',
  RECORDATORIO: 'Recordatorio',
  OTRO: 'Otro',
};

export const STATUS_LABELS: Record<CalendarEventStatus, string> = {
  PENDIENTE: 'Pendiente',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

export const STATUS_COLORS: Record<CalendarEventStatus, { bg: string; text: string }> = {
  PENDIENTE: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
  COMPLETADO: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
  CANCELADO: { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400' },
};

export const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 día antes' },
];
