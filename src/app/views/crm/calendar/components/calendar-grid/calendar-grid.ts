import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CalendarEventResponse, EVENT_TYPE_COLORS } from '../../models/calendar-event.model';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEventResponse[];
}

@Component({
  selector: 'app-calendar-grid',
  templateUrl: './calendar-grid.html',
})
export class CalendarGrid {
  readonly events = input<CalendarEventResponse[]>([]);
  readonly initialDate = input<Date>(new Date());

  readonly dateChange = output<Date>();
  readonly eventClick = output<CalendarEventResponse>();
  readonly createEvent = output<Date>();

  protected readonly viewMode = signal<'month' | 'week'>('month');
  protected readonly displayDate = signal<Date>(new Date());
  protected readonly weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  constructor() {
    effect(() => {
      this.displayDate.set(new Date(this.initialDate()));
    });
  }

  protected readonly calendarDays = computed<CalendarDay[]>(() => {
    const current = this.displayDate();
    const events = this.events();

    if (this.viewMode() === 'week') {
      return this.buildWeekDays(current, events);
    }
    return this.buildMonthDays(current, events);
  });

  private buildMonthDays(current: Date, events: CalendarEventResponse[]): CalendarDay[] {
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];
    const start = new Date(firstDay);
    start.setDate(start.getDate() - startOffset);

    for (let i = 0; i < totalCells; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const dayEvents = events.filter((e) => {
        const eventDate = new Date(e.startDatetime);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === d.getTime();
      });

      days.push({
        date: new Date(d),
        dayOfMonth: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: d.getTime() === today.getTime(),
        events: dayEvents,
      });
    }
    return days;
  }

  private buildWeekDays(current: Date, events: CalendarEventResponse[]): CalendarDay[] {
    const startOfWeek = new Date(current);
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const dayEvents = events.filter((e) => {
        const eventDate = new Date(e.startDatetime);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === d.getTime();
      });

      days.push({
        date: new Date(d),
        dayOfMonth: d.getDate(),
        isCurrentMonth: d.getMonth() === current.getMonth(),
        isToday: d.getTime() === today.getTime(),
        events: dayEvents,
      });
    }
    return days;
  }

  protected eventColor(event: CalendarEventResponse): string {
    return EVENT_TYPE_COLORS[event.eventType]?.bg ?? EVENT_TYPE_COLORS.OTRO.bg;
  }

  protected eventTextColor(event: CalendarEventResponse): string {
    return EVENT_TYPE_COLORS[event.eventType]?.text ?? EVENT_TYPE_COLORS.OTRO.text;
  }

  protected onDayClick(day: CalendarDay): void {
    this.dateChange.emit(day.date);
  }

  protected onEventClick(event: CalendarEventResponse, e: Event): void {
    e.stopPropagation();
    this.eventClick.emit(event);
  }

  protected onDayDblClick(day: CalendarDay): void {
    this.createEvent.emit(day.date);
  }

  protected prevMonth(): void {
    const d = new Date(this.displayDate());
    if (this.viewMode() === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    this.displayDate.set(d);
    this.dateChange.emit(d);
  }

  protected nextMonth(): void {
    const d = new Date(this.displayDate());
    if (this.viewMode() === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    this.displayDate.set(d);
    this.dateChange.emit(d);
  }

  protected goToday(): void {
    const d = new Date();
    this.displayDate.set(d);
    this.dateChange.emit(d);
  }

  protected toggleView(): void {
    this.viewMode.update((v) => (v === 'month' ? 'week' : 'month'));
  }

  protected formatEventTime(event: CalendarEventResponse): string {
    if (event.allDay) return 'Todo el día';
    const d = new Date(event.startDatetime);
    return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }

  protected get currentLabel(): string {
    const d = this.displayDate();
    if (this.viewMode() === 'week') {
      const startOfWeek = new Date(d);
      const dayOfWeek = startOfWeek.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      return `${startOfWeek.toLocaleDateString('es-EC', opts)} – ${endOfWeek.toLocaleDateString('es-EC', opts)} ${endOfWeek.getFullYear()}`;
    }
    return d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
  }

}
