import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Channel, ChannelConnectionRequest, ChannelConnectionWithChannel } from '../../models/channel.model';
import { ChannelService } from '../../services/channel.service';

@Component({
  selector: 'app-connection-form',
  imports: [ReactiveFormsModule],
  templateUrl: './connection-form.html',
})
export class ConnectionForm {
  private readonly fb = inject(FormBuilder);
  private readonly channelService = inject(ChannelService);

  readonly channels = input.required<Channel[]>();
  readonly connection = input<ChannelConnectionWithChannel | null>(null);

  readonly saved = output<void>();
  readonly cancel = output<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.connection() !== null);

  protected readonly form = this.fb.nonNullable.group({
    channelId: [0, [Validators.required, Validators.min(1)]],
    name: ['', Validators.required],
    externalId: ['', Validators.required],
    token: ['', Validators.required],
    webhookUrl: [''],
    active: [true],
  });

  constructor() {
    effect(() => {
      const existing = this.connection();
      if (existing) {
        this.form.patchValue({
          channelId: existing.channelId,
          name: existing.name,
          externalId: existing.externalId,
          token: '',
          webhookUrl: existing.webhookUrl ?? '',
          active: existing.active,
        });
      } else {
        this.form.reset({ channelId: 0, name: '', externalId: '', token: '', webhookUrl: '', active: true });
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: ChannelConnectionRequest = {
      channelId: raw.channelId,
      name: raw.name,
      externalId: raw.externalId,
      token: raw.token,
      webhookUrl: raw.webhookUrl || null,
      active: raw.active,
    };

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const existing = this.connection();
    const request$ = existing
      ? this.channelService.updateConnection(existing.id, request)
      : this.channelService.createConnection(request);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          error.status === 400 ? 'Revisa los datos ingresados.' : 'No se pudo guardar la conexión.',
        );
      },
    });
  }
}
