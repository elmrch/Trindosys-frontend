import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { SidebarService } from '../../services/sidebar.service';
import { AgentInboxSocketService } from '../../services/agent-inbox-socket.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, Header],
  template: `
    <div class="flex min-h-screen">
      <app-sidebar />
      <div class="flex w-full min-w-0 flex-1 flex-col">
        <app-header />
        <main class="min-w-0 flex-1 p-4 md:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AppLayout implements OnInit {
  protected readonly sidebar = inject(SidebarService);
  private readonly inboxSocket = inject(AgentInboxSocketService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Conectado mientras haya sesión activa, sin importar la pantalla en la
    // que esté el usuario — así las notificaciones de mensajes nuevos llegan
    // aunque no esté en la pantalla de Conversaciones.
    this.inboxSocket.connect();
    this.destroyRef.onDestroy(() => this.inboxSocket.disconnect());
  }
}
