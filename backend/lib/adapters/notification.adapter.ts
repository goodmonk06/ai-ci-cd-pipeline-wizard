export interface NotificationPayload {
  title: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
}

export interface INotificationAdapter {
  send(payload: NotificationPayload): Promise<void>;
  sendToUser(userId: string, payload: NotificationPayload): Promise<void>;
}

// In-memory implementation (stub)
export class InMemoryNotificationAdapter implements INotificationAdapter {
  private notifications: Array<{ userId?: string; payload: NotificationPayload }> = [];

  async send(payload: NotificationPayload): Promise<void> {
    this.notifications.push({ payload });
    console.log('[NOTIFICATION]', payload.title, '-', payload.message);
  }

  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    this.notifications.push({ userId, payload });
    console.log('[NOTIFICATION]', `To: ${userId}`, payload.title, '-', payload.message);
  }

  getNotifications() {
    return [...this.notifications];
  }

  clear() {
    this.notifications = [];
  }
}

// Webhook implementation
export class WebhookNotificationAdapter implements INotificationAdapter {
  constructor(private webhookUrl: string) {}

  async send(payload: NotificationPayload): Promise<void> {
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    await this.send({ ...payload, metadata: { ...payload.metadata, userId } });
  }
}

// Export default adapter
export const notificationAdapter: INotificationAdapter = new InMemoryNotificationAdapter();
