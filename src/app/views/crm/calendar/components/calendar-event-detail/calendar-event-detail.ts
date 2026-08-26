import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { CalendarAuditEntry, CalendarEventResponse, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS } from '../../models/calendar-event.model';
import { CalendarEventService } from '../../services/calendar-event.service';

@Component({
  selector: 'app-calendar-event-detail',
  imports: [DatePipe],
  templateUrl: './calendar-event-detail.html',
})
export class CalendarEventDetail implements OnInit {
  private readonly eventService = inject(CalendarEventService);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly event = input.required<CalendarEventResponse>();
  readonly close = output<void>();
  readonly edit = output<CalendarEventResponse>();
  readonly deleted = output<void>();
  readonly statusChanged = output<CalendarEventResponse>();

  protected readonly audit = signal<CalendarAuditEntry[]>([]);
  protected readonly isLoadingAudit = signal(false);

  protected readonly eventTypeLabels = EVENT_TYPE_LABELS;
  protected readonly eventTypeColors = EVENT_TYPE_COLORS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statusColors = STATUS_COLORS;

  ngOnInit(): void {
    this.loadAudit();
  }

  protected loadAudit(): void {
    this.isLoadingAudit.set(true);
    this.eventService.getAudit(this.event().id).subscribe({
      next: (audit) => {
        this.audit.set(audit);
        this.isLoadingAudit.set(false);
      },
      error: () => this.isLoadingAudit.set(false),
    });
  }

  protected onComplete(): void {
    this.sweetAlert.confirm('¿Marcar como completado?', 'El evento se marcará como completado.', 'Sí, completar').then((result) => {
      if (!result.isConfirmed) return;
      this.eventService.changeStatus(this.event().id, 'COMPLETADO').subscribe({
        next: (updated) => {
          this.sweetAlert.toast('Evento completado.');
          this.statusChanged.emit(updated);
        },
        error: () => this.sweetAlert.error('No se pudo cambiar el estado.'),
      });
    });
  }

  protected onCancel(): void {
    this.sweetAlert.confirm('¿Cancelar evento?', 'El evento se marcará como cancelado.', 'Sí, cancelar').then((result) => {
      if (!result.isConfirmed) return;
      this.eventService.changeStatus(this.event().id, 'CANCELADO').subscribe({
        next: (updated) => {
          this.sweetAlert.toast('Evento cancelado.');
          this.statusChanged.emit(updated);
        },
        error: () => this.sweetAlert.error('No se pudo cambiar el estado.'),
      });
    });
  }

  protected onDelete(): void {
    this.sweetAlert.confirm('¿Eliminar evento?', 'Esta acción no se puede deshacer.', 'Sí, eliminar').then((result) => {
      if (!result.isConfirmed) return;
      this.eventService.delete(this.event().id).subscribe({
        next: () => {
          this.sweetAlert.toast('Evento eliminado.');
          this.deleted.emit();
        },
        error: () => this.sweetAlert.error('No se pudo eliminar el evento.'),
      });
    });
  }

  protected formatDatetime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-EC', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  protected formatDatetimeShort(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
