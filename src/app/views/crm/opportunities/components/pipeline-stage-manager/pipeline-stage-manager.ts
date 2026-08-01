import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PipelineStage, PipelineStageRequest, StageType } from '../../models/pipeline-stage.model';
import { PipelineStageService } from '../../services/pipeline-stage.service';

@Component({
  selector: 'app-pipeline-stage-manager',
  imports: [ReactiveFormsModule],
  templateUrl: './pipeline-stage-manager.html',
})
export class PipelineStageManager implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pipelineStageService = inject(PipelineStageService);

  readonly close = output<void>();
  readonly changed = output<void>();

  protected readonly stages = signal<PipelineStage[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly editingStage = signal<PipelineStage | null>(null);
  protected readonly isFormOpen = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    position: [''],
    type: ['OPEN' as StageType, Validators.required],
    initial: [false],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.pipelineStageService.list().subscribe({
      next: (stages) => {
        this.stages.set(stages);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar las etapas.');
      },
    });
  }

  protected openCreateForm(): void {
    this.editingStage.set(null);
    this.form.reset({ name: '', position: '', type: 'OPEN', initial: false });
    this.isFormOpen.set(true);
  }

  protected openEditForm(stage: PipelineStage): void {
    this.editingStage.set(stage);
    this.form.reset({
      name: stage.name,
      position: String(stage.position),
      type: stage.type,
      initial: stage.initial,
    });
    this.isFormOpen.set(true);
  }

  protected cancelForm(): void {
    this.isFormOpen.set(false);
    this.editingStage.set(null);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: PipelineStageRequest = {
      name: raw.name,
      position: raw.position ? Number(raw.position) : undefined,
      type: raw.type,
      initial: raw.initial,
    };

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const existing = this.editingStage();
    const request$ = existing
      ? this.pipelineStageService.update(existing.id, request)
      : this.pipelineStageService.create(request);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.cancelForm();
        this.load();
        this.changed.emit();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('No se pudo guardar la etapa.');
      },
    });
  }

  protected deleteStage(stage: PipelineStage): void {
    if (!confirm(`¿Eliminar la etapa "${stage.name}"?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.pipelineStageService.delete(stage.id).subscribe({
      next: () => {
        this.load();
        this.changed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.status === 400
            ? 'No se puede eliminar: tiene oportunidades asociadas, o es la etapa inicial y quedan otras etapas.'
            : 'No se pudo eliminar la etapa.',
        );
      },
    });
  }
}
