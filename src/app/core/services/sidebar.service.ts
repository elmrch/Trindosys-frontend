import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  readonly isExpanded = signal(true);
  readonly isMobileOpen = signal(false);
  readonly isHovered = signal(false);

  get isSidebarVisible(): boolean {
    return this.isExpanded() || this.isHovered() || this.isMobileOpen();
  }

  toggleSidebar(): void {
    this.isExpanded.update((v) => !v);
  }

  toggleMobileSidebar(): void {
    this.isMobileOpen.update((v) => !v);
  }

  setHovered(value: boolean): void {
    this.isHovered.set(value);
  }
}
