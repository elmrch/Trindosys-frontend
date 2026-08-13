import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../auth/auth.service';
import { getInitials } from '../../../shared/utils/initials.util';
import { NotificationBell } from '../../../views/crm/activities/components/notification-bell/notification-bell';

@Component({
  selector: 'app-header',
  imports: [NotificationBell],
  template: `
    <header class="sticky top-0 z-30 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div class="flex w-full items-center justify-between px-4 py-3 lg:px-6">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
            (click)="onToggleClick()"
            aria-label="Toggle sidebar"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <div class="relative hidden lg:block">
            <svg
              class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6" />
              <path d="m20 20-3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar o escribe un comando..."
              class="h-10 w-72 rounded-lg border border-gray-200 bg-transparent pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
            (click)="theme.toggle()"
            [attr.aria-label]="theme.isDark() ? 'Activar modo claro' : 'Activar modo oscuro'"
          >
            @if (theme.isDark()) {
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-6.66 1.42-1.42M4.92 19.08l1.42-1.42M19.08 19.08l-1.42-1.42M4.92 4.92 6.34 6.34M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            } @else {
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linejoin="round"
                />
              </svg>
            }
          </button>

          <app-notification-bell />

          <div class="relative">
            <button
              type="button"
              class="flex items-center gap-2 rounded-full pl-1 pr-1 hover:bg-gray-100 dark:hover:bg-white/5 sm:pr-2"
              (click)="isProfileOpen.set(!isProfileOpen())"
            >
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                {{ initials() }}
              </span>
              <span class="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">{{ displayName() }}</span>
              <svg
                class="hidden h-4 w-4 text-gray-400 transition-transform sm:block"
                [class.rotate-180]="isProfileOpen()"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            @if (isProfileOpen()) {
              <div class="fixed inset-0 z-40" (click)="isProfileOpen.set(false)"></div>

              <div
                class="absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div class="border-b border-gray-100 px-2 pb-3 dark:border-gray-800">
                  <p class="text-sm font-semibold text-gray-800 dark:text-white">{{ displayName() }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ currentUser()?.email }}</p>
                </div>

                <ul class="flex flex-col gap-1 py-2">
                  @for (item of menuItems; track item.label) {
                    <li>
                      <a
                        href="#"
                        class="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                        (click)="$event.preventDefault(); isProfileOpen.set(false)"
                      >
                        <span class="flex h-5 w-5 items-center justify-center text-gray-400" [innerHTML]="item.icon"></span>
                        {{ item.label }}
                      </a>
                    </li>
                  }
                </ul>

                <div class="border-t border-gray-100 pt-2 dark:border-gray-800">
                  <a
                    href="#"
                    class="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                    (click)="$event.preventDefault(); onLogout()"
                  >
                    <svg class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Cerrar sesión
                  </a>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class Header {
  protected readonly sidebar = inject(SidebarService);
  protected readonly theme = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly isProfileOpen = signal(false);

  protected readonly currentUser = this.authService.currentUser;

  protected readonly displayName = computed(() => {
    const user = this.currentUser();
    return user?.fullName || user?.email || 'Usuario';
  });

  protected readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return '?';
    }
    return user.fullName ? getInitials(user.fullName) : user.email.slice(0, 2).toUpperCase();
  });

  protected readonly menuItems: { label: string; icon: SafeHtml }[] = [
    {
      label: 'Editar perfil',
      icon: this.trust(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
      ),
    },
    {
      label: 'Configuración de cuenta',
      icon: this.trust(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.6.63 1.04 1.24 1.04H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.04Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
      ),
    },
    {
      label: 'Soporte',
      icon: this.trust(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/></svg>`,
      ),
    },
  ];

  private trust(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onToggleClick(): void {
    if (window.innerWidth < 1024) {
      this.sidebar.toggleMobileSidebar();
    } else {
      this.sidebar.toggleSidebar();
    }
  }

  protected onLogout(): void {
    this.isProfileOpen.set(false);
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
