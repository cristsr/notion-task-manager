import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { RoutineSourceException } from '@template/application/exceptions';
import { KaneoClient } from './kaneo.client';
import { KaneoTask } from './kaneo.types';

describe('KaneoClient', () => {
  const task = (id: string): KaneoTask => ({
    id,
    title: `Task ${id}`,
    description: null,
    priority: 'low',
    dueDate: null,
    recurrence: null,
  });

  const board = (columns: KaneoTask[][], archived: KaneoTask[], planned: KaneoTask[], totalPages = 1) => ({
    data: {
      data: {
        columns: columns.map((tasks) => ({ tasks })),
        archivedTasks: archived,
        plannedTasks: planned,
      },
      pagination: { totalPages },
    },
  });

  let http: { request: jest.Mock };
  let client: KaneoClient;

  beforeEach(() => {
    http = { request: jest.fn() };

    const config = {
      get: (key: string) => ({ KANEO_URL: 'http://kaneo.test', KANEO_API_KEY: 'secret' })[key],
    };

    client = new KaneoClient(http as unknown as HttpService, config as unknown as ConfigService);
  });

  describe('fetchBoard', () => {
    it('collects the tasks of every column and splits the archived ones', async () => {
      http.request.mockReturnValue(of(board([[task('a')], [task('b')]], [task('old')], [task('soon')])));

      const result = await client.fetchBoard('project-1');

      expect(result.open.map((t) => t.id)).toEqual(['a', 'b', 'soon']);
      expect(result.archived.map((t) => t.id)).toEqual(['old']);
    });

    it('goes through every page and does not repeat the tasks the buckets repeat on each page', async () => {
      http.request
        .mockReturnValueOnce(of(board([[task('a')]], [task('old')], [], 2)))
        .mockReturnValueOnce(of(board([[task('b')]], [task('old')], [], 2)));

      const result = await client.fetchBoard('project-1');

      expect(http.request).toHaveBeenCalledTimes(2);
      expect(http.request).toHaveBeenNthCalledWith(2, expect.objectContaining({ params: { page: 2, limit: 100 } }));
      expect(result.open.map((t) => t.id)).toEqual(['a', 'b']);
      expect(result.archived.map((t) => t.id)).toEqual(['old']);
    });

    it('authenticates with the API key against the configured URL', async () => {
      http.request.mockReturnValue(of(board([], [], [])));

      await client.fetchBoard('project-1');

      expect(http.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'http://kaneo.test/api/task/tasks/project-1',
          headers: { Authorization: 'Bearer secret' },
        }),
      );
    });
  });

  describe('createTask', () => {
    it('posts the task to the project', async () => {
      http.request.mockReturnValue(of({ data: {} }));
      const payload = {
        title: 'Pagar',
        description: '- [ ] one',
        priority: 'low',
        status: 'to-do',
        dueDate: '2026-12-02T05:00:00.000Z',
      };

      await client.createTask('project-1', payload);

      expect(http.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST', url: 'http://kaneo.test/api/task/project-1', data: payload }),
      );
    });
  });

  it('wraps a failed request, keeping the status and never the API key', async () => {
    http.request.mockReturnValue(
      throwError(() => Object.assign(new Error('Forbidden'), { response: { status: 403 } })),
    );

    const failure = await client.createTask('project-1', {} as never).catch((error) => error);

    expect(failure).toBeInstanceOf(RoutineSourceException);
    expect(failure.context).toEqual({ method: 'POST', path: '/task/project-1', status: 403 });
    expect(JSON.stringify(failure.format())).not.toContain('secret');
  });
});
