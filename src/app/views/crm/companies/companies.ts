import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { ImportModal } from '../../../shared/components/import-modal/import-modal';
import { ImportResult } from '../../../shared/models/import.model';
import { CompanyForm } from './components/company-form/company-form';
import { CompanyList } from './components/company-list/company-list';
import { Company } from './models/company.model';
import { CompanyService } from './services/company.service';

@Component({
  selector: 'app-companies',
  imports: [CompanyList, CompanyForm, ImportModal],
  templateUrl: './companies.html',
})
export class Companies implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly authService = inject(AuthService);

  protected readonly companies = signal<Company[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly isLoading = signal(false);

  protected readonly isFormOpen = signal(false);
  protected readonly editingCompany = signal<Company | null>(null);

  protected readonly isImportOpen = signal(false);

  protected readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');

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

  protected openImport(): void {
    this.isImportOpen.set(true);
  }

  protected closeImport(): void {
    this.isImportOpen.set(false);
  }

  protected onDownloadCompanyTemplate(): void {
    this.companyService.downloadTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla-empresas.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.sweetAlert.error('No se pudo descargar la plantilla.'),
    });
  }

  protected onImportFile(file: File): void {
    this.companyService.importFromExcel(file).subscribe({
      next: (result) => {
        this.importModalRef()?.handleSuccess(result);
        if (result.errorCount === 0) {
          this.sweetAlert.toast(`${result.successCount} empresas importadas correctamente.`);
          this.load();
        }
      },
      error: () => {
        this.importModalRef()?.handleError('No se pudo importar el archivo. Verifica que sea un .xlsx válido.');
      },
    });
  }

  protected importModalRef = signal<ImportModal | null>(null);

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
