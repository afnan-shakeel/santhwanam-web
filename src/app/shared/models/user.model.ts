export interface User {
  userId: string;
  externalAuthId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  userMetadata: any | null;
  createdAt: Date;
  lastSyncedAt: Date | null;
}
