import { Routes } from '@angular/router';
import { CustomerDetail } from './components/customer-detail/customer-detail';
import { Customers } from './customers';

export const customersRoutes: Routes = [
  { path: 'crm/customers', component: Customers },
  { path: 'crm/customers/:id', component: CustomerDetail },
];
