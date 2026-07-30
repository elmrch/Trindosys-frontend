import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CustomerForm } from './components/customer-form/customer-form';
import { CustomerList, CustomerSortColumn } from './components/customer-list/customer-list';
import { Customer } from './models/customer.model';
import { CustomerService } from './services/customer.service';

@Component({
  selector: 'app-customers',
  imports: [CustomerList, CustomerForm],
  templateUrl: './customers.html',
})
export class Customers implements OnInit {
  private readonly customerService = inject(CustomerService);

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

  protected readonly filteredCustomers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.customers();
    }
    return this.customers().filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        (customer.email ?? '').toLowerCase().includes(term) ||
        (customer.company ?? '').toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.load();
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
        this.errorMessage.set('No se pudieron cargar los clientes.');
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
    if (!confirm(`¿Desactivar al cliente "${customer.name}"?`)) {
      return;
    }
    this.customerService.deactivate(customer.id).subscribe({
      next: () => this.load(),
      error: () => this.errorMessage.set('No se pudo desactivar el cliente.'),
    });
  }
}
