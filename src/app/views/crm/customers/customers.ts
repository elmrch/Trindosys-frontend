import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { CustomerForm } from './components/customer-form/customer-form';
import { CustomerList, CustomerSortColumn } from './components/customer-list/customer-list';
import { Customer } from './models/customer.model';
import { CustomerService } from './services/customer.service';
import { AdvisorService } from '../../../shared/services/advisor.service';
import { Advisor } from '../../../shared/models/advisor.model';


@Component({
  selector: 'app-customers',
  imports: [CustomerList, CustomerForm],
  templateUrl: './customers.html',
})
export class Customers implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly advisorService = inject(AdvisorService);

  protected readonly advisors = signal<Advisor[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly page = signal(0);
  protected readonly pageSize = 10;
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);

  protected readonly sortColumn = signal<CustomerSortColumn>('createdAt');
  protected readonly sortDirection = signal<'asc' | 'desc'>('desc');

  protected readonly isFormOpen = signal(false);
  protected readonly editingCustomer = signal<Customer | null>(null);

  protected readonly String = String;
  protected readonly openDropdown = signal<string | null>(null);

  protected readonly filterAdvisorId = signal<string>('');
  protected readonly filterCreatePreset = signal<string>('');
  protected readonly filterCreatedFrom = signal<string>('');
  protected readonly filterCreatedTo = signal<string>('');
  protected readonly filterActivityPreset = signal<string>('');
  protected readonly filterStatus = signal<string>('');
  protected readonly filterTag = signal<string>('');

  protected readonly availableTags = computed(() => {
    const set = new Set<string>();
    for (const c of this.customers()) {
      if (c.tags) {
        c.tags.forEach((t) => set.add(t));
      }
    }
    return Array.from(set);
  });

  protected readonly advisorFilterLabel = computed(() => {
    const val = this.filterAdvisorId();
    if (!val) return 'Propietario';
    if (val === 'unassigned') return 'Asesor: Sin asignar';
    const adv = this.advisors().find((a) => String(a.id) === val);
    return adv ? `Asesor: ${adv.fullName}` : 'Propietario';
  });

  protected readonly createDateFilterLabel = computed(() => {
    const p = this.filterCreatePreset();
    if (!p) return 'Fecha de creación';
    if (p === 'today') return 'Creación: Hoy';
    if (p === 'last7days') return 'Creación: Últimos 7d';
    if (p === 'thisMonth') return 'Creación: Este mes';
    if (p === 'custom') return 'Creación: Rango';
    return 'Fecha de creación';
  });

  protected readonly activityDateFilterLabel = computed(() => {
    const p = this.filterActivityPreset();
    if (!p) return 'Última actividad';
    if (p === 'today') return 'Actividad: Hoy';
    if (p === 'last7days') return 'Actividad: Últimos 7d';
    if (p === 'thisMonth') return 'Actividad: Este mes';
    if (p === 'never') return 'Sin actividad';
    return 'Última actividad';
  });

  protected readonly statusFilterLabel = computed(() => {
    const s = this.filterStatus();
    if (!s) return 'Estado';
    switch (s) {
      case 'LEAD': return 'Estado: Lead';
      case 'PROSPECT': return 'Estado: Prospecto';
      case 'CUSTOMER': return 'Estado: Cliente';
      case 'INACTIVE': return 'Estado: Inactivo';
      default: return `Estado: ${s}`;
    }
  });

  protected readonly tagFilterLabel = computed(() => {
    const t = this.filterTag();
    return t ? `Etiqueta: ${t}` : '+ Más';
  });

  protected readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.filterAdvisorId()) count++;
    if (this.filterCreatePreset()) count++;
    if (this.filterActivityPreset()) count++;
    if (this.filterStatus()) count++;
    if (this.filterTag()) count++;
    return count;
  });

  protected readonly filteredCustomers = computed(() => {
    let list = this.customers();
    const term = this.searchTerm().trim().toLowerCase();

    if (term) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term) ||
        (c.phone ?? '').toLowerCase().includes(term) ||
        (c.company ?? '').toLowerCase().includes(term) ||
        (c.notes ?? '').toLowerCase().includes(term) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(term)),
      );
    }

    const advisorVal = this.filterAdvisorId();
    if (advisorVal === 'unassigned') {
      list = list.filter((c) => c.advisorId === null || c.advisorId === undefined);
    } else if (advisorVal) {
      const advId = Number(advisorVal);
      list = list.filter((c) => c.advisorId === advId);
    }

    const statusVal = this.filterStatus();
    if (statusVal) {
      list = list.filter((c) => (c.status ?? '').toUpperCase() === statusVal.toUpperCase());
    }

    const tagVal = this.filterTag();
    if (tagVal) {
      list = list.filter((c) => c.tags && c.tags.includes(tagVal));
    }

    const createPreset = this.filterCreatePreset();
    if (createPreset) {
      const now = new Date();
      const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      list = list.filter((c) => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt).getTime();

        if (createPreset === 'today') {
          return d >= todayStr;
        }
        if (createPreset === 'last7days') {
          return d >= todayStr - 7 * 86_400_000;
        }
        if (createPreset === 'thisMonth') {
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          return d >= firstDayOfMonth;
        }
        if (createPreset === 'custom') {
          const from = this.filterCreatedFrom() ? new Date(`${this.filterCreatedFrom()}T00:00:00`).getTime() : null;
          const to = this.filterCreatedTo() ? new Date(`${this.filterCreatedTo()}T23:59:59`).getTime() : null;
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        }
        return true;
      });
    }

    const activityPreset = this.filterActivityPreset();
    if (activityPreset) {
      const now = new Date();
      const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      list = list.filter((c) => {
        if (activityPreset === 'never') {
          return !c.lastInteractionAt;
        }
        if (!c.lastInteractionAt) return false;
        const d = new Date(c.lastInteractionAt).getTime();

        if (activityPreset === 'today') {
          return d >= todayStr;
        }
        if (activityPreset === 'last7days') {
          return d >= todayStr - 7 * 86_400_000;
        }
        if (activityPreset === 'thisMonth') {
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          return d >= firstDayOfMonth;
        }
        return true;
      });
    }

    return list;
  });

  protected toggleDropdown(name: string): void {
    this.openDropdown.update((current) => (current === name ? null : name));
  }

  protected closeDropdown(): void {
    this.openDropdown.set(null);
  }

  protected setAdvisorFilter(val: string): void {
    this.filterAdvisorId.set(val);
  }

  protected setCreatePreset(val: string): void {
    this.filterCreatePreset.set(val);
    if (val !== 'custom') {
      this.filterCreatedFrom.set('');
      this.filterCreatedTo.set('');
    }
  }

  protected setActivityPreset(val: string): void {
    this.filterActivityPreset.set(val);
  }

  protected setStatusFilter(val: string): void {
    this.filterStatus.set(val);
  }

  protected setTagFilter(val: string): void {
    this.filterTag.set(val);
  }

  protected clearAllFilters(): void {
    this.filterAdvisorId.set('');
    this.filterCreatePreset.set('');
    this.filterCreatedFrom.set('');
    this.filterCreatedTo.set('');
    this.filterActivityPreset.set('');
    this.filterStatus.set('');
    this.filterTag.set('');
    this.searchTerm.set('');
    this.openDropdown.set(null);
  }

  protected getAdvisorName(customer: Customer): string {
    if (customer.advisorName) return customer.advisorName;
    if (customer.advisorId) {
      const adv = this.advisors().find((a) => a.id === customer.advisorId);
      return adv ? adv.fullName : `Asesor #${customer.advisorId}`;
    }
    return 'Sin asignar';
  }

  protected exportToCsv(): void {
    const list = this.filteredCustomers();
    if (!list.length) {
      this.sweetAlert.toast('No hay contactos para exportar.', 'info');
      return;
    }

    const headers = ['Nombre', 'Email', 'Teléfono', 'Empresa', 'Asesor', 'Estado', 'Fecha Creación', 'Última Actividad', 'Etiquetas'];
    const rows = list.map((c) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${(this.getAdvisorName(c)).replace(/"/g, '""')}"`,
      `"${(c.status || '').replace(/"/g, '""')}"`,
      `"${c.createdAt || ''}"`,
      `"${c.lastInteractionAt || ''}"`,
      `"${(c.tags || []).join(', ').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contactos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.sweetAlert.toast('Contactos exportados correctamente.');
  }

  ngOnInit(): void {
    this.load();
    this.loadAdvisors();
  }

  protected loadAdvisors(): void {
    this.advisorService.list().subscribe({
      next: (advisors) => {
        this.advisors.set(advisors);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los asesores.');
      },
    });
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const sort = `${this.sortColumn()},${this.sortDirection()}`;

    this.customerService.list(this.page(), this.pageSize, sort).subscribe({
      next: (result) => {
        this.customers.set(result.content);
        this.totalPages.set(result.totalPages);
        this.totalElements.set(result.totalElements);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar los Contactos.');
      },
    });
  }

  protected onSort(column: CustomerSortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.page.set(0);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  protected openCreateForm(): void {
    this.editingCustomer.set(null);
    this.isFormOpen.set(true);
  }

  protected openEditForm(customer: Customer): void {
    this.editingCustomer.set(customer);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingCustomer.set(null);
  }

  protected onSaved(): void {
    this.closeForm();
    this.load();
  }

  protected onDeactivate(customer: Customer): void {
    this.sweetAlert
      .confirm(`¿Desactivar al cliente "${customer.name}"?`, 'Esta acción no se puede deshacer.', 'Sí, desactivar')
      .then((result) => {
        if (!result.isConfirmed) {
          return;
        }
        this.customerService.deactivate(customer.id).subscribe({
          next: () => {
            this.sweetAlert.toast('Cliente desactivado.');
            this.load();
          },
          error: () => this.sweetAlert.error('No se pudo desactivar el cliente.'),
        });
      });
  }
}
