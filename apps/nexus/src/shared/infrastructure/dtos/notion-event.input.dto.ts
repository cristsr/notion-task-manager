import { ObjectLiteral } from '@shared/domain/types';

export enum NotionEventType {
  PAGE_CREATED = 'page.created',
  PAGE_DELETED = 'page.deleted',
  PAGE_UNDELETED = 'page.undeleted',
  PAGE_PROPERTIES_UPDATED = 'page.properties_updated',
}

export class NotionEventInput {
  id: string;

  timestamp: string;

  workspace_id: string;

  subscription_id: string;

  integration_id: string;

  type: NotionEventType;

  authors: string[];

  accessible_by: object[];

  attempt_number: number;

  entity: {
    id: string;

    type: string;
  };

  data: ObjectLiteral & {
    parent?: {
      data_source_id?: string;
    };
  };
}
