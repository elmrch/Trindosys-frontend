import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Advisor } from '../../../../../shared/models/advisor.model';
import { AdvisorService } from '../../../../../shared/services/advisor.service';
import { CalendarEventRequest, CalendarEventResponse, CalendarEventType, EVENT_TYPE_LABELS, REMINDER_OPTIONS } from '../../models/calendar-event.model';
import { CalendarEventService } from '../../services/calendar-event.service';

@Component({
  selector: 'app-calendar-event-form',
  imports: [ReactiveFormsModule],
  templateUrl: './calendar-event-form.html',
})
export class CalendarEventForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(CalendarEventService);
  private readonly advisorService = inject(AdvisorService);

  readonly event = input<CalendarEventResponse | null>(null);
  readonly selectedDate = input<Date | null>(null);
  readonly saved = output<void>();
  readonly cancel = output<void>();

  protected readonly users = signal<Advisor[]>([]);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.event() !== null);

  protected readonly eventTypes: CalendarEventType[] = ['LLAMADA', 'REUNION', 'VISITA', 'RECORDATORIO', 'OTRO'];
  protected readonly eventTypeLabels = EVENT_TYPE_LABELS;
  protected readonly reminderOptions = REMINDER_OPTIONS;

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    startDatetime: ['', Validators.required],
    endDatetime: [''],
    allDay: [false],
    eventType: ['REUNION' as CalendarEventType, Validators.required],
    assignedUserId: [null as number | null, Validators.required],
    location: [''],
    reminderMinutesBefore: [null as number | null],
  });

  constructor() {
    effect(() => {
      const existing = this.event();
      if (existing) {
        this.form.patchValue({
          title: existing.title,
          description: existing.description ?? '',
          startDatetime: this.toLocalDatetime(existing.startDatetime),
          endDatetime: existing.endDatetime ? this.toLocalDatetime(existing.endDatetime) : '',
          allDay: existing.allDay,
          eventType: existing.eventType,
          assignedUserId: existing.assignedUserId,
          location: existing.location ?? '',
          reminderMinutesBefore: existing.reminderMinutesBefore,
        });
      } else {
        const d = this.selectedDate() ?? new Date();
        const start = new Date(d);
        start.setHours(9, 0, 0, 0);
        const end = new Date(d);
        end.setHours(10, 0, 0, 0);
        this.form.reset({
          title: '',
          description: '',
          startDatetime: this.toLocalDatetime(start.toISOString()),
          endDatetime: this.toLocalDatetime(end.toISOString()),
          allDay: false,
          eventType: 'REUNION',
          assignedUserId: null,
          location: '',
          reminderMinutesBefore: null,
        });
      }
    });
  }

  ngOnInit(): void {
    this.advisorService.list().subscribe({
      next: (users) => this.users.set(users),
      error: () => {},
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: CalendarEventRequest = {
      title: raw.title,
      description: raw.description || undefined,
      startDatetime: new Date(raw.startDatetime).toISOString(),
      endDatetime: raw.endDatetime ? new Date(raw.endDatetime).toISOString() : undefined,
      allDay: raw.allDay || undefined,
      eventType: raw.eventType,
      assignedUserId: raw.assignedUserId!,
      location: raw.location || undefined,
      reminderMinutesBefore: raw.reminderMinutesBefore ?? undefined,
    };

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const existing = this.event();
    const request$ = existing
      ? this.eventService.update(existing.id, request)
      : this.eventService.create(request);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          error.status === 400 ? 'Revisa los datos ingresados.' : 'No se pudo guardar el evento.',
        );
      },
    });
  }

  private toLocalDatetime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
