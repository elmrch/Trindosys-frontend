import { Routes } from '@angular/router';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { dashboardRoutes } from './views/dashboard/dashboard.routes';
import { loginRoutes } from './views/login/login.routes';
import { channelsRoutes } from './views/crm/channels/channels.routes';
import { conversationsRoutes } from './views/crm/conversations/conversations.routes';
import { customersRoutes } from './views/crm/customers/customers.routes';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  ...loginRoutes,
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      ...dashboardRoutes,
      ...channelsRoutes,
      ...conversationsRoutes,
      ...customersRoutes,
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
