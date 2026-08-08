import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionKeyResultMapper } from './notion-key-result.mapper';

describe('NotionKeyResultMapper', () => {
  const OBJECTIVE_PROPERTY = 'Objetivo';
  const KEY_RESULT_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  const OBJECTIVE_ID = '0b8a6501-1c1f-4b8e-8b64-7a1a2f3c4d5e';

  const buildPage = (objectiveRelation: { id: string }[]): PageObjectResponse =>
    ({
      id: KEY_RESULT_ID,
      last_edited_time: '2026-08-07T10:00:00.000Z',
      properties: {
        Name: { title: [{ plain_text: 'Ship the audit' }] },
        [OBJECTIVE_PROPERTY]: { relation: objectiveRelation },
      },
    }) as unknown as PageObjectResponse;

  const toDomain = (page: PageObjectResponse) =>
    NotionKeyResultMapper.toDomain({ keyResult: page }, { objectiveProperty: OBJECTIVE_PROPERTY });

  it('maps a key result linked to an objective', () => {
    const keyResult = toDomain(buildPage([{ id: OBJECTIVE_ID }]));

    expect(keyResult.id.value).toBe(KEY_RESULT_ID);
    expect(keyResult.title).toBe('Ship the audit');
    expect(keyResult.objectiveId?.value).toBe(OBJECTIVE_ID);
    expect(keyResult.updatedAt.toISO()).toContain('2026-08-07');
  });

  // Regression: an unlinked key result used to reach Uuid.create(undefined) and
  // blow up the whole setup run, leaving the collection empty.
  it('maps a key result with no objective to a null objectiveId', () => {
    const keyResult = toDomain(buildPage([]));

    expect(keyResult.objectiveId).toBeNull();
  });

  it('tolerates a missing objective property entirely', () => {
    const page = {
      id: KEY_RESULT_ID,
      last_edited_time: '2026-08-07T10:00:00.000Z',
      properties: { Name: { title: [{ plain_text: 'Ship the audit' }] } },
    } as unknown as PageObjectResponse;

    expect(toDomain(page).objectiveId).toBeNull();
  });
});
