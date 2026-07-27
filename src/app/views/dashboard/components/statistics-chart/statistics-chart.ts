import { Component } from '@angular/core';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexTooltip,
  ApexStroke,
  ApexFill,
  ApexLegend,
  ApexDataLabels,
  ApexMarkers,
} from 'ng-apexcharts';

@Component({
  selector: 'app-statistics-chart',
  imports: [NgApexchartsModule],
  template: `
    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Estadísticas</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Objetivos que estableciste para cada mes</p>
        </div>
        <div class="flex gap-2 rounded-lg bg-gray-100 p-1 text-sm dark:bg-gray-800">
          @for (r of ranges; track r) {
            <button
              type="button"
              class="rounded-md px-3 py-1.5 font-medium transition-colors"
              [class]="r === activeRange
                ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
              (click)="activeRange = r"
            >
              {{ r }}
            </button>
          }
        </div>
      </div>

      <div class="mt-6 -ml-3">
        <apx-chart
          [series]="series"
          [chart]="chart"
          [xaxis]="xaxis"
          [yaxis]="yaxis"
          [grid]="grid"
          [tooltip]="tooltip"
          [stroke]="stroke"
          [fill]="fill"
          [legend]="legend"
          [dataLabels]="dataLabels"
          [markers]="markers"
          [colors]="colors"
        ></apx-chart>
      </div>
    </div>
  `,
})
export class StatisticsChart {
  protected readonly ranges = ['Mensual', 'Trimestral', 'Anual'];
  protected activeRange = 'Mensual';

  protected readonly colors = ['#465fff', '#9cb9ff'];

  protected readonly series: ApexAxisChartSeries = [
    { name: 'Ventas', data: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235] },
    { name: 'Ingresos', data: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 165] },
  ];

  protected readonly chart: ApexChart = {
    type: 'area',
    height: 310,
    toolbar: { show: false },
    fontFamily: 'inherit',
  };

  protected readonly stroke: ApexStroke = { curve: 'straight', width: 2 };
  protected readonly fill: ApexFill = {
    type: 'gradient',
    gradient: { opacityFrom: 0.55, opacityTo: 0 },
  };
  protected readonly markers: ApexMarkers = { size: 0 };
  protected readonly dataLabels: ApexDataLabels = { enabled: false };
  protected readonly legend: ApexLegend = { position: 'top', horizontalAlign: 'left' };

  protected readonly xaxis: ApexXAxis = {
    categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    axisBorder: { show: false },
    axisTicks: { show: false },
  };

  protected readonly yaxis: ApexYAxis = {};

  protected readonly grid: ApexGrid = {
    yaxis: { lines: { show: true } },
  };

  protected readonly tooltip: ApexTooltip = { x: { format: 'MMM' } };
}
