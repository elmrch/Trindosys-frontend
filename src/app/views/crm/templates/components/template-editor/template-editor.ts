import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { TemplateService } from '../../services/template.service';
import { Plantilla, PlantillaBoton, PlantillaVariable } from '../../models/template.model';

@Component({
  selector: 'app-template-editor',
  imports: [FormsModule],
  templateUrl: './template-editor.html',
})
export class TemplateEditor implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly templateService = inject(TemplateService);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly templateId = signal<number | null>(null);
  protected readonly nombre = signal('');
  protected readonly contenido = signal('');
  protected readonly archivoAdjuntoUrl = signal<string | null>(null);
  protected readonly botones = signal<PlantillaBoton[]>([]);
  protected readonly variables = signal<PlantillaVariable[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isDragging = signal(false);
  protected readonly showVariableDropdown = signal(false);
  protected readonly showEmojiPicker = signal(false);

  protected readonly fechaEdicion = computed(() => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  protected readonly textoPreview = computed(() => {
    let text = this.contenido();
    if (!text) return 'Escribe tu mensaje aqui...';
    return text;
  });

  protected readonly isEditing = computed(() => this.templateId() !== null);

  protected readonly commonEmojis = ['😊', '👍', '🎉', '❤️', '🔥', '✨', '💪', '🙏', '😍', '🤔', '👏', '💯', '✅', '⭐', '🚀', '💡'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.templateId.set(Number(id));
      this.loadTemplate(Number(id));
    }
    this.loadVariables();
  }

  private loadTemplate(id: number): void {
    this.isLoading.set(true);
    this.templateService.get(id).subscribe({
      next: (template) => {
        this.nombre.set(template.nombre);
        this.contenido.set(template.contenido ?? '');
        this.archivoAdjuntoUrl.set(template.archivoAdjuntoUrl);
        this.botones.set(template.botones.map(b => ({ ...b })));
        this.isLoading.set(false);
      },
      error: () => {
        this.sweetAlert.error('No se pudo cargar la plantilla.');
        this.router.navigate(['/crm/templates']);
      },
    });
  }

  private loadVariables(): void {
    this.templateService.getVariables().subscribe({
      next: (vars) => this.variables.set(vars),
    });
  }

  protected onContenidoChange(value: string): void {
    this.contenido.set(value);
  }

  protected onNombreChange(value: string): void {
    this.nombre.set(value);
  }

  protected insertVariable(key: string): void {
    const textarea = document.getElementById('contenido-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = this.contenido();
    const placeholder = `[${key}]`;
    const newText = current.substring(0, start) + placeholder + current.substring(end);
    this.contenido.set(newText);

    setTimeout(() => {
      textarea.focus();
      const pos = start + placeholder.length;
      textarea.setSelectionRange(pos, pos);
    });

    this.showVariableDropdown.set(false);
  }

  protected toggleEmojiPicker(): void {
    this.showEmojiPicker.update(v => !v);
  }

  protected insertEmoji(emoji: string): void {
    const textarea = document.getElementById('contenido-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = this.contenido();
    const newText = current.substring(0, start) + emoji + current.substring(end);
    this.contenido.set(newText);

    setTimeout(() => {
      textarea.focus();
      const pos = start + emoji.length;
      textarea.setSelectionRange(pos, pos);
    });

    this.showEmojiPicker.set(false);
  }

  protected addBoton(): void {
    const current = this.botones();
    if (current.length >= 3) return;
    this.botones.set([...current, { id: null, texto: '', orden: current.length + 1 }]);
  }

  protected removeBoton(index: number): void {
    const current = this.botones();
    this.botones.set(current.filter((_, i) => i !== index).map((b, i) => ({ ...b, orden: i + 1 })));
  }

  protected onBotonTextChange(index: number, value: string): void {
    if (value.length > 20) return;
    const current = [...this.botones()];
    current[index] = { ...current[index], texto: value };
    this.botones.set(current);
  }

  protected onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    // TODO: implement file upload with FileStorageService
    // For now, just set a placeholder URL
    this.archivoAdjuntoUrl.set(URL.createObjectURL(file));
  }

  protected removeFile(): void {
    this.archivoAdjuntoUrl.set(null);
  }

  protected onSave(): void {
    if (!this.nombre().trim()) {
      this.sweetAlert.error('El nombre de la plantilla es obligatorio.');
      return;
    }

    this.isSubmitting.set(true);

    const request = {
      empresaId: 1, // TODO: get from auth context
      nombre: this.nombre(),
      contenido: this.contenido() || null,
      archivoAdjuntoUrl: this.archivoAdjuntoUrl(),
      botones: this.botones().map((b, i) => ({
        texto: b.texto,
        orden: i + 1,
      })),
    };

    const id = this.templateId();
    const request$ = id
      ? this.templateService.update(id, request)
      : this.templateService.create(request);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.sweetAlert.toast(id ? 'Plantilla actualizada.' : 'Plantilla creada.');
        this.router.navigate(['/crm/templates']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.sweetAlert.error('No se pudo guardar la plantilla.');
      },
    });
  }

  protected onDelete(): void {
    const id = this.templateId();
    if (!id) return;

    this.sweetAlert
      .confirm('¿Eliminar plantilla?', 'Esta accion no se puede deshacer.', 'Si, eliminar')
      .then((result) => {
        if (!result.isConfirmed) return;
        this.templateService.delete(id).subscribe({
          next: () => {
            this.sweetAlert.toast('Plantilla eliminada.');
            this.router.navigate(['/crm/templates']);
          },
          error: () => this.sweetAlert.error('No se pudo eliminar la plantilla.'),
        });
      });
  }

  protected onCancel(): void {
    this.router.navigate(['/crm/templates']);
  }
}
