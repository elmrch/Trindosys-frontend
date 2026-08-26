import { Component, OnInit, inject, signal } from '@angular/core';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { CalendarEventResponse, EVENT_TYPE_LABELS, STATUS_LABELS } from './models/calendar-event.model';
import { CalendarEventService } from './services/calendar-event.service';
import { CalendarGrid } from './components/calendar-grid/calendar-grid';
import { CalendarEventForm } from './components/calendar-event-form/calendar-event-form';
import { CalendarEventDetail } from './components/calendar-event-detail/calendar-event-detail';

@Component({
  selector: 'app-calendar',
  imports: [CalendarGrid, CalendarEventForm, CalendarEventDetail],
  templateUrl: './calendar.html',
})
export class Calendar implements OnInit {
  private readonly eventService = inject(CalendarEventService);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly events = signal<CalendarEventResponse[]>([]);
  protected readonly isLoading = signal(false);

  protected readonly currentDate = signal(new Date());
  protected readonly filterStatus = signal('');
  protected readonly filterEventType = signal('');

  protected readonly isFormOpen = signal(false);
  protected readonly editingEvent = signal<CalendarEventResponse | null>(null);
  protected readonly selectedDate = signal<Date | null>(null);

  protected readonly isDetailOpen = signal(false);
  protected readonly selectedEvent = signal<CalendarEventResponse | null>(null);

  protected readonly eventTypeLabels = EVENT_TYPE_LABELS;
  protected readonly statusLabels = STATUS_LABELS;

  ngOnInit(): void {
    this.loadEvents();
  }

  protected loadEvents(): void {
    this.isLoading.set(true);
    const range = this.getDateRange();

    this.eventService.list({
      from: range.from,
      to: range.to,
      status: this.filterStatus() || undefined,
      page: 0,
      size: 500,
    }).subscribe({
      next: (result) => {
        let filtered = result.content;
        const typeFilter = this.filterEventType();
        if (typeFilter) {
          filtered = filtered.filter((e: CalendarEventResponse) => e.eventType === typeFilter);
        }
        this.events.set(filtered);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.sweetAlert.error('No se pudieron cargar los eventos.');
      },
    });
  }

  private getDateRange(): { from: string; to: string } {
    const d = this.currentDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0, 23, 59, 59);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  protected onDateChange(date: Date): void {
    this.currentDate.set(date);
    this.loadEvents();
  }

  protected onDateClick(date: Date): void {
    this.selectedDate.set(date);
    this.editingEvent.set(null);
    this.isFormOpen.set(true);
  }

  protected onEventClick(event: CalendarEventResponse): void {
    this.selectedEvent.set(event);
    this.isDetailOpen.set(true);
  }

  protected openCreateForm(): void {
    this.selectedDate.set(new Date());
    this.editingEvent.set(null);
    this.isFormOpen.set(true);
  }

  protected openEditForm(event: CalendarEventResponse): void {
    this.isDetailOpen.set(false);
    this.editingEvent.set(event);
    this.selectedDate.set(null);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingEvent.set(null);
    this.selectedDate.set(null);
  }

  protected onSaved(): void {
    this.closeForm();
    this.loadEvents();
  }

  protected closeDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedEvent.set(null);
  }

  protected onEventDeleted(): void {
    this.closeDetail();
    this.loadEvents();
  }

  protected onStatusChanged(updated: CalendarEventResponse): void {
    this.selectedEvent.set(updated);
    this.loadEvents();
  }

  protected clearFilters(): void {
    this.filterStatus.set('');
    this.filterEventType.set('');
    this.loadEvents();
  }
}
