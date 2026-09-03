import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { TemplateService } from '../../services/template.service';
import { Plantilla } from '../../models/template.model';

@Component({
  selector: 'app-template-list',
  templateUrl: './template-list.html',
})
export class TemplateList implements OnInit {
  private readonly templateService = inject(TemplateService);
  private readonly router = inject(Router);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly templates = signal<Plantilla[]>([]);
  protected readonly isLoading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.templateService.list(1).subscribe({ // TODO: empresaId from auth
      next: (result) => {
        this.templates.set(result);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.sweetAlert.error('No se pudieron cargar las plantillas.');
      },
    });
  }

  protected openEditor(id?: number): void {
    if (id) {
      this.router.navigate(['/crm/templates', id]);
    } else {
      this.router.navigate(['/crm/templates/new']);
    }
  }

  protected onDelete(template: Plantilla): void {
    this.sweetAlert
      .confirm(`¿Eliminar "${template.nombre}"?`, 'Esta accion no se puede deshacer.', 'Si, eliminar')
      .then((result) => {
        if (!result.isConfirmed) return;
        this.templateService.delete(template.id).subscribe({
          next: () => {
            this.sweetAlert.toast('Plantilla eliminada.');
            this.load();
          },
          error: () => this.sweetAlert.error('No se pudo eliminar la plantilla.'),
        });
      });
  }

  protected formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }
}
