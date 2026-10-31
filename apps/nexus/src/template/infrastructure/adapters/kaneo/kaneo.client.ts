import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import { RoutineSourceException } from '@template/application/exceptions';
import { KaneoBoard, KaneoBoardResponse, KaneoNewTask, KaneoTask } from './kaneo.types';

@Injectable()
export class KaneoClient {
  /**
   * Biggest page the Kaneo API accepts
   */
  private static readonly PAGE_SIZE = 100;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Fetch every task of a project, going through all the pages of its board
   * @param projectId
   */
  async fetchBoard(projectId: string): Promise<KaneoBoard> {
    const open = new Map<string, KaneoTask>();
    const archived = new Map<string, KaneoTask>();

    let page = 1;
    let totalPages = 1;

    do {
      const { data, pagination } = await this.request<KaneoBoardResponse>({
        method: 'GET',
        url: `/task/tasks/${projectId}`,
        params: { page, limit: KaneoClient.PAGE_SIZE },
      });

      const columnTasks = data.columns.flatMap((column) => column.tasks);

      for (const task of [...columnTasks, ...data.plannedTasks]) open.set(task.id, task);
      for (const task of data.archivedTasks) archived.set(task.id, task);

      totalPages = pagination.totalPages;
      page++;
    } while (page <= totalPages);

    return { open: [...open.values()], archived: [...archived.values()] };
  }

  /**
   * Create a task in a project
   * @param projectId
   * @param task
   */
  async createTask(projectId: string, task: KaneoNewTask): Promise<void> {
    await this.request({ method: 'POST', url: `/task/${projectId}`, data: task });
  }

  private async request<T = unknown>(request: AxiosRequestConfig): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.http.request<T>({
          ...request,
          url: `${this.config.get('KANEO_URL')}/api${request.url}`,
          headers: { Authorization: `Bearer ${this.config.get('KANEO_API_KEY')}` },
        }),
      );

      return response.data;
    } catch (error) {
      throw new RoutineSourceException(
        { method: request.method, path: request.url, status: error.response?.status },
        error,
      );
    }
  }
}
