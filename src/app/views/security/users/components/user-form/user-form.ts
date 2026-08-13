import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { Role, User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.html',
})
export class UserForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly user = input<User | null>(null);

  readonly saved = output<void>();
  readonly cancel = output<void>();

  protected readonly roles = signal<Role[]>([]);
  protected readonly isSubmitting = signal(false);
  protected readonly isEditMode = computed(() => this.user() !== null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    fullName: ['', Validators.required],
    roleId: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const existing = this.user();
      if (existing) {
        this.form.patchValue({
          email: existing.email,
          password: '',
          fullName: existing.fullName ?? '',
          roleId: String(existing.roleId),
        });
        this.form.controls.email.disable();
        this.form.controls.password.disable();
      } else {
        this.form.reset({ email: '', password: '', fullName: '', roleId: '' });
        this.form.controls.email.enable();
        this.form.controls.password.enable();
      }
    });
  }

  ngOnInit(): void {
    this.userService.listRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => this.sweetAlert.error('No se pudieron cargar los roles.'),
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const existing = this.user();
    this.isSubmitting.set(true);

    const request$ = existing
      ? this.userService.update(existing.id, { fullName: raw.fullName, roleId: Number(raw.roleId) })
      : this.userService.create({
          email: raw.email,
          password: raw.password,
          fullName: raw.fullName,
          roleId: Number(raw.roleId),
        });

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.sweetAlert.toast(existing ? 'Usuario actualizado.' : 'Usuario creado.');
        this.saved.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.sweetAlert.error(error.status === 400 ? 'Revisa los datos ingresados.' : 'No se pudo guardar el usuario.');
      },
    });
  }
}
