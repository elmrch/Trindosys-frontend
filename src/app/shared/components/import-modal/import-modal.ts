import { Component, OnDestroy, input, output, signal } from '@angular/core';
import { ImportResult } from '../../models/import.model';

@Component({
  selector: 'app-import-modal',
  templateUrl: './import-modal.html',
})
export class ImportModal implements OnDestroy {
  readonly title = input.required<string>();

  readonly closed = output<void>();
  readonly downloadTemplate = output<void>();
  readonly importFile = output<File>();

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly importResult = signal<ImportResult | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isDragOver = signal(false);
  protected readonly progress = signal(0);
  protected readonly progressLabel = signal('');

  private progressTimer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.stopProgress();
  }

  protected close(): void {
    this.stopProgress();
    this.closed.emit();
  }

  protected onDownloadTemplate(): void {
    this.downloadTemplate.emit();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.errorMessage.set(null);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx')) {
        this.selectedFile.set(file);
        this.errorMessage.set(null);
      } else {
        this.errorMessage.set('Formato no soportado. Use archivos .xlsx');
      }
    }
  }

  protected onImport(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.progress.set(0);
    this.progressLabel.set('Preparando archivo...');
    this.startProgress();
    this.importFile.emit(file);
  }

  handleSuccess(result: ImportResult): void {
    this.stopProgress();
    this.progress.set(100);
    this.progressLabel.set('Completado');
    setTimeout(() => {
      this.isUploading.set(false);
      this.importResult.set(result);
    }, 400);
  }

  handleError(message: string): void {
    this.stopProgress();
    this.isUploading.set(false);
    this.errorMessage.set(message);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private startProgress(): void {
    this.stopProgress();
    let current = 0;

    const steps: { at: number; label: string }[] = [
      { at: 15, label: 'Subiendo archivo...' },
      { at: 35, label: 'Leyendo filas del Excel...' },
      { at: 55, label: 'Validando datos...' },
      { at: 72, label: 'Importando registros...' },
      { at: 88, label: 'Casi listo...' },
    ];

    let stepIndex = 0;

    this.progressTimer = setInterval(() => {
      if (stepIndex < steps.length && current >= steps[stepIndex].at) {
        this.progressLabel.set(steps[stepIndex].label);
        stepIndex++;
      }

      if (current < 90) {
        const increment = current < 30 ? 2 : current < 60 ? 1.5 : current < 80 ? 1 : 0.5;
        current = Math.min(current + increment, 90);
        this.progress.set(Math.round(current));
      }
    }, 200);
  }

  private stopProgress(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }
}
