import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { CompanyForm } from './components/company-form/company-form';
import { CompanyList } from './components/company-list/company-list';
import { Company } from './models/company.model';
import { CompanyService } from './services/company.service';

@Component({
  selector: 'app-companies',
  imports: [CompanyList, CompanyForm],
  templateUrl: './companies.html',
})
export class Companies implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly companies = signal<Company[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly isLoading = signal(false);

  protected readonly isFormOpen = signal(false);
  protected readonly editingCompany = signal<Company | null>(null);

  protected readonly filteredCompanies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.companies();
    }
    return this.companies().filter(
      (company) =>
        (company.name ?? '').toLowerCase().includes(term) ||
        (company.taxId ?? '').toLowerCase().includes(term) ||
        (company.email ?? '').toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.companyService.list(0, 100).subscribe({
      next: (result) => {
        this.companies.set(result.content);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.sweetAlert.error('No se pudieron cargar las empresas.');
      },
    });
  }

  protected openCreateForm(): void {
    this.editingCompany.set(null);
    this.isFormOpen.set(true);
  }

  protected openEditForm(company: Company): void {
    this.editingCompany.set(company);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingCompany.set(null);
  }

  protected onSaved(): void {
    this.closeForm();
    this.load();
  }

  protected onToggleActive(company: Company): void {
    const action = company.active ? 'desactivar' : 'reactivar';
    this.sweetAlert
      .confirm(`¿${company.active ? 'Desactivar' : 'Reactivar'} "${company.name}"?`, `Vas a ${action} esta empresa.`, 'Sí, confirmar')
      .then((result) => {
        if (!result.isConfirmed) {
          return;
        }
        const request$ = company.active ? this.companyService.deactivate(company.id) : this.companyService.activate(company.id);
        request$.subscribe({
          next: () => {
            this.sweetAlert.toast(`Empresa ${company.active ? 'desactivada' : 'reactivada'}.`);
            this.load();
          },
          error: () => this.sweetAlert.error(`No se pudo ${action} la empresa.`),
        });
      });
  }

  protected onDelete(company: Company): void {
    this.sweetAlert
      .confirm(`¿Eliminar "${company.name}"?`, 'Esta acción no se puede deshacer.', 'Sí, eliminar')
      .then((result) => {
        if (!result.isConfirmed) {
          return;
        }
        this.companyService.delete(company.id).subscribe({
          next: () => {
            this.sweetAlert.toast('Empresa eliminada.');
            this.load();
          },
          error: () => this.sweetAlert.error('No se pudo eliminar la empresa.'),
        });
      });
  }
}
