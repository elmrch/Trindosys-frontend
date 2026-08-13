import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ActivitiesTimeline } from '../../../activities/components/activities-timeline/activities-timeline';
import { ActivityForm } from '../../../activities/components/activity-form/activity-form';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-detail',
  imports: [RouterLink, ActivitiesTimeline, ActivityForm],
  templateUrl: './customer-detail.html',
})
export class CustomerDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly customerService = inject(CustomerService);

  protected readonly customer = signal<Customer | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly refreshToken = signal(0);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.isLoading.set(true);
    this.customerService.get(id).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudo cargar el cliente.');
      },
    });
  }

  protected onActivityCreated(): void {
    this.refreshToken.update((value) => value + 1);
  }
}
