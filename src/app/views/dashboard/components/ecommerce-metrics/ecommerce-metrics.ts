import { Component } from '@angular/core';

@Component({
  selector: 'app-ecommerce-metrics',
  template: `
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      @for (metric of metrics; track metric.label) {
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <span class="text-xl" [innerHTML]="metric.icon"></span>
          </div>
          <div class="mt-5 flex items-end justify-between">
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ metric.label }}</span>
              <h4 class="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{{ metric.value }}</h4>
            </div>
            <span
              class="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium"
              [class]="metric.trend >= 0
                ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'"
            >
              @if (metric.trend >= 0) {
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 19V5m0 0-6 6m6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              } @else {
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5v14m0 0 6-6m-6 6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }
              {{ metric.trend >= 0 ? '+' : '' }}{{ metric.trend }}%
            </span>
          </div>
        </div>
      }
    </div>
  `,
})
export class EcommerceMetrics {
  protected readonly metrics = [
    { label: 'Clientes', value: '3,782', trend: 11.01, icon: '👥' },
    { label: 'Pedidos', value: '5,359', trend: -9.05, icon: '📦' },
  ];
}
