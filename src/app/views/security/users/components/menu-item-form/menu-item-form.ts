import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuService } from '../../../../../core/services/menu.service';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { MenuItem, MenuItemRequest, MenuItemType } from '../../../../../shared/models/menu-item.model';

const TYPES: MenuItemType[] = ['LINK', 'DROP_DOWN', 'ICON', 'SEPARATOR', 'EXT_LINK'];

@Component({
  selector: 'app-menu-item-form',
  imports: [ReactiveFormsModule],
  templateUrl: './menu-item-form.html',
})
export class MenuItemForm {
  private readonly fb = inject(FormBuilder);
  private readonly menuService = inject(MenuService);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly item = input<MenuItem | null>(null);
  readonly catalog = input.required<MenuItem[]>();

  readonly saved = output<void>();
  readonly cancel = output<void>();

  protected readonly types = TYPES;
  protected readonly isSubmitting = signal(false);
  protected readonly isEditMode = computed(() => this.item() !== null);

  protected readonly parentOptions = computed(() => {
    const editingId = this.item()?.id;
    return this.catalog().filter((candidate) => candidate.id !== editingId);
  });

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: ['LINK' as MenuItemType, Validators.required],
    state: [''],
    icon: [''],
    svgIcon: [''],
    tooltip: [''],
    disabled: [false],
    parentId: [''],
    orderIndex: [0, Validators.required],
    active: [true],
  });

  constructor() {
    effect(() => {
      const existing = this.item();
      if (existing) {
        this.form.patchValue({
          name: existing.name,
          type: existing.type,
          state: existing.state ?? '',
          icon: existing.icon ?? '',
          svgIcon: existing.svgIcon ?? '',
          tooltip: existing.tooltip ?? '',
          disabled: existing.disabled,
          parentId: existing.parentId != null ? String(existing.parentId) : '',
          orderIndex: existing.orderIndex,
          active: existing.active,
        });
      } else {
        this.form.reset({
          name: '',
          type: 'LINK',
          state: '',
          icon: '',
          svgIcon: '',
          tooltip: '',
          disabled: false,
          parentId: '',
          orderIndex: 0,
          active: true,
        });
      }
    });
  }

  protected isContainerType(): boolean {
    const type = this.form.controls.type.value;
    return type === 'DROP_DOWN' || type === 'SEPARATOR';
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: MenuItemRequest = {
      name: raw.name,
      type: raw.type,
      state: this.isContainerType() ? null : raw.state || null,
      icon: raw.icon || null,
      svgIcon: raw.svgIcon || null,
      tooltip: raw.tooltip || null,
      disabled: raw.disabled,
      parentId: raw.parentId ? Number(raw.parentId) : null,
      orderIndex: raw.orderIndex,
      active: raw.active,
    };

    const existing = this.item();
    this.isSubmitting.set(true);
    const request$ = existing ? this.menuService.updateMenuItem(existing.id, request) : this.menuService.createMenuItem(request);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.sweetAlert.toast(existing ? 'Módulo actualizado.' : 'Módulo creado.');
        this.saved.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.sweetAlert.error(error.status === 400 ? 'Revisa los datos ingresados.' : 'No se pudo guardar el módulo.');
      },
    });
  }
}
