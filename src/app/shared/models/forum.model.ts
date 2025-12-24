export interface Forum {
  forumId: string;
  forumCode: string;
  forumName: string;
  adminUserId: string;
  establishedDate: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateForumRequest {
  forumCode: string;
  forumName: string;
  adminUserId: string;
  establishedDate: string;
}

export interface UpdateForumRequest {
  forumName?: string;
  establishedDate?: string;
}
