import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MenuService } from '../../../../../core/services/menu.service';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { MenuItem } from '../../../../../shared/models/menu-item.model';
import { Role } from '../../models/user.model';
import { UserService } from '../../services/user.service';

interface MenuItemNode extends MenuItem {
  children: MenuItemNode[];
}

@Component({
  selector: 'app-role-menu-assignment',
  templateUrl: './role-menu-assignment.html',
})
export class RoleMenuAssignment implements OnInit {
  private readonly userService = inject(UserService);
  private readonly menuService = inject(MenuService);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly roles = signal<Role[]>([]);
  protected readonly selectedRoleId = signal<number | null>(null);
  protected readonly catalog = signal<MenuItem[]>([]);
  protected readonly selectedIds = signal<Set<number>>(new Set());
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);

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
    this.userService.listRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        if (roles.length > 0) {
          this.selectRole(roles[0].id);
        }
      },
      error: () => this.sweetAlert.error('No se pudieron cargar los roles.'),
    });

    this.menuService.catalog().subscribe({
      next: (items) => this.catalog.set(items),
      error: () => this.sweetAlert.error('No se pudo cargar el catálogo de módulos.'),
    });
  }

  protected selectRole(roleId: number): void {
    this.selectedRoleId.set(roleId);
    this.isLoading.set(true);
    this.menuService.roleMenuItems(roleId).subscribe({
      next: (ids) => {
        this.selectedIds.set(new Set(ids));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.sweetAlert.error('No se pudieron cargar los módulos del rol.');
      },
    });
  }

  protected isChecked(id: number): boolean {
    return this.selectedIds().has(id);
  }

  protected toggle(node: MenuItemNode): void {
    const next = new Set(this.selectedIds());
    const willCheck = !next.has(node.id);

    if (willCheck) {
      next.add(node.id);
    } else {
      next.delete(node.id);
    }

    // Un padre desmarcado desmarca a sus hijos; un hijo marcado marca a su padre.
    if (!willCheck) {
      for (const child of node.children) {
        next.delete(child.id);
      }
    }

    this.selectedIds.set(next);
  }

  protected save(): void {
    const roleId = this.selectedRoleId();
    if (roleId === null) {
      return;
    }

    this.isSaving.set(true);
    this.menuService.assignMenuItems(roleId, Array.from(this.selectedIds())).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.sweetAlert.toast('Módulos actualizados.');
      },
      error: () => {
        this.isSaving.set(false);
        this.sweetAlert.error('No se pudieron guardar los módulos del rol.');
      },
    });
  }
}
