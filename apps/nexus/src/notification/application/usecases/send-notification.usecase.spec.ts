import { NotificationInput } from '../dto';
import { NotifierNotFoundError } from '../exceptions';
import { NotificationDefaults, NotifierPort } from '../ports';
import { NotifierTypes, Notifiers } from '../types';
import { SendNotificationUsecase } from './send-notification.usecase';

describe('SendNotificationUsecase', () => {
  const defaults: NotificationDefaults = { provider: NotifierTypes.DISCORD, ttl: 3600 };

  let discord: jest.Mocked<NotifierPort>;
  let pushover: jest.Mocked<NotifierPort>;
  let notifiers: Notifiers;
  let usecase: SendNotificationUsecase;

  const buildInput = (overrides: Partial<NotificationInput> = {}) =>
    new NotificationInput({
      title: 'Reminder',
      message: 'Your task is due',
      url: 'https://notion.so/task',
      urlTitle: 'Open',
      ...overrides,
    } as NotificationInput);

  beforeEach(() => {
    discord = { instance: NotifierTypes.DISCORD, notify: jest.fn() } as unknown as jest.Mocked<NotifierPort>;
    pushover = { instance: NotifierTypes.PUSHOVER, notify: jest.fn() } as unknown as jest.Mocked<NotifierPort>;

    notifiers = new Map([
      [NotifierTypes.DISCORD, discord],
      [NotifierTypes.PUSHOVER, pushover],
    ]);

    usecase = new SendNotificationUsecase(notifiers, defaults);
  });

  it('falls back to the configured default provider', async () => {
    await usecase.execute(buildInput());

    expect(discord.notify).toHaveBeenCalledTimes(1);
    expect(pushover.notify).not.toHaveBeenCalled();
  });

  it('honours the provider requested in the payload', async () => {
    await usecase.execute(buildInput({ provider: NotifierTypes.PUSHOVER }));

    expect(pushover.notify).toHaveBeenCalledTimes(1);
    expect(discord.notify).not.toHaveBeenCalled();
  });

  it('applies the default ttl when the payload omits it', async () => {
    await usecase.execute(buildInput());

    expect(discord.notify).toHaveBeenCalledWith(expect.objectContaining({ ttl: 3600 }));
  });

  it('keeps the ttl provided in the payload', async () => {
    await usecase.execute(buildInput({ ttl: 60 }));

    expect(discord.notify).toHaveBeenCalledWith(expect.objectContaining({ ttl: 60 }));
  });

  it('fails with a typed domain error for an unknown provider', async () => {
    await expect(usecase.execute(buildInput({ provider: 'TELEGRAM' as NotifierTypes }))).rejects.toBeInstanceOf(
      NotifierNotFoundError,
    );
  });

  it('propagates a delivery failure instead of swallowing it', async () => {
    discord.notify.mockRejectedValue(new Error('discord down'));

    await expect(usecase.execute(buildInput())).rejects.toThrow('discord down');
  });
});
