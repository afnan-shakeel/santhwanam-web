export interface Unit {
  unitId: string;
  unitCode: string;
  unitName: string;
  areaId: string;
  adminUserId: string;
  establishedDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUnitRequest {
  areaId: string;
  unitCode: string;
  unitName: string;
  adminUserId: string;
  establishedDate: string;
}

export interface UpdateUnitRequest {
  unitName?: string;
  establishedDate?: string;
}
