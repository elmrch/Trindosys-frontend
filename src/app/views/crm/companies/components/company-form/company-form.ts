import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Company, CompanyRequest } from '../../models/company.model';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-company-form',
  imports: [ReactiveFormsModule],
  templateUrl: './company-form.html',
})
export class CompanyForm {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);

  readonly company = input<Company | null>(null);

  readonly saved = output<void>();
  readonly cancel = output<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.company() !== null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    taxId: [''],
    email: [''],
    phone: [''],
    address: [''],
    website: [''],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const existing = this.company();
      if (existing) {
        this.form.patchValue({
          name: existing.name,
          taxId: existing.taxId ?? '',
          email: existing.email ?? '',
          phone: existing.phone ?? '',
          address: existing.address ?? '',
          website: existing.website ?? '',
          notes: existing.notes ?? '',
        });
      } else {
        this.form.reset({
          name: '',
          taxId: '',
          email: '',
          phone: '',
          address: '',
          website: '',
          notes: '',
        });
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: CompanyRequest = {
      name: raw.name,
      taxId: raw.taxId || null,
      email: raw.email || null,
      phone: raw.phone || null,
      address: raw.address || null,
      website: raw.website || null,
      notes: raw.notes || null,
    };

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const existing = this.company();
    const request$ = existing
      ? this.companyService.update(existing.id, request)
      : this.companyService.create(request);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          error.status === 400 ? 'Revisa los datos ingresados.' : 'No se pudo guardar la empresa.',
        );
      },
    });
  }
}
