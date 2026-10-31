import { TaskTemplate } from '@template/domain';

export abstract class TaskTemplateSourcePort {
  /**
   * Fetch every task template that has a schedule
   */
  abstract fetchAll(): Promise<TaskTemplate[]>;
}
