import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InitialsAvatar } from '../../../../../shared/components/initials-avatar/initials-avatar';
import { Advisor } from '../../../../../shared/models/advisor.model';
import { Customer } from '../../models/customer.model';

export type CustomerSortColumn = 'name' | 'companyName' | 'status' | 'createdAt';

@Component({
  selector: 'app-customer-list',
  imports: [DatePipe, RouterLink, InitialsAvatar],
  templateUrl: './customer-list.html',
})
export class CustomerList {
  readonly customers = input.required<Customer[]>();
  readonly advisors = input<Advisor[]>([]);
  readonly sortColumn = input<CustomerSortColumn | null>(null);
  readonly sortDirection = input<'asc' | 'desc'>('asc');

  readonly edit = output<Customer>();
  readonly deactivate = output<Customer>();
  readonly sort = output<CustomerSortColumn>();

  protected sortIcon(column: CustomerSortColumn): string {
    if (this.sortColumn() !== column) {
      return '↕';
    }
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  protected isActive(customer: Customer): boolean {
    const normalized = customer.status?.toUpperCase() ?? '';
    return normalized.includes('ACTIVE') && !normalized.includes('INACTIVE');
  }

  protected statusClass(customer: Customer): string {
    return this.isActive(customer)
      ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
      : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400';
  }

  protected getAdvisorName(customer: Customer): string {
    if (customer.advisorName) {
      return customer.advisorName;
    }
    if (customer.advisorId) {
      const advisor = this.advisors().find((a) => a.id === customer.advisorId);
      return advisor ? advisor.fullName : `Asesor #${customer.advisorId}`;
    }
    return 'Sin asignar';
  }
}
