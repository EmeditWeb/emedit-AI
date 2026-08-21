export type ClientNotificationType = "PROJECT_DELETED";

export interface ClientNotification {
  id: string;
  projectId: string;
  projectName: string;
  type: ClientNotificationType;
  createdAt: string;
  read: boolean;
}
