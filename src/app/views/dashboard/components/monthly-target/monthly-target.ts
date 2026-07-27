import { Component } from '@angular/core';
import {
  NgApexchartsModule,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexFill,
  ApexStroke,
} from 'ng-apexcharts';

@Component({
  selector: 'app-monthly-target',
  imports: [NgApexchartsModule],
  template: `
    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Meta Mensual</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Meta establecida para cada mes</p>
      </div>

      <div class="flex justify-center py-2">
        <apx-chart
          [series]="series"
          [chart]="chart"
          [plotOptions]="plotOptions"
          [fill]="fill"
          [stroke]="stroke"
          [labels]="labels"
        ></apx-chart>
      </div>

      <p class="mx-auto -mt-2 max-w-xs text-center text-sm text-gray-500 dark:text-gray-400">
        Ganaste $3,287 hoy, más que el mes pasado. ¡Sigue con tu buen trabajo!
      </p>

      <div class="mt-5 flex items-center justify-center gap-6 border-t border-gray-100 pt-5 dark:border-gray-800">
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">Meta</p>
          <p class="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-gray-800 dark:text-white">
            $20K
          </p>
        </div>
        <div class="h-8 w-px bg-gray-200 dark:bg-gray-800"></div>
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">Ingresos</p>
          <p class="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-gray-800 dark:text-white">
            $20K
          </p>
        </div>
        <div class="h-8 w-px bg-gray-200 dark:bg-gray-800"></div>
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">Hoy</p>
          <p class="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-gray-800 dark:text-white">
            $1.5K
          </p>
        </div>
      </div>
    </div>
  `,
})
export class MonthlyTarget {
  protected readonly series: ApexNonAxisChartSeries = [75.55];

  protected readonly chart: ApexChart = {
    type: 'radialBar',
    height: 260,
    fontFamily: 'inherit',
  };

  protected readonly plotOptions: ApexPlotOptions = {
    radialBar: {
      startAngle: -85,
      endAngle: 85,
      hollow: { size: '75%' },
      track: { background: '#e4e7ec', strokeWidth: '100%', margin: 5 },
      dataLabels: {
        name: { show: false },
        value: {
          fontSize: '32px',
          fontWeight: '700',
          offsetY: -20,
          color: '#1d2939',
          formatter: (val: number) => `${val}%`,
        },
      },
    },
  };

  protected readonly fill: ApexFill = { type: 'solid', colors: ['#465fff'] };
  protected readonly stroke: ApexStroke = { lineCap: 'round' };
  protected readonly labels = ['Progreso'];
}
