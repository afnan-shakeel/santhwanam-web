export interface Area {
  areaId: string;
  areaCode: string;
  areaName: string;
  forumId: string;
  adminUserId: string;
  establishedDate: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAreaRequest {
  forumId: string;
  areaCode: string;
  areaName: string;
  adminUserId: string;
  establishedDate: string;
}

export interface UpdateAreaRequest {
  areaName?: string;
  establishedDate?: string;
}
