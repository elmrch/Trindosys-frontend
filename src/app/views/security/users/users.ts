import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { UserForm } from './components/user-form/user-form';
import { UserList } from './components/user-list/user-list';
import { User } from './models/user.model';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-users',
  imports: [UserList, UserForm],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly users = signal<User[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly isLoading = signal(false);

  protected readonly isFormOpen = signal(false);
  protected readonly editingUser = signal<User | null>(null);

  protected readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.users();
    }
    return this.users().filter(
      (user) =>
        (user.fullName ?? '').toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.userService.listAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.sweetAlert.error('No se pudieron cargar los usuarios.');
      },
    });
  }

  protected openCreateForm(): void {
    this.editingUser.set(null);
    this.isFormOpen.set(true);
  }

  protected openEditForm(user: User): void {
    this.editingUser.set(user);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingUser.set(null);
  }

  protected onSaved(): void {
    this.closeForm();
    this.load();
  }

  protected onToggleActive(user: User): void {
    const action = user.active ? 'desactivar' : 'reactivar';
    this.sweetAlert
      .confirm(`¿${user.active ? 'Desactivar' : 'Reactivar'} a "${user.fullName || user.email}"?`, `Vas a ${action} este usuario.`, 'Sí, confirmar')
      .then((result) => {
        if (!result.isConfirmed) {
          return;
        }
        const request$ = user.active ? this.userService.deactivate(user.id) : this.userService.activate(user.id);
        request$.subscribe({
          next: () => {
            this.sweetAlert.toast(`Usuario ${user.active ? 'desactivado' : 'reactivado'}.`);
            this.load();
          },
          error: () => this.sweetAlert.error(`No se pudo ${action} el usuario.`),
        });
      });
  }
}
