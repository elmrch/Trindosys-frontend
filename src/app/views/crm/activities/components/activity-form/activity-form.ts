import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { ActivityType } from '../../models/activity.model';
import { ActivityService } from '../../services/activity.service';

const TYPE_TABS: { label: string; value: ActivityType }[] = [
  { label: 'Llamada', value: 'CALL' },
  { label: 'Tarea', value: 'TASK' },
  { label: 'Nota', value: 'NOTE' },
  { label: 'Seguimiento', value: 'FOLLOW_UP' },
];

@Component({
  selector: 'app-activity-form',
  imports: [ReactiveFormsModule],
  templateUrl: './activity-form.html',
})
export class ActivityForm {
  private readonly fb = inject(FormBuilder);
  private readonly activityService = inject(ActivityService);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly customerId = input.required<number>();
  readonly created = output<void>();

  protected readonly typeTabs = TYPE_TABS;
  protected readonly selectedType = signal<ActivityType>('CALL');
  protected readonly isSubmitting = signal(false);

  protected readonly callForm = this.fb.nonNullable.group({
    occurredAt: ['', Validators.required],
    result: ['ANSWERED', Validators.required],
    notes: [''],
  });

  protected readonly taskForm = this.fb.nonNullable.group({
    description: ['', Validators.required],
    dueDate: ['', Validators.required],
    assignedAdvisorId: [''],
  });

  protected readonly noteForm = this.fb.nonNullable.group({
    content: ['', Validators.required],
  });

  protected readonly followUpForm = this.fb.nonNullable.group({
    targetDate: ['', Validators.required],
    reason: ['', Validators.required],
  });

  protected selectType(type: ActivityType): void {
    this.selectedType.set(type);
  }

  protected submit(): void {
    switch (this.selectedType()) {
      case 'CALL':
        this.submitCall();
        break;
      case 'TASK':
        this.submitTask();
        break;
      case 'NOTE':
        this.submitNote();
        break;
      case 'FOLLOW_UP':
        this.submitFollowUp();
        break;
    }
  }

  private submitCall(): void {
    if (this.callForm.invalid) {
      this.callForm.markAllAsTouched();
      return;
    }
    const raw = this.callForm.getRawValue();
    this.isSubmitting.set(true);
    this.activityService
      .createCall(this.customerId(), {
        occurredAt: new Date(raw.occurredAt).toISOString(),
        result: raw.result as 'ANSWERED' | 'NOT_ANSWERED' | 'RESCHEDULED',
        notes: raw.notes || null,
      })
      .subscribe({
        next: () => this.onSuccess(() => this.callForm.reset({ occurredAt: '', result: 'ANSWERED', notes: '' })),
        error: (error: HttpErrorResponse) => this.onError(error),
      });
  }

  private submitTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    const raw = this.taskForm.getRawValue();
    this.isSubmitting.set(true);
    this.activityService
      .createTask(this.customerId(), {
        description: raw.description,
        dueDate: new Date(raw.dueDate).toISOString(),
        assignedAdvisorId: raw.assignedAdvisorId ? Number(raw.assignedAdvisorId) : null,
      })
      .subscribe({
        next: () => this.onSuccess(() => this.taskForm.reset({ description: '', dueDate: '', assignedAdvisorId: '' })),
        error: (error: HttpErrorResponse) => this.onError(error),
      });
  }

  private submitNote(): void {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }
    const raw = this.noteForm.getRawValue();
    this.isSubmitting.set(true);
    this.activityService.createNote(this.customerId(), { content: raw.content }).subscribe({
      next: () => this.onSuccess(() => this.noteForm.reset({ content: '' })),
      error: (error: HttpErrorResponse) => this.onError(error),
    });
  }

  private submitFollowUp(): void {
    if (this.followUpForm.invalid) {
      this.followUpForm.markAllAsTouched();
      return;
    }
    const raw = this.followUpForm.getRawValue();
    this.isSubmitting.set(true);
    this.activityService
      .createFollowUp(this.customerId(), {
        targetDate: new Date(raw.targetDate).toISOString(),
        reason: raw.reason,
      })
      .subscribe({
        next: () => this.onSuccess(() => this.followUpForm.reset({ targetDate: '', reason: '' })),
        error: (error: HttpErrorResponse) => this.onError(error),
      });
  }

  private onSuccess(resetForm: () => void): void {
    this.isSubmitting.set(false);
    resetForm();
    this.created.emit();
    this.sweetAlert.toast('Actividad registrada.');
  }

  private onError(error: HttpErrorResponse): void {
    this.isSubmitting.set(false);
    this.sweetAlert.error(error.status === 400 ? 'Revisa los datos ingresados.' : 'No se pudo registrar la actividad.');
  }
}
