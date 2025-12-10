export interface Permission {
  permissionId: string;
  permissionName: string;
  description: string | null;
  module: string;
  action: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}
