import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Company } from '../../../companies/models/company.model';
import { Customer, CustomerRequest } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { Advisor } from '../../../../../shared/models/advisor.model';

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule],
  templateUrl: './customer-form.html',
})
export class CustomerForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);

  readonly customer = input<Customer | null>(null);

  readonly saved = output<void>();
  readonly cancel = output<void>();
  readonly advisors = input<Advisor[]>([]);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.customer() !== null);

  protected readonly companies = signal<Company[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: [''],
    phone: [''],
    companyId: [null as number | null],
    sourceCampaign: [''],
    advisorId: [null as number | null],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const existing = this.customer();
      if (existing) {
        this.form.patchValue({
          name: existing.name,
          email: existing.email ?? '',
          phone: existing.phone ?? '',
          companyId: existing.companyId,
          sourceCampaign: existing.sourceCampaign ?? '',
          advisorId: existing.advisorId,
          notes: existing.notes ?? '',
        });
      } else {
        this.form.reset({
          name: '',
          email: '',
          phone: '',
          companyId: null,
          sourceCampaign: '',
          advisorId: null,
          notes: '',
        });
      }
    });
  }

  ngOnInit(): void {
    this.customerService.listCompanies().subscribe({
      next: (result) => this.companies.set(result.content),
      error: () => {},
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: CustomerRequest = {
      name: raw.name,
      email: raw.email || null,
      phone: raw.phone || null,
      companyId: raw.companyId,
      sourceCampaign: raw.sourceCampaign || null,
      notes: raw.notes || null,
      advisorId: raw.advisorId,
    };

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const existing = this.customer();
    const request$ = existing
      ? this.customerService.update(existing.id, request)
      : this.customerService.create(request);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          error.status === 400 ? 'Revisa los datos ingresados.' : 'No se pudo guardar el cliente.',
        );
      },
    });
  }
}
