import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { ActivityAuditLog } from '../../models/activity-audit-log.model';
import { Activity, ActivityType, UpdateActivityRequest } from '../../models/activity.model';
import { ActivityService } from '../../services/activity.service';

interface EditDraft {
  content: string;
  occurredAt: string;
  callResult: string;
  dueDate: string;
  taskStatus: string;
  assignedAdvisorId: string;
  targetDate: string;
  reason: string;
}

const EMPTY_DRAFT: EditDraft = {
  content: '',
  occurredAt: '',
  callResult: 'ANSWERED',
  dueDate: '',
  taskStatus: 'PENDING',
  assignedAdvisorId: '',
  targetDate: '',
  reason: '',
};

const TYPE_FILTERS: { label: string; value: ActivityType | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Llamadas', value: 'CALL' },
  { label: 'Tareas', value: 'TASK' },
  { label: 'Notas', value: 'NOTE' },
  { label: 'Seguimientos', value: 'FOLLOW_UP' },
];

@Component({
  selector: 'app-activities-timeline',
  imports: [DatePipe],
  templateUrl: './activities-timeline.html',
})
export class ActivitiesTimeline {
  private readonly activityService = inject(ActivityService);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly customerId = input.required<number>();
  readonly refreshToken = input<number>(0);

  protected readonly typeFilters = TYPE_FILTERS;
  protected readonly activeFilter = signal<ActivityType | null>(null);

  protected readonly activities = signal<Activity[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly editingId = signal<number | null>(null);
  protected readonly editDraft = signal<EditDraft>({ ...EMPTY_DRAFT });
  protected readonly isSaving = signal(false);

  protected readonly expandedAuditId = signal<number | null>(null);
  protected readonly auditLogs = signal<ActivityAuditLog[]>([]);
  protected readonly isLoadingAudit = signal(false);

  constructor() {
    effect(() => {
      this.customerId();
      this.activeFilter();
      this.refreshToken();
      this.load();
    });
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.activityService.timeline(this.customerId(), this.activeFilter() ?? undefined).subscribe({
      next: (activities) => {
        this.activities.set(activities);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudo cargar la línea de tiempo de actividades.');
      },
    });
  }

  protected setFilter(type: ActivityType | null): void {
    this.activeFilter.set(type);
  }

  protected typeLabel(type: ActivityType): string {
    switch (type) {
      case 'CALL':
        return 'Llamada';
      case 'TASK':
        return 'Tarea';
      case 'NOTE':
        return 'Nota';
      case 'FOLLOW_UP':
        return 'Seguimiento';
    }
  }

  protected callResultLabel(result: string | null): string {
    switch (result) {
      case 'ANSWERED':
        return 'Contestó';
      case 'NOT_ANSWERED':
        return 'No contestó';
      case 'RESCHEDULED':
        return 'Reagendó';
      default:
        return '—';
    }
  }

  protected taskStatusLabel(status: string | null): string {
    return status === 'COMPLETED' ? 'Completada' : 'Pendiente';
  }

  protected isEditing(activity: Activity): boolean {
    return this.editingId() === activity.id;
  }

  protected startEdit(activity: Activity): void {
    this.editingId.set(activity.id);
    this.editDraft.set({
      content: activity.content ?? '',
      occurredAt: this.toLocalInputValue(activity.activityDate),
      callResult: activity.callResult ?? 'ANSWERED',
      dueDate: this.toLocalInputValue(activity.dueDate),
      taskStatus: activity.taskStatus ?? 'PENDING',
      assignedAdvisorId: activity.assignedAdvisorId != null ? String(activity.assignedAdvisorId) : '',
      targetDate: this.toLocalInputValue(activity.targetDate),
      reason: activity.reason ?? '',
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editDraft.set({ ...EMPTY_DRAFT });
  }

  protected updateDraft<K extends keyof EditDraft>(field: K, value: string): void {
    this.editDraft.update((draft) => ({ ...draft, [field]: value }));
  }

  protected saveEdit(activity: Activity): void {
    const draft = this.editDraft();
    const request: UpdateActivityRequest = {};

    switch (activity.type) {
      case 'NOTE':
        request.content = draft.content;
        break;
      case 'CALL':
        request.content = draft.content;
        request.occurredAt = this.fromLocalInputValue(draft.occurredAt);
        request.callResult = draft.callResult as UpdateActivityRequest['callResult'];
        break;
      case 'TASK':
        request.content = draft.content;
        request.dueDate = this.fromLocalInputValue(draft.dueDate);
        request.taskStatus = draft.taskStatus as UpdateActivityRequest['taskStatus'];
        request.assignedAdvisorId = draft.assignedAdvisorId ? Number(draft.assignedAdvisorId) : null;
        break;
      case 'FOLLOW_UP':
        request.targetDate = this.fromLocalInputValue(draft.targetDate);
        request.reason = draft.reason;
        break;
    }

    this.isSaving.set(true);
    this.activityService.update(activity.id, request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cancelEdit();
        this.load();
        this.sweetAlert.toast('Actividad actualizada.');
      },
      error: () => {
        this.isSaving.set(false);
        this.sweetAlert.error('No se pudo guardar la edición.');
      },
    });
  }

  protected complete(activity: Activity): void {
    this.activityService.complete(activity.id).subscribe({
      next: () => {
        this.sweetAlert.toast('Tarea completada.');
        this.load();
      },
      error: () => this.sweetAlert.error('No se pudo completar la tarea.'),
    });
  }

  protected remove(activity: Activity): void {
    this.sweetAlert
      .confirm('¿Eliminar esta actividad?', 'Esta acción no se puede deshacer.', 'Sí, eliminar')
      .then((result) => {
        if (!result.isConfirmed) {
          return;
        }
        this.activityService.delete(activity.id).subscribe({
          next: () => {
            this.sweetAlert.toast('Actividad eliminada.');
            this.load();
          },
          error: () => this.sweetAlert.error('No se pudo eliminar la actividad.'),
        });
      });
  }

  protected toggleAudit(activity: Activity): void {
    if (this.expandedAuditId() === activity.id) {
      this.expandedAuditId.set(null);
      return;
    }
    this.expandedAuditId.set(activity.id);
    this.isLoadingAudit.set(true);
    this.activityService.auditLog(activity.id).subscribe({
      next: (logs) => {
        this.auditLogs.set(logs);
        this.isLoadingAudit.set(false);
      },
      error: () => {
        this.isLoadingAudit.set(false);
      },
    });
  }

  protected auditActionLabel(action: string): string {
    return action === 'DELETED' ? 'Eliminada' : 'Editada';
  }

  private toLocalInputValue(iso: string | null): string {
    if (!iso) {
      return '';
    }
    const date = new Date(iso);
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  private fromLocalInputValue(value: string): string {
    return new Date(value).toISOString();
  }
}
