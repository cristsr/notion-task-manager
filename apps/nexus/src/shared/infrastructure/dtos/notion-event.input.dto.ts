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

  accessible_by: Object[];

  attempt_number: number;

  entity: {
    id: string;

    type: string;
  };

  data: Record<any, any>;
}
