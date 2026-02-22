export enum DailyTaskType {
  NORMAL = 'NORMAL',
  SCHEDULED = 'SCHEDULED',
  RECURRENT = 'RECURRENT',
}

export enum DailyTaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum DailyTaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum DailyNotificationStage {
  BEFORE_24_HOURS = 'BEFORE_24_HOURS',
  BEFORE_1_HOUR = 'BEFORE_1_HOUR',
  BEFORE_15_MINUTES = 'BEFORE_15_MINUTES',
  AFTER_NOW = 'AFTER_NOW',
}
