import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MenuService } from '../../../../../core/services/menu.service';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { MenuItem } from '../../../../../shared/models/menu-item.model';
import { MenuItemForm } from '../menu-item-form/menu-item-form';

interface MenuItemNode extends MenuItem {
  children: MenuItemNode[];
}

@Component({
  selector: 'app-menu-item-manager',
  imports: [MenuItemForm],
  templateUrl: './menu-item-manager.html',
})
export class MenuItemManager implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly catalog = signal<MenuItem[]>([]);
  protected readonly isLoading = signal(false);

  protected readonly isFormOpen = signal(false);
  protected readonly editingItem = signal<MenuItem | null>(null);

  protected readonly tree = computed<MenuItemNode[]>(() => {
    const items = this.catalog();
    const nodes = new Map<number, MenuItemNode>(items.map((item) => [item.id, { ...item, children: [] }]));
    const roots: MenuItemNode[] = [];

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
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.menuService.catalog().subscribe({
      next: (items) => {
        this.catalog.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.sweetAlert.error('No se pudo cargar el catálogo de módulos.');
      },
    });
  }

  protected openCreateForm(): void {
    this.editingItem.set(null);
    this.isFormOpen.set(true);
  }

  protected openEditForm(item: MenuItem): void {
    this.editingItem.set(item);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingItem.set(null);
  }

  protected onSaved(): void {
    this.closeForm();
    this.load();
  }

  protected remove(item: MenuItem): void {
    this.sweetAlert
      .confirm(`¿Eliminar el módulo "${item.name}"?`, 'Esta acción no se puede deshacer.', 'Sí, eliminar')
      .then((result) => {
        if (!result.isConfirmed) {
          return;
        }
        this.menuService.deleteMenuItem(item.id).subscribe({
          next: () => {
            this.sweetAlert.toast('Módulo eliminado.');
            this.load();
          },
          error: (error: HttpErrorResponse) => {
            this.sweetAlert.error(
              error.status === 400 ? 'No se puede eliminar: primero elimina sus submenús.' : 'No se pudo eliminar el módulo.',
            );
          },
        });
      });
  }
}
