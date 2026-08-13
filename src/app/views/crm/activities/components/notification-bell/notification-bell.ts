import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ActivityNotification } from '../../models/activity-notification.model';
import { ActivityNotificationSocketService } from '../../services/activity-notification-socket.service';
import { ActivityNotificationService } from '../../services/activity-notification.service';

@Component({
  selector: 'app-notification-bell',
  imports: [DatePipe, RouterLink],
  templateUrl: './notification-bell.html',
})
export class NotificationBell implements OnInit, OnDestroy {
  private readonly notificationService = inject(ActivityNotificationService);
  private readonly notificationSocket = inject(ActivityNotificationSocketService);
  private socketSubscription: Subscription | null = null;

  protected readonly isOpen = signal(false);
  protected readonly notifications = signal<ActivityNotification[]>([]);
  protected readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  ngOnInit(): void {
    this.notificationService.list().subscribe({
      next: (notifications) => this.notifications.set(notifications),
    });

    this.notificationSocket.connect();
    this.socketSubscription = this.notificationSocket.events$.subscribe((notification) => {
      this.notifications.update((current) => [notification, ...current]);
    });
  }

  ngOnDestroy(): void {
    this.socketSubscription?.unsubscribe();
    this.notificationSocket.disconnect();
  }

  protected toggle(): void {
    this.isOpen.update((value) => !value);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected markRead(notification: ActivityNotification): void {
    if (notification.read) {
      return;
    }
    this.notificationService.markRead(notification.id).subscribe({
      next: (updated) => {
        this.notifications.update((current) => current.map((n) => (n.id === updated.id ? updated : n)));
      },
    });
  }

  protected typeLabel(type: ActivityNotification['type']): string {
    switch (type) {
      case 'TASK_DUE_SOON':
        return 'Tarea por vencer';
      case 'TASK_OVERDUE':
        return 'Tarea vencida';
      case 'FOLLOW_UP_DUE':
        return 'Seguimiento pendiente';
    }
  }
}
