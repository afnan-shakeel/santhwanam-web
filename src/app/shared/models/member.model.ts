// Base Types
export type RegistrationStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
export type MemberStatus = 'Active' | 'Frozen' | 'Suspended' | 'Closed' | 'Deceased';
export type Gender = 'Male' | 'Female' | 'Other';
export type RegistrationStep = 'PersonalDetails' | 'Nominees' | 'DocumentsPayment' | 'Completed';
export type RelationType = 'Father' | 'Mother' | 'Spouse' | 'Son' | 'Daughter' | 'Brother' | 'Sister' | 'Other';
export type IdProofType = 'NationalID' | 'Passport' | 'DrivingLicense' | 'VoterID' | 'Other';
export type DocumentType = 
  | 'NationalID' 
  | 'Passport' 
  | 'DrivingLicense' 
  | 'BirthCertificate' 
  | 'ResidenceCard'
  | 'AddressProof_UtilityBill' 
  | 'AddressProof_BankStatement' 
  | 'AddressProof_RentalAgreement'
  | 'MemberPhoto' 
  | 'NomineeIDProof' 
  | 'Other';
export type DocumentCategory = 'MemberIdentity' | 'MemberAddress' | 'MemberPhoto' | 'NomineeProof' | 'Other';
export type CollectionMode = 'Cash' | 'BankTransfer' | 'Cheque' | 'Online';

// Lookup Interfaces
export interface MemberTier {
  tierId: string;
  tierCode: string;
  tierName: string;
  description?: string;
  registrationFee?: number;
  advanceDeposit?: number;
}

export interface MemberAgent {
  agentId: string;
  agentCode: string;
  firstName: string;
  lastName: string;
}

export interface MemberUnit {
  unitId: string;
  unitCode: string;
  unitName: string;
}

// Main Member Interface
export interface Member {
  memberId: string;
  memberCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  contactNumber: string;
  alternateContactNumber?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  tierId: string;
  unitId: string;
  agentId: string;
  registrationStatus: RegistrationStatus;
  memberStatus?: MemberStatus;
  registrationStep: RegistrationStep;
  tier?: MemberTier;
  agent?: MemberAgent;
  unit?: MemberUnit;
  createdAt: string;
  updatedAt?: string;
  registeredAt?: string;
}

// Registration Request/Response
export interface RegisterMemberRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  contactNumber: string;
  alternateContactNumber?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  tierId: string;
  unitId: string;
  agentId: string;
}

export interface UpdateDraftPersonalDetailsRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  contactNumber?: string;
  alternateContactNumber?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  tierId?: string;
  unitId?: string;
  agentId?: string;
}

export interface RegisterMemberResponse {
  memberId: string;
  memberCode: string;
  currentStep: RegistrationStep;
}

// Nominee Interfaces
export interface Nominee {
  nomineeId: string;
  memberId: string;
  name: string;
  relationType: RelationType;
  dateOfBirth: string;
  contactNumber: string;
  alternateContactNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  idProofType: IdProofType;
  idProofNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddNomineeRequest {
  name: string;
  relationType: RelationType;
  dateOfBirth: string;
  contactNumber: string;
  alternateContactNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  idProofType: IdProofType;
  idProofNumber: string;
}

export interface UpdateNomineeRequest {
  name?: string;
  relationType?: RelationType;
  dateOfBirth?: string;
  contactNumber?: string;
  alternateContactNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  idProofType?: IdProofType;
  idProofNumber?: string;
}

// Document Interfaces
export interface MemberDocument {
  documentId: string;
  memberId: string;
  nomineeId?: string;
  documentType: DocumentType;
  documentCategory: DocumentCategory;
  documentName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: string;
  uploadedAt?: string;
}

export interface UploadDocumentRequest {
  nomineeId?: string;
  documentType: DocumentType;
  documentCategory: DocumentCategory;
  documentName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: string;
}

// Payment Interfaces
export interface MemberPayment {
  paymentId?: string;
  memberId: string;
  registrationFee: number;
  advanceDeposit: number;
  collectedBy: string;
  collectionDate: string;
  collectionMode: CollectionMode;
  referenceNumber?: string;
  recordedAt?: string;
}

export interface RecordPaymentRequest {
  registrationFee: number;
  advanceDeposit: number;
  collectedBy: string;
  collectionDate: string;
  collectionMode: CollectionMode;
  referenceNumber?: string;
}

export interface SubmitRegistrationResponse {
  memberId: string;
  memberCode: string;
  registrationStatus: RegistrationStatus;
  approvalRequestId: string;
  submittedAt: string;
}
