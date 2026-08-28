import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Channel, ChannelConnectionRequest, ChannelConnectionWithChannel, ChannelProvider } from '../../models/channel.model';
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
  readonly preselectedChannelId = input<number | null>(null);
  readonly preselectedProvider = input<ChannelProvider | null>(null);

  readonly saved = output<void>();
  readonly cancel = output<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.connection() !== null);

  protected readonly form = this.fb.nonNullable.group({
    channelId: [0, [Validators.required, Validators.min(1)]],
    name: ['', Validators.required],
    provider: ['evolution-api' as ChannelProvider, Validators.required],
    externalId: [''],
    token: ['', Validators.required],
    webhookUrl: [''],
    active: [true],
  });

  protected readonly isEvolutionApi = computed(() => this.form.controls.provider.value === 'evolution-api');
  protected readonly isMetaCloudApi = computed(() => this.form.controls.provider.value === 'meta-cloud-api');

  constructor() {
    effect(() => {
      const existing = this.connection();
      const preChannelId = this.preselectedChannelId();
      const preProvider = this.preselectedProvider();

      if (existing) {
        this.form.patchValue({
          channelId: existing.channelId,
          name: existing.name,
          provider: existing.provider ?? 'meta-cloud-api',
          externalId: existing.externalId,
          token: '',
          webhookUrl: existing.webhookUrl ?? '',
          active: existing.active,
        });
        this.form.controls.externalId.disable();
        this.form.controls.webhookUrl.disable();
      } else {
        const provider = preProvider ?? 'evolution-api';
        this.form.reset({
          channelId: preChannelId ?? 0,
          name: '',
          provider,
          externalId: '',
          token: '',
          webhookUrl: provider === 'evolution-api' ? `${window.location.origin}/api/webhooks/evolution-api` : '',
          active: true,
        });

        if (provider === 'evolution-api') {
          this.form.controls.externalId.disable();
        }
      }
    });

    this.form.controls.provider.valueChanges.subscribe((provider) => {
      if (provider === 'evolution-api') {
        this.form.controls.externalId.disable();
        this.form.controls.externalId.setValue('');
        this.form.controls.webhookUrl.setValue(`${window.location.origin}/api/webhooks/evolution-api`);
      } else {
        this.form.controls.externalId.enable();
        this.form.controls.webhookUrl.setValue('');
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
      provider: raw.provider,
      externalId: raw.externalId || '',
      token: raw.token,
      webhookUrl: raw.webhookUrl || undefined,
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
