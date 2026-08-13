import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { User } from '../../models/user.model';

export type UserSortColumn = 'fullName' | 'email' | 'role' | 'createdAt';

@Component({
  selector: 'app-user-list',
  imports: [DatePipe],
  templateUrl: './user-list.html',
})
export class UserList {
  readonly users = input.required<User[]>();

  readonly edit = output<User>();
  readonly toggleActive = output<User>();

  protected roleClass(user: User): string {
    return user.role === 'ADMIN'
      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
      : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300';
  }

  protected statusClass(user: User): string {
    return user.active
      ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
      : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400';
  }
}
