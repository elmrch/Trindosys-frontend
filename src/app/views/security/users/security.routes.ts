import { Routes } from '@angular/router';
import { adminGuard } from '../../../core/auth/admin.guard';
import { MenuItemManager } from './components/menu-item-manager/menu-item-manager';
import { RoleMenuAssignment } from './components/role-menu-assignment/role-menu-assignment';
import { Users } from './users';

export const securityRoutes: Routes = [
  { path: 'security/users', component: Users, canActivate: [adminGuard] },
  { path: 'security/role-menus', component: RoleMenuAssignment, canActivate: [adminGuard] },
  { path: 'security/menu-items', component: MenuItemManager, canActivate: [adminGuard] },
];
