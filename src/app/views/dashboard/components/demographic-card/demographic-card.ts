import { Component } from '@angular/core';

interface CountryStat {
  flag: string;
  country: string;
  customers: string;
  percent: number;
}

@Component({
  selector: 'app-demographic-card',
  template: `
    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Contactos por país</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Número de Contactos según ubicación</p>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
          aria-label="Más opciones"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div
        class="mt-5 flex h-[160px] items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5"
      >
        <svg class="h-16 w-16 text-gray-300 dark:text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4" />
          <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </div>

      <div class="mt-6 flex flex-col gap-5">
        @for (item of countries; track item.country) {
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl leading-none">{{ item.flag }}</span>
              <div>
                <p class="text-sm font-semibold text-gray-800 dark:text-white">{{ item.country }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.customers }} Contactos</p>
              </div>
            </div>
            <div class="flex w-[100px] items-center gap-2">
              <div class="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div class="h-1.5 rounded-full bg-brand-500" [style.width.%]="item.percent"></div>
              </div>
              <span class="w-9 shrink-0 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{{ item.percent }}%</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DemographicCard {
  protected readonly countries: CountryStat[] = [
    { flag: '🇺🇸', country: 'Estados Unidos', customers: '2,379', percent: 79 },
    { flag: '🇫🇷', country: 'Francia', customers: '589', percent: 23 },
    { flag: '🇲🇽', country: 'México', customers: '412', percent: 18 },
  ];
}
