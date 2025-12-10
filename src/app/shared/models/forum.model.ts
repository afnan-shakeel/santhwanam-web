export interface Forum {
  forumId: string;
  forumName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
