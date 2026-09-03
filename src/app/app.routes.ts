import { Routes } from '@angular/router';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { dashboardRoutes } from './views/dashboard/dashboard.routes';
import { loginRoutes } from './views/login/login.routes';
import { calendarRoutes } from './views/crm/calendar/calendar.routes';
import { channelsRoutes } from './views/crm/channels/channels.routes';
import { companiesRoutes } from './views/crm/companies/companies.routes';
import { conversationsRoutes } from './views/crm/conversations/conversations.routes';
import { customersRoutes } from './views/crm/customers/customers.routes';
import { opportunitiesRoutes } from './views/crm/opportunities/opportunities.routes';
import { tasksRoutes } from './views/crm/tasks/tasks.routes';
import { templatesRoutes } from './views/crm/templates/templates.routes';
import { securityRoutes } from './views/security/users/security.routes';
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
      ...calendarRoutes,
      ...channelsRoutes,
      ...companiesRoutes,
      ...conversationsRoutes,
      ...customersRoutes,
      ...opportunitiesRoutes,
      ...tasksRoutes,
      ...templatesRoutes,
      ...securityRoutes,
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
