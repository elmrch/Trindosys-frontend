import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Company } from '../../models/company.model';

@Component({
  selector: 'app-company-list',
  imports: [DatePipe],
  templateUrl: './company-list.html',
})
export class CompanyList {
  readonly companies = input.required<Company[]>();

  readonly edit = output<Company>();
  readonly toggleActive = output<Company>();
  readonly delete = output<Company>();

  protected statusClass(company: Company): string {
    return company.active
      ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
      : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400';
  }
}
