import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Advisor } from '../../../../../shared/models/advisor.model';
import { Customer } from '../../../customers/models/customer.model';
import { Opportunity, OpportunityRequest } from '../../models/opportunity.model';
import { OpportunityService } from '../../services/opportunity.service';

@Component({
  selector: 'app-opportunity-detail',
  imports: [ReactiveFormsModule],
  templateUrl: './opportunity-detail.html',
})
export class OpportunityDetail {
  private readonly fb = inject(FormBuilder);
  private readonly opportunityService = inject(OpportunityService);

  readonly opportunity = input<Opportunity | null>(null);
  readonly customers = input<Customer[]>([]);
  readonly advisors = input<Advisor[]>([]);

  readonly saved = output<void>();
  readonly cancel = output<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.opportunity() !== null);

  protected readonly form = this.fb.nonNullable.group({
    customerId: [0, [Validators.required, Validators.min(1)]],
    advisorId: [''],
    estimatedValue: [''],
    description: [''],
  });

  constructor() {
    effect(() => {
      const existing = this.opportunity();
      if (existing) {
        this.form.patchValue({
          customerId: existing.customer.id,
          advisorId: existing.advisorId != null ? String(existing.advisorId) : '',
          estimatedValue: existing.estimatedValue != null ? String(existing.estimatedValue) : '',
          description: existing.description ?? '',
        });
      } else {
        this.form.reset({ customerId: 0, advisorId: '', estimatedValue: '', description: '' });
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: OpportunityRequest = {
      customerId: raw.customerId,
      advisorId: raw.advisorId ? Number(raw.advisorId) : null,
      estimatedValue: raw.estimatedValue ? Number(raw.estimatedValue) : null,
      description: raw.description || null,
    };

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const existing = this.opportunity();
    const request$ = existing
      ? this.opportunityService.update(existing.id, request)
      : this.opportunityService.create(request);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          error.status === 400
            ? 'Ya hay una oportunidad abierta para ese cliente, o revisa los datos.'
            : 'No se pudo guardar la oportunidad.',
        );
      },
    });
  }
}
