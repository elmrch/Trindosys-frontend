import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { InitialsAvatar } from '../../../shared/components/initials-avatar/initials-avatar';
import { Advisor } from '../../../shared/models/advisor.model';
import { AdvisorService } from '../../../shared/services/advisor.service';
import { Activity, UpdateActivityRequest } from '../activities/models/activity.model';
import { ActivityService } from '../activities/services/activity.service';

type ColumnId = 'PENDING' | 'COMPLETED';

interface TaskColumn {
  id: ColumnId;
  label: string;
  dotClass: string;
  emptyText: string;
}

const COLUMNS: TaskColumn[] = [
  { id: 'PENDING', label: 'Pendientes', dotClass: 'bg-amber-500', emptyText: 'Sin tareas pendientes' },
  { id: 'COMPLETED', label: 'Completadas', dotClass: 'bg-emerald-500', emptyText: 'Sin tareas completadas' },
];

@Component({
  selector: 'app-tasks',
  imports: [DatePipe, RouterLink, InitialsAvatar],
  templateUrl: './tasks.html',
})
export class Tasks implements OnInit {
  private readonly activityService = inject(ActivityService);
  private readonly advisorService = inject(AdvisorService);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly columns = COLUMNS;

  protected readonly tasks = signal<Activity[]>([]);
  protected readonly advisors = signal<Advisor[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly filterAdvisorId = signal<string>('');
  protected readonly activeDropdown = signal(false);

  protected readonly dragOverColumn = signal<ColumnId | null>(null);

  private draggingTask: Activity | null = null;

  ngOnInit(): void {
    this.loadTasks();
    this.advisorService.list().subscribe({ next: (advisors) => this.advisors.set(advisors) });
  }

  protected selectedAdvisorName(): string {
    const id = this.filterAdvisorId();
    if (!id) {
      return 'Todos';
    }
    const advisor = this.advisors().find((a) => String(a.id) === id);
    return advisor ? advisor.fullName : `Asesor #${id}`;
  }

  protected toggleDropdown(): void {
    this.activeDropdown.update((open) => !open);
  }

  protected closeDropdown(): void {
    this.activeDropdown.set(false);
  }

  protected selectAdvisor(advisorId: string): void {
    this.filterAdvisorId.set(advisorId);
    this.closeDropdown();
  }

  protected clearAdvisorFilter(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.filterAdvisorId.set('');
  }

  protected filteredTasks(): Activity[] {
    const advisorId = this.filterAdvisorId();
    if (!advisorId) {
      return this.tasks();
    }
    return this.tasks().filter((task) => task.assignedAdvisorId != null && String(task.assignedAdvisorId) === advisorId);
  }

  protected tasksFor(columnId: ColumnId): Activity[] {
    return this.filteredTasks().filter((task) => (task.taskStatus ?? 'PENDING') === columnId);
  }

  protected isOverdue(task: Activity): boolean {
    return task.taskStatus === 'PENDING' && !!task.dueDate && new Date(task.dueDate).getTime() < Date.now();
  }

  protected onDragStart(task: Activity, event: DragEvent): void {
    this.draggingTask = task;
    event.dataTransfer?.setData('text/plain', String(task.id));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected onColumnDragOver(columnId: ColumnId, event: DragEvent): void {
    event.preventDefault();
    this.dragOverColumn.set(columnId);
  }

  protected onColumnDragLeave(columnId: ColumnId): void {
    if (this.dragOverColumn() === columnId) {
      this.dragOverColumn.set(null);
    }
  }

  protected onDrop(columnId: ColumnId, event: DragEvent): void {
    event.preventDefault();
    this.dragOverColumn.set(null);

    const task = this.draggingTask;
    this.draggingTask = null;
    if (!task) {
      return;
    }
    const current = task.taskStatus ?? 'PENDING';
    if (current === columnId) {
      return;
    }
    this.moveTask(task, columnId);
  }

  protected async removeTask(task: Activity): Promise<void> {
    const result = await this.sweetAlert.confirm('¿Eliminar tarea?', 'Esta acción no se puede deshacer.', 'Sí, eliminar');
    if (!result.isConfirmed) {
      return;
    }
    this.activityService.delete(task.id).subscribe({
      next: () => {
        this.tasks.update((list) => list.filter((t) => t.id !== task.id));
        this.sweetAlert.toast('Tarea eliminada.');
      },
      error: () => this.sweetAlert.error('No se pudo eliminar la tarea.'),
    });
  }

  private loadTasks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.activityService.list('TASK').subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar las tareas.');
      },
    });
  }

  private moveTask(task: Activity, columnId: ColumnId): void {
    const request: UpdateActivityRequest = { taskStatus: columnId };
    this.activityService.update(task.id, request).subscribe({
      next: (updated) => {
        this.upsertTask(updated);
        this.sweetAlert.toast(columnId === 'COMPLETED' ? 'Tarea completada.' : 'Tarea reactivada.');
      },
      error: () => this.sweetAlert.error('No se pudo mover la tarea.'),
    });
  }

  private upsertTask(task: Activity): void {
    this.tasks.update((list) => {
      const exists = list.some((t) => t.id === task.id);
      return exists ? list.map((t) => (t.id === task.id ? task : t)) : [...list, task];
    });
  }
}