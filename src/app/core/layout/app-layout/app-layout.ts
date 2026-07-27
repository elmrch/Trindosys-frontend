import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, Header],
  template: `
    <div class="flex min-h-screen">
      <app-sidebar />
      <div class="flex w-full flex-1 flex-col">
        <app-header />
        <main class="flex-1 p-4 md:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AppLayout {
  protected readonly sidebar = inject(SidebarService);
}
