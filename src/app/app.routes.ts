import { Routes } from '@angular/router';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { dashboardRoutes } from './views/dashboard/dashboard.routes';
import { loginRoutes } from './views/login/login.routes';

export const routes: Routes = [
  ...loginRoutes,
  {
    path: '',
    component: AppLayout,
    children: [{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }, ...dashboardRoutes],
  },
  { path: '**', redirectTo: 'dashboard' },
];
