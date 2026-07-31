import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { AgentInboxSocketService } from '../../../views/crm/conversations/services/agent-inbox-socket.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white px-5 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:static"
      [class.w-[290px]]="sidebar.isSidebarVisible"
      [class.w-[90px]]="!sidebar.isSidebarVisible"
      [class.translate-x-0]="sidebar.isSidebarVisible || sidebar.isMobileOpen()"
      [class.-translate-x-full]="!sidebar.isMobileOpen() && !sidebar.isExpanded()"
      (mouseenter)="onEnter()"
      (mouseleave)="onLeave()"
    >
      <div class="flex items-center py-8" [class.justify-center]="!sidebar.isSidebarVisible">
        <a routerLink="/dashboard" class="flex items-center gap-2">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 13h4v7H4v-7Zm6-9h4v16h-4V4Zm6 5h4v11h-4V9Z" fill="currentColor" />
            </svg>
          </span>
          @if (sidebar.isSidebarVisible) {
            <span class="text-lg font-bold text-gray-800 dark:text-white">Trindosys</span>
          }
        </a>
      </div>

      <nav class="custom-scrollbar flex-1 overflow-y-auto pb-6">
        @if (sidebar.isSidebarVisible) {
          <span class="mb-4 block text-xs font-medium uppercase tracking-wide text-gray-400">Menu</span>
        }
        <ul class="flex flex-col gap-1">
          <li>
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              [class.justify-center]="!sidebar.isSidebarVisible"
            >
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 12.5 12 4l9 8.5M5 10.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9.5"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              @if (sidebar.isSidebarVisible) {
                <span>Dashboard</span>
              }
            </a>
          </li>
        </ul>

        @if (sidebar.isSidebarVisible) {
          <span class="mb-4 mt-6 block text-xs font-medium uppercase tracking-wide text-gray-400">CRM</span>
        }
        <ul class="flex flex-col gap-1">
          <li>
            <a
              routerLink="/crm/customers"
              routerLinkActive="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              [class.justify-center]="!sidebar.isSidebarVisible"
            >
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M11 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19.5 19v-1a3 3 0 0 0-2.5-2.96M15 4.13a3 3 0 0 1 0 5.75"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              @if (sidebar.isSidebarVisible) {
                <span>Contactos</span>
              }
            </a>
          </li>
          <li>
            <a
              routerLink="/crm/channels"
              routerLinkActive="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              [class.justify-center]="!sidebar.isSidebarVisible"
            >
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 5h16M4 12h16M4 19h10"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
              @if (sidebar.isSidebarVisible) {
                <span>Canales</span>
              }
            </a>
          </li>
          <li>
            <a
              routerLink="/crm/conversations"
              routerLinkActive="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
              class="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              [class.justify-center]="!sidebar.isSidebarVisible"
            >
              <span class="relative shrink-0">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 4h16v11H8l-4 4V4Z"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                @if (inboxSocket.unreadCount() > 0 && !sidebar.isSidebarVisible) {
                  <span class="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-error-500"></span>
                }
              </span>
              @if (sidebar.isSidebarVisible) {
                <span>Conversaciones</span>
                @if (inboxSocket.unreadCount() > 0) {
                  <span
                    class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1.5 text-[11px] font-semibold text-white"
                  >
                    {{ inboxSocket.unreadCount() > 9 ? '9+' : inboxSocket.unreadCount() }}
                  </span>
                }
              }
            </a>
          </li>
        </ul>
      </nav>
    </aside>

    @if (sidebar.isMobileOpen()) {
      <div class="fixed inset-0 z-40 bg-gray-900/50 lg:hidden" (click)="sidebar.toggleMobileSidebar()"></div>
    }
  `,
})
export class Sidebar {
  protected readonly sidebar = inject(SidebarService);
  protected readonly inboxSocket = inject(AgentInboxSocketService);

  onEnter(): void {
    if (!this.sidebar.isExpanded()) {
      this.sidebar.setHovered(true);
    }
  }

  onLeave(): void {
    this.sidebar.setHovered(false);
  }
}
