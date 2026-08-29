import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MenuItem } from '../../../shared/models/menu-item.model';
import { MenuService } from '../../services/menu.service';
import { SidebarService } from '../../services/sidebar.service';
import { AgentInboxSocketService } from '../../services/agent-inbox-socket.service';

export interface MenuNode extends MenuItem {
  children: MenuNode[];
}

const CONVERSATIONS_STATE = '/crm/conversations';

const SVG_OPEN = '<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
const SVG_CLOSE = '</svg>';

/**
 * El catálogo de módulos del backend hoy no trae `svgIcon` como markup SVG utilizable
 * (viene null o en un formato distinto), así que se usan estos íconos locales como
 * respaldo por ruta/nombre — el árbol de navegación sigue siendo 100% dinámico, solo
 * el dibujo del ícono es local. Si el backend empieza a mandar `svgIcon` real, ese
 * tiene prioridad (ver iconMarkup()).
 */
const ICON_BY_STATE: Record<string, string> = {
  '/dashboard':
    '<path d="M3 12.5 12 4l9 8.5M5 10.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  '/crm/calendar':
    '<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  '/crm/companies':
    '<rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>',
  '/crm/customers':
    '<path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M11 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19.5 19v-1a3 3 0 0 0-2.5-2.96M15 4.13a3 3 0 0 1 0 5.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  '/crm/opportunities': '<path d="M4 19V9m6 10V5m6 14v-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  '/crm/tasks':
    '<path d="M9 6h11M9 12h11M9 18h11M4.5 5.5l1 1 2-2M4.5 11.5l1 1 2-2M4.5 17.5l1 1 2-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  '/crm/channels': '<path d="M4 5h16M4 12h16M4 19h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  '/crm/conversations':
    '<path d="M4 4h16v11H8l-4 4V4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  '/security/users':
    '<circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 20c1.3-4 4.2-6 7.5-6s6.2 2 7.5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  '/security/role-menus':
    '<path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="19" cy="17" r="2" stroke="currentColor" stroke-width="1.4"/>',
  '/security/menu-items':
    '<rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>',
};

const ICON_BY_NAME: Record<string, string> = {
  crm: '<path d="M4 21V8a1 1 0 0 1 1-1h4V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3h4a1 1 0 0 1 1 1v13M4 21h16M9 21v-4h6v4M9 12h.01M9 15h.01M15 12h.01M15 15h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  seguridad:
    '<path d="M12 3.5 5 6v5.5c0 4.6 3 7.9 7 9 4-1.1 7-4.4 7-9V6l-7-2.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
};

const ICON_FALLBACK = '<circle cx="12" cy="12" r="3" fill="currentColor"/>';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  protected readonly sidebar = inject(SidebarService);
  protected readonly inboxSocket = inject(AgentInboxSocketService);
  private readonly menuService = inject(MenuService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly conversationsState = CONVERSATIONS_STATE;

  private readonly menuItems = signal<MenuItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly openIds = signal<Set<number>>(new Set());

  protected readonly tree = computed<MenuNode[]>(() => {
    const items = this.menuItems();
    const nodes = new Map<number, MenuNode>(items.map((item) => [item.id, { ...item, children: [] }]));
    const roots: MenuNode[] = [];

    for (const node of nodes.values()) {
      if (node.parentId !== null && nodes.has(node.parentId)) {
        nodes.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortByOrder = (a: MenuItem, b: MenuItem) => a.orderIndex - b.orderIndex;
    for (const node of nodes.values()) {
      node.children.sort(sortByOrder);
    }
    roots.sort(sortByOrder);
    return roots;
  });

  ngOnInit(): void {
    this.menuService.myMenu().subscribe({
      next: (items) => {
        this.menuItems.set(items);
        this.openIds.set(new Set(items.filter((item) => item.type === 'DROP_DOWN').map((item) => item.id)));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected isOpen(node: MenuNode): boolean {
    return this.openIds().has(node.id);
  }

  protected toggle(node: MenuNode): void {
    const next = new Set(this.openIds());
    if (next.has(node.id)) {
      next.delete(node.id);
    } else {
      next.add(node.id);
    }
    this.openIds.set(next);
  }

  protected iconMarkup(node: MenuItem): SafeHtml {
    if (node.svgIcon && node.svgIcon.trim().startsWith('<')) {
      return this.sanitizer.bypassSecurityTrustHtml(node.svgIcon);
    }

    const inner =
      (node.state ? ICON_BY_STATE[node.state] : undefined) ??
      ICON_BY_NAME[node.name.trim().toLowerCase()] ??
      ICON_FALLBACK;

    return this.sanitizer.bypassSecurityTrustHtml(`${SVG_OPEN}${inner}${SVG_CLOSE}`);
  }

  onEnter(): void {
    if (!this.sidebar.isExpanded()) {
      this.sidebar.setHovered(true);
    }
  }

  onLeave(): void {
    this.sidebar.setHovered(false);
  }
}
