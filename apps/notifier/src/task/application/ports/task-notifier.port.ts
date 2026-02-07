import { Task } from '../../domain';

export abstract class TaskNotifierPort {
  abstract notify(task: Task): Promise<void>;
}
