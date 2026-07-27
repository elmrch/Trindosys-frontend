import { Component } from '@angular/core';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexTooltip,
  ApexPlotOptions,
  ApexDataLabels,
  ApexFill,
} from 'ng-apexcharts';

@Component({
  selector: 'app-monthly-sales-chart',
  imports: [NgApexchartsModule],
  template: `
    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Ventas Mensuales</h3>
      </div>
      <div class="mt-4 -ml-3">
        <apx-chart
          [series]="series"
          [chart]="chart"
          [xaxis]="xaxis"
          [yaxis]="yaxis"
          [grid]="grid"
          [tooltip]="tooltip"
          [plotOptions]="plotOptions"
          [dataLabels]="dataLabels"
          [fill]="fill"
          [colors]="colors"
        ></apx-chart>
      </div>
    </div>
  `,
})
export class MonthlySalesChart {
  protected readonly colors = ['#465fff'];

  protected readonly series: ApexAxisChartSeries = [
    { name: 'Ventas', data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112] },
  ];

  protected readonly chart: ApexChart = {
    type: 'bar',
    height: 180,
    toolbar: { show: false },
    fontFamily: 'inherit',
  };

  protected readonly plotOptions: ApexPlotOptions = {
    bar: { columnWidth: '39%', borderRadius: 5, borderRadiusApplication: 'end' },
  };

  protected readonly dataLabels: ApexDataLabels = { enabled: false };

  protected readonly fill: ApexFill = { opacity: 1 };

  protected readonly xaxis: ApexXAxis = {
    categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    axisBorder: { show: false },
    axisTicks: { show: false },
  };

  protected readonly yaxis: ApexYAxis = {};

  protected readonly grid: ApexGrid = {
    yaxis: { lines: { show: true } },
  };

  protected readonly tooltip: ApexTooltip = {
    y: { formatter: (val: number) => `${val}` },
  };
}
