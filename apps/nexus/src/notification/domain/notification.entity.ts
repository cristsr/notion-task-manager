export class Notification {
  title: string;

  message: string;

  url: string;

  urlTitle: string;

  ttl: number;

  private constructor(payload: Notification) {
    Object.assign(this, payload);
  }

  static create(payload: Notification): Notification {
    return new Notification(payload);
  }
}
