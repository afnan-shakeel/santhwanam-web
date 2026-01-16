import { Agent } from "./agent.model";
import { Area } from "./area.model";
import { Forum } from "./forum.model";
import { Unit } from "./unit.model";
import { Wallet } from "./wallet.model";

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
  contributionAmount: number;
  deathBenefitAmount: number;
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
  sharePercentage?: number;
  createdAt?: string;
  updatedAt?: string;
  documents?: MemberDocument[];
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
  documentUrl?: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: string;
  uploadedAt?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
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
  totalAmount: number;
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

// Metadata Interfaces
export interface MetadataOption {
  value: string;
  label: string;
}

export interface MemberMetadata {
  documentTypes: MetadataOption[];
  documentCategories: MetadataOption[];
  collectionModes: MetadataOption[];
}

// ==================== MEMBER PROFILE ====================

export interface ProfileTier {
  tierId: string;
  tierName: string;
  deathBenefitAmount: number;
  contributionAmount: number;
}

export interface ProfileAgent {
  agentId: string;
  agentCode: string;
  fullName: string;
}

export interface ProfileUnit {
  unitId: string;
  unitName: string;
}

export interface ProfileArea {
  areaId: string;
  areaName: string;
}

export interface ProfileForum {
  forumId: string;
  forumName: string;
}

export interface ProfileWallet {
  walletId: string;
  currentBalance: number;
}

export interface ProfilePaymentCollector {
  userId: string;
  fullName: string;
}

export interface ProfileRegistrationPayment {
  registrationFee: number;
  advanceDeposit: number;
  totalAmount: number;
  collectionDate: string;
  paymentMethod: string;
  collectedBy: ProfilePaymentCollector;
}

export interface ProfileNomineeDocument {
  documentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  verified: boolean;
}

export interface ProfileNominee {
  nomineeId: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  relationship: string;
  contactNumber: string;
  idNumber: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  state: string;
  country: string;
  documents: ProfileNomineeDocument[];
}

export interface ProfileDocument {
  documentId: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
  category: string;
}

export interface MemberProfile {
  memberId: string;
  memberCode: string;
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  aadhaarNumber?: string;
  contactNumber: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  state: string;
  country: string;
  memberStatus: MemberStatus;
  registrationStatus: RegistrationStatus;
  registrationDate: string;
  tier: MemberTier;
  agent: Agent;
  unit: Unit;
  area: Area;
  forum: Forum;
  wallet: Wallet;
  registrationPayment: ProfileRegistrationPayment;
  nominees: Nominee[];
  documents: MemberDocument[];
  createdAt: string;
  registeredAt?: string;
}

export interface UpdateMemberProfileRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  contactNumber?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

// ==================== MEMBER SELF PROFILE ====================

/**
 * Member self profile - similar to MemberProfile but for logged-in member
 */
export interface MemberSelfProfile {
  memberId: string;
  memberCode: string;
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  idNumber?: string;
  aadhaarNumber?: string;
  contactNumber: string;
  alternateContactNumber?: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  postalCode: string;
  state: string;
  country: string;
  memberStatus: MemberStatus;
  registrationStatus: RegistrationStatus;
  registrationDate?: string;
  tier: MemberTier;
  agent: Agent;
  unit: Unit;
  area: Area;
  forum: Forum;
  wallet: Wallet;
  registrationPayment?: ProfileRegistrationPayment;
  nominees?: Nominee[];
  documents?: MemberDocument[];
  createdAt: string;
  registeredAt?: string;
}

/**
 * Limited fields that member can update themselves
 */
export interface UpdateMemberSelfProfileRequest {
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
