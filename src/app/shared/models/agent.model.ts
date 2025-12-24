export interface Agent {
  agentId: string;
  agentCode: string;
  unitId: string;
  areaId: string;
  forumId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  contactNumber: string;
  alternateContactNumber?: string;
  email: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  joinedDate: string;
  registrationStatus: string;
  agentStatus: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterAgentRequest {
  unitId: string;
  areaId: string;
  forumId: string;
  agentCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  contactNumber: string;
  alternateContactNumber?: string;
  email: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  joinedDate: string;
}

export interface UpdateDraftRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  contactNumber?: string;
  alternateContactNumber?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface UpdateAgentRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  contactNumber?: string;
  alternateContactNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreateAgentRequest {
  agentCode: string;
  agentName: string;
}
