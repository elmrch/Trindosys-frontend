import { Component } from '@angular/core';

interface Order {
  name: string;
  variant: string;
  category: string;
  price: string;
  status: 'Entregado' | 'Pendiente' | 'Cancelado';
  color: string;
  initials: string;
}

@Component({
  selector: 'app-recent-orders',
  template: `
    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Pedidos Recientes</h3>
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Ver todos
        </button>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-140 text-left">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800">
              <th class="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Producto</th>
              <th class="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Categoría</th>
              <th class="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Precio</th>
              <th class="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders; track order.name) {
              <tr class="border-b border-gray-50 last:border-0 dark:border-gray-800/60">
                <td class="py-3">
                  <div class="flex items-center gap-3">
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                      [style.background]="order.color"
                    >
                      {{ order.initials }}
                    </span>
                    <div>
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ order.name }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">{{ order.variant }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-3 text-sm text-gray-500 dark:text-gray-400">{{ order.category }}</td>
                <td class="py-3 text-sm text-gray-500 dark:text-gray-400">{{ order.price }}</td>
                <td class="py-3">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    [class]="statusClass(order.status)"
                  >
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class RecentOrders {
  protected readonly orders: Order[] = [
    { name: 'Camisa de algodón', variant: '1 variante · Talla M', category: 'Ropa', price: '$120.00', status: 'Entregado', color: '#465fff', initials: 'CA' },
    { name: 'Auriculares inalámbricos', variant: 'Bluetooth 5.0', category: 'Electrónica', price: '$85.00', status: 'Pendiente', color: '#f79009', initials: 'AI' },
    { name: 'Zapatillas deportivas', variant: '2 variantes · Talla 42', category: 'Calzado', price: '$210.00', status: 'Entregado', color: '#12b76a', initials: 'ZD' },
    { name: 'Mochila de viaje', variant: '20L · Impermeable', category: 'Accesorios', price: '$65.00', status: 'Cancelado', color: '#f04438', initials: 'MV' },
    { name: 'Reloj inteligente', variant: 'GPS · Correa negra', category: 'Electrónica', price: '$340.00', status: 'Entregado', color: '#7592ff', initials: 'RI' },
  ];

  protected statusClass(status: Order['status']): string {
    switch (status) {
      case 'Entregado':
        return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
      case 'Pendiente':
        return 'bg-warning-50 text-warning-500 dark:bg-warning-500/15 dark:text-warning-500';
      case 'Cancelado':
        return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';
    }
  }
}
