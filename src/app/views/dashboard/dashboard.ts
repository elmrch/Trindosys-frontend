import { Component } from '@angular/core';
import { EcommerceMetrics } from './components/ecommerce-metrics/ecommerce-metrics';
import { MonthlySalesChart } from './components/monthly-sales-chart/monthly-sales-chart';
import { MonthlyTarget } from './components/monthly-target/monthly-target';
import { StatisticsChart } from './components/statistics-chart/statistics-chart';
import { DemographicCard } from './components/demographic-card/demographic-card';
import { RecentOrders } from './components/recent-orders/recent-orders';

@Component({
  selector: 'app-dashboard',
  imports: [
    EcommerceMetrics,
    MonthlySalesChart,
    MonthlyTarget,
    StatisticsChart,
    DemographicCard,
    RecentOrders,
  ],
  template: `
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 space-y-6 xl:col-span-7">
        <app-ecommerce-metrics />
        <app-monthly-sales-chart />
      </div>

      <div class="col-span-12 xl:col-span-5">
        <app-monthly-target />
      </div>

      <div class="col-span-12">
        <app-statistics-chart />
      </div>

      <div class="col-span-12 xl:col-span-5">
        <app-demographic-card />
      </div>

      <div class="col-span-12 xl:col-span-7">
        <app-recent-orders />
      </div>
    </div>
  `,
})
export class Dashboard {}
