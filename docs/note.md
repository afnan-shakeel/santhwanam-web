# Member Add & Edit - Frontend Implementation Guide

## Overview
Member registration is a **3-step workflow** with draft-save capability at each step:
1. **Personal Details** - Member information
2. **Nominees** - At least 1 nominee required
3. **Documents & Payment** - Supporting documents and registration payment

---

## QUERY & VIEW ENDPOINTS

### Get Member Details
```
GET /api/members/:memberId
```
**When to use:**
- ✅ Loading member details page
- ✅ Editing existing draft member - fetch current data to pre-fill form
- ✅ Viewing submitted/approved member (read-only)

**UI Flow:**
```
User clicks "View" or "Edit" on member
→ GET /api/members/{memberId}
→ Pre-populate form with returned data
```

**Returns:**
- Complete member information
- `registrationStatus`: Draft, PendingApproval, Approved, Rejected
- `registrationStep`: PersonalDetails, Nominees, Documents, Completed
- `memberStatus`: Active, Frozen, Suspended, Closed, Deceased (for approved members)

---

### List All Members (Basic)
```
GET /api/members?page=1&limit=20&registrationStatus=Draft&unitId=xxx
```
**When to use:**
- ✅ Simple member listing with basic filters
- ✅ Supports query parameters for filtering

**Query Parameters:**
- `registrationStatus`: Draft, PendingApproval, Approved, Rejected
- `memberStatus`: Active, Frozen, Suspended, Closed, Deceased
- `unitId`, `agentId`, `areaId`, `forumId`, `tierId`: Filter by relationships
- `searchQuery`: Simple text search
- `page`: Page number (default 1)
- `limit`: Items per page (default 20, max 100)

---

### Search Members (Advanced)
```
POST /api/members/search
```
**When to use:**
- ✅ Advanced search with complex filters
- ✅ Multi-field search with operators
- ✅ For member listing pages with rich filtering
- ✅ See separate "member_listing_page.md" doc for full search details

**Request Body Example:**
```json
{
  "searchTerm": "John",
  "searchFields": ["firstName", "lastName", "memberCode"],
  "filters": [
    { "field": "registrationStatus", "operator": "equals", "value": "Approved" },
    { "field": "unitId", "operator": "equals", "value": "unit-uuid" }
  ],
  "sortBy": "createdAt",
  "sortOrder": "desc",
  "page": 1,
  "pageSize": 20
}
```

---

### Get Membership Tiers (for dropdown)
```
GET /api/membership/tiers?activeOnly=true
```
**When to use:**
- ✅ Populating "Membership Tier" dropdown in registration form
- ✅ Use `activeOnly=true` to show only active tiers

**UI Flow:**
```
Page load → GET /api/membership/tiers?activeOnly=true
→ Populate tier dropdown
```

---

## STEP 1: Personal Details

### Endpoints & UI Cases

#### 1. Create New Member (Start Registration)
```
POST /api/members/register
```
**When to use:**
- ✅ Initial "Add Member" button click - creating a completely new member
- ✅ First time saving ANY data in the registration form
- ✅ Returns `memberId` which you MUST store for subsequent API calls

**UI Flow:**
```
User clicks "Add Member" → Fill initial form → Click "Save" or "Continue"
→ POST /api/members/register → Get memberId → Store in state
```

---

#### 2. Update Draft Member (Save Changes)
```
PATCH /api/members/:memberId/draft/personal-details
```
**When to use:**
- ✅ Editing an existing draft member (when you already have `memberId`)
- ✅ Auto-save functionality while user is editing
- ✅ "Save as Draft" button - saving partial/incomplete data
- ✅ User goes back to Step 1 to modify details before submission

**UI Flow:**
```
Edit existing draft → Modify any field → Click "Save as Draft" or auto-save
→ PATCH /api/members/{memberId}/draft/personal-details
```

---

#### 3. Complete Personal Details Step
```
POST /api/members/:memberId/complete/personal-details
```
**When to use:**
- ✅ "Continue to Next Step" button - validates ALL required fields are filled
- ✅ Moves registration to Step 2 (Nominees)
- ✅ Marks Step 1 as complete in `registrationStep` field

**UI Flow:**
```
All required fields filled → Click "Continue" button
→ POST /api/members/{memberId}/complete/personal-details
→ Navigate to Step 2 (Nominees)
```

**Important Notes:**
- This endpoint validates that ALL required fields exist
- If validation fails, returns 400 error with specific message
- On success, updates `registrationStep` to indicate Step 1 complete

### Request Payload

#### Start Registration (Full data required)
```json
{
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "contactNumber": "+919876543210",
  "alternateContactNumber": "+919876543211",
  "email": "john@example.com",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001",
  "country": "India",
  "tierId": "tier-uuid",
  "unitId": "unit-uuid",
  "agentId": "agent-uuid"
}
```

#### Save as Draft (Partial data allowed)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "email": "john@example.com"
}
```

### Validation Rules
- ✅ All fields required for step completion
- ✅ Age >= 18 years old (validates birthdate)
- ✅ Contact number: 10-20 digits
- ✅ Email: valid format (optional)
- ✅ Tier must exist and be active
- ✅ Unit and Agent must be valid UUIDs
- ❌ Cannot save draft with invalid tier

### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| First Name | Text | ✓ | Min 2, Max 100 chars |
| Middle Name | Text | - | Max 100 chars |
| Last Name | Text | ✓ | Min 2, Max 100 chars |
| Date of Birth | Date | ✓ | Age >= 18 validation |
| Gender | Dropdown | ✓ | Male, Female, Other |
| Contact Number | Phone | ✓ | 10-20 digits |
| Alt Contact | Phone | - | 10-20 digits |
| Email | Email | - | Valid format |
| Address Line 1 | Text | ✓ | Max 255 chars |
| Address Line 2 | Text | - | Max 255 chars |
| City | Text | ✓ | Max 100 chars |
| State | Text | ✓ | Max 100 chars |
| Postal Code | Text | ✓ | Max 20 chars |
| Country | Text | ✓ | Max 100 chars |
| Tier | Dropdown | ✓ | Fetch from API |
| Unit | Dropdown | ✓ | Fetch from API |
| Agent | Dropdown | ✓ | Fetch from API |

### UI States

#### New Member Flow
```
1. Click "Add Member" button
   ↓
2. Display empty form with required field indicators
   ↓
3. User fills in details
   ↓
4. Show two buttons:
   - "Save as Draft" (saves partial data)
   - "Continue to Next Step" (validates all fields)
```

#### Edit Draft Member
```
1. Click "Edit" on draft member
   ↓
2. Fetch member details (GET /api/members/:memberId)
   ↓
3. Pre-populate form with existing data
   ↓
4. User can modify any field
   ↓
5. Show same save/continue buttons
```

### Response
```json
{
  "memberId": "member-uuid",
  "memberCode": "MEM-001",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "registrationStatus": "Draft",
  "registrationStep": "PersonalDetails",
  "createdAt": "2025-12-15T10:00:00Z"
}
```

---

## STEP 2: Nominees

### Endpoints & UI Cases

#### 1. Add New Nominee
```
POST /api/members/:memberId/nominees
```
**When to use:**
- ✅ "Add Nominee" button click - creating first or additional nominee
- ✅ Every time user submits a new nominee form
- ✅ Returns `nomineeId` for the created nominee

**UI Flow:**
```
Step 2 page → Click "Add Nominee" → Fill nominee form → Click "Save Nominee"
→ POST /api/members/{memberId}/nominees → Refresh nominee list
```

---

#### 2. List All Nominees
```
GET /api/members/:memberId/nominees
```
**When to use:**
- ✅ Loading Step 2 page - show existing nominees
- ✅ After adding/updating/deleting a nominee - refresh the list
- ✅ Returns array of all nominees (including soft-deleted: false)

**UI Flow:**
```
Navigate to Step 2 → GET /api/members/{memberId}/nominees
→ Display nominees in table/cards
```

---

#### 3. Update Existing Nominee
```
PATCH /api/members/:memberId/nominees/:nomineeId
```
**When to use:**
- ✅ "Edit" button on nominee row - modifying existing nominee
- ✅ Allows partial updates (only send changed fields)

**UI Flow:**
```
Click "Edit" on nominee → Pre-fill form → Modify fields → Click "Update"
→ PATCH /api/members/{memberId}/nominees/{nomineeId} → Refresh list
```

---

#### 4. Remove Nominee
```
DELETE /api/members/:memberId/nominees/:nomineeId
```
**When to use:**
- ✅ "Delete" button on nominee row
- ⚠️ **Cannot delete if it's the only nominee** (validation enforced)
- ✅ Soft delete (sets `isActive: false`)

**UI Flow:**
```
Click "Delete" → Show confirmation modal → Confirm
→ DELETE /api/members/{memberId}/nominees/{nomineeId} → Refresh list
```

**Business Rule:**
- UI should disable delete button if nominee count = 1
- Show tooltip: "At least 1 nominee required"

---

#### 5. Complete Nominees Step
```
POST /api/members/:memberId/complete/nominees
```
**When to use:**
- ✅ "Continue to Documents & Payment" button
- ✅ Validates at least 1 active nominee exists
- ✅ Moves registration to Step 3

**UI Flow:**
```
At least 1 nominee added → Click "Continue"
→ POST /api/members/{memberId}/complete/nominees
→ Navigate to Step 3 (Documents & Payment)
```

**Validation:**
- Ensures at least 1 nominee exists and is active
- Returns 400 if no nominees found

### Request Payload

#### Add Nominee (All required)
```json
{
  "name": "Jane Doe",
  "relationType": "Spouse",
  "dateOfBirth": "1992-08-20",
  "contactNumber": "+919876543220",
  "alternateContactNumber": "+919876543221",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001",
  "country": "India",
  "idProofType": "NationalID",
  "idProofNumber": "123456789"
}
```

#### Update Nominee (Partial allowed)
```json
{
  "name": "Jane Doe",
  "contactNumber": "+919876543220",
  "idProofNumber": "123456789"
}
```

### Validation Rules
- ✅ Minimum 1 nominee required
- ✅ Can have multiple nominees
- ✅ Name: 2-255 chars
- ✅ Contact: 10-20 digits
- ✅ Cannot remove only nominee
- ✅ Cannot add after submission

### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | ✓ | Min 2, Max 255 |
| Relation | Dropdown | ✓ | Father, Mother, Spouse, etc |
| Date of Birth | Date | ✓ | Any age allowed |
| Contact Number | Phone | ✓ | 10-20 digits |
| Alt Contact | Phone | - | 10-20 digits |
| Address Line 1 | Text | ✓ | Max 255 |
| Address Line 2 | Text | - | Max 255 |
| City | Text | ✓ | Max 100 |
| State | Text | ✓ | Max 100 |
| Postal Code | Text | ✓ | Max 20 |
| Country | Text | ✓ | Max 100 |
| ID Proof Type | Dropdown | ✓ | NationalID, Passport, etc |
| ID Proof Number | Text | ✓ | Max 100 |

### UI States

#### Add Nominee
```
1. Display nominee list (initially empty)
2. Show "Add Nominee" button
3. Click button → Show nominee form
4. Fill details
5. Submit → Add to list
6. Show "Add Another Nominee" option
7. After minimum 1 added → Show "Continue" button
```

#### Edit Nominee
```
1. Click "Edit" on nominee row
2. Show form with pre-filled data
3. User modifies fields
4. Submit to update
5. Update list
```

#### Delete Nominee
```
1. Show "Delete" button on each nominee
2. Check: If last nominee → disable with tooltip "At least 1 nominee required"
3. If allowed → Show confirmation modal
4. Delete → Update list
```

### Relation Types
```
Father, Mother, Spouse, Son, Daughter, Brother, Sister, Other
```

### ID Proof Types
```
NationalID, Passport, DrivingLicense, VoterID, Other
```

---

## STEP 3: Documents & Payment

### Endpoints & UI Cases

#### 1. Upload Document
```
POST /api/members/:memberId/documents
```
**When to use:**
- ✅ "Upload Document" button - add member or nominee documents
- ✅ Each upload creates a new document record
- ✅ Can upload for member (`nomineeId` omitted) or specific nominee (`nomineeId` included)

**UI Flow:**
```
Step 3 page → Click "Upload Document" → Select file + fill metadata
→ Upload file to storage (get fileUrl) → POST /api/members/{memberId}/documents
→ Refresh document list
```

**Important:**
- You must upload the file to your storage service FIRST
- Then send the `fileUrl` in this API call
- Backend stores metadata, not the actual file

---

#### 2. List Documents
```
GET /api/members/:memberId/documents
```
**When to use:**
- ✅ Loading Step 3 page - show existing documents
- ✅ After uploading/deleting a document - refresh the list
- ✅ Returns all documents for member AND all nominees

**UI Flow:**
```
Navigate to Step 3 → GET /api/members/{memberId}/documents
→ Display documents in table grouped by member/nominee
```

---

#### 3. Remove Document
```
DELETE /api/members/:memberId/documents/:documentId
```
**When to use:**
- ✅ "Delete" button on document row
- ✅ Soft delete (sets `isActive: false`)
- ⚠️ Cannot delete after registration submitted

**UI Flow:**
```
Click "Delete" on document → Show confirmation → Confirm
→ DELETE /api/members/{memberId}/documents/{documentId} → Refresh list
```

---

#### 4. Record Registration Payment
```
POST /api/members/:memberId/payment
```
**When to use:**
- ✅ "Record Payment" button - save payment details
- ✅ Only called ONCE per member (creates payment record)
- ⚠️ If payment already exists, use GET to retrieve (no update endpoint)

**UI Flow:**
```
Fill payment form (fees, mode, reference) → Click "Record Payment"
→ POST /api/members/{memberId}/payment → Show payment confirmation
```

**Note:**
- `collectedBy` should be current user ID
- `collectionDate` defaults to today but can be backdated
- Payment is required before final submission

---

#### 5. Get Payment Details
```
GET /api/members/:memberId/payment
```
**When to use:**
- ✅ Loading Step 3 page - check if payment already recorded
- ✅ Display payment summary
- ✅ Returns null if no payment exists yet

**UI Flow:**
```
Navigate to Step 3 → GET /api/members/{memberId}/payment
→ If exists: Show payment summary (read-only)
→ If null: Show payment form (allow recording)
```

---

#### 6. Submit Registration
```
POST /api/members/:memberId/submit
```
**When to use:**
- ✅ Final "Submit Registration" button
- ✅ Validates ALL steps complete (personal details, nominees, payment)
- ✅ Creates approval request and changes status to "PendingApproval"
- ✅ **This is the final action** - no further edits allowed

**UI Flow:**
```
All steps complete → Click "Submit Registration"
→ POST /api/members/{memberId}/submit
→ Show success message with member code
→ Redirect to member details or list page
```

**Validation Checks:**
1. Personal details step completed
2. At least 1 active nominee exists
3. Payment recorded
4. Member is in Draft status

**After Submission:**
- `registrationStatus` → "PendingApproval"
- Approval request created
- Cannot modify member, nominees, or documents
- Awaits approval workflow completion

### Document Upload

#### Request Payload
```json
{
  "nomineeId": "nominee-uuid-optional",
  "documentType": "NationalID",
  "documentCategory": "MemberIdentity",
  "documentName": "National ID - Front",
  "fileUrl": "https://storage.example.com/doc-123.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "expiryDate": "2030-12-31"
}
```

#### Validation Rules
- ✅ File size: Max 5MB
- ✅ Allowed MIME types: PDF, JPEG, PNG
- ✅ Document types: NationalID, Passport, DrivingLicense, BirthCertificate, etc
- ✅ Categories: MemberIdentity, MemberAddress, MemberPhoto, NomineeProof, Other
- ✅ Can upload for member or specific nominee
- ✅ Expiry date optional (for documents that expire)

#### Document Types
```
NationalID, Passport, DrivingLicense, BirthCertificate, ResidenceCard,
AddressProof_UtilityBill, AddressProof_BankStatement, AddressProof_RentalAgreement,
MemberPhoto, NomineeIDProof, Other
```

#### Categories
```
MemberIdentity, MemberAddress, MemberPhoto, NomineeProof, Other
```

### Payment Recording

#### Request Payload
```json
{
  "registrationFee": 5000,
  "advanceDeposit": 10000,
  "collectedBy": "user-uuid",
  "collectionDate": "2025-12-15",
  "collectionMode": "BankTransfer",
  "referenceNumber": "TXN-12345"
}
```

#### Validation Rules
- ✅ Registration fee: Positive number
- ✅ Advance deposit: Positive number
- ✅ Collection mode: Cash, BankTransfer, Cheque, Online
- ✅ Reference number optional (for tracking)

### UI States

#### Documents Tab
```
1. Display document list with:
   - Document type
   - Category
   - File name
   - Upload date
   - Expiry date (if applicable)
   - Delete button

2. Show "Upload Document" button
3. Click → Show upload form
4. Fill details + select file
5. Upload → Add to list
6. After documents uploaded → Show payment section
```

#### Payment Tab
```
1. Show payment form with:
   - Registration Fee (input)
   - Advance Deposit (input)
   - Collection Date (date picker)
   - Collection Mode (dropdown)
   - Reference Number (optional)

2. Show payment summary:
   - Total Amount = Fee + Deposit

3. After payment recorded → Show "Submit Registration" button
```

### Complete Registration

#### Endpoint
```
POST /api/members/:memberId/submit
```

#### Validation Before Submission
- ✅ All 3 steps completed
- ✅ At least 1 nominee added
- ✅ At least 1 document uploaded
- ✅ Payment recorded
- ✅ No pending form errors

#### Response
```json
{
  "memberId": "member-uuid",
  "memberCode": "MEM-001",
  "registrationStatus": "Submitted",
  "approvalRequestId": "request-uuid",
  "submittedAt": "2025-12-15T15:00:00Z"
}
```

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────┐
│        MEMBER ADD/EDIT - COMPLETE FLOW              │
├─────────────────────────────────────────────────────┤

1. START → Click "Add Member"
   ├─ Fetch tiers, units, agents (dropdown options)
   └─ Display empty form

2. STEP 1: PERSONAL DETAILS
   ├─ Fill form
   ├─ "Save as Draft" → Save partial data
   └─ "Continue" → Validate all + Move to Step 2

3. STEP 2: NOMINEES
   ├─ Add at least 1 nominee
   ├─ Can edit/delete nominees
   └─ "Continue" → Move to Step 3

4. STEP 3: DOCUMENTS & PAYMENT
   ├─ Upload required documents
   ├─ Record payment details
   └─ "Submit" → Create approval request

5. SUCCESS
   ├─ Show registration code (MEM-001)
   ├─ Show approval status (Submitted)
   └─ Redirect to member details page
```

---

## API Error Responses

### 400 Bad Request
```json
{
  "message": "Member must be at least 18 years old"
}
```

```json
{
  "message": "Invalid or inactive membership tier"
}
```

```json
{
  "message": "Cannot remove the only nominee (at least 1 required)"
}
```

```json
{
  "message": "Cannot add nominees after submission"
}
```

### 404 Not Found
```json
{
  "message": "Member not found"
}
```

---

## UI/UX Best Practices

### Form States
- ✅ Show progress indicators (Step 1/3, 2/3, 3/3)
- ✅ Disable "Continue" until required fields filled
- ✅ Highlight missing required fields in red
- ✅ Show validation errors inline

### User Feedback
- ✅ Toast notifications for save/update success
- ✅ Confirmation modals for delete actions
- ✅ Show member code once created

### Navigation
- ✅ Allow "Back" to previous step (within same session)
- ✅ Prevent direct jump between steps
- ✅ Show breadcrumb: Step 1 → Step 2 → Step 3
- ✅ Allow edit of previous steps before submission

### Mobile Responsive
- ✅ Single column layout on mobile
- ✅ Full-width inputs and buttons
- ✅ Collapsible section headers
- ✅ Touch-friendly file upload

---

## API ENDPOINT DECISION TREE

### **SCENARIO: User Clicks "Add Member"**
```
1. Pre-load dropdown data:
   GET /api/membership/tiers?activeOnly=true
   GET /api/organization-bodies/units (if available)
   GET /api/agents (if available)

2. Show empty Step 1 form

3. User fills data + clicks "Save" or "Continue":
   → POST /api/members/register
   → Store memberId in component state
   → If "Continue" → POST /api/members/{memberId}/complete/personal-details
   → Navigate to Step 2
```

---

### **SCENARIO: User Clicks "Edit" on Draft Member**
```
1. Get memberId from row/route
   → GET /api/members/{memberId}
   → Check registrationStatus === "Draft"

2. Pre-fill Step 1 form with returned data

3. User modifies fields + clicks "Save as Draft":
   → PATCH /api/members/{memberId}/draft/personal-details
   → Only send changed fields

4. User clicks "Continue":
   → POST /api/members/{memberId}/complete/personal-details
   → Navigate to Step 2
```

---

### **SCENARIO: Step 2 - Managing Nominees**
```
1. Load existing nominees:
   → GET /api/members/{memberId}/nominees

2. User clicks "Add Nominee":
   → Show nominee form
   → User fills + submits
   → POST /api/members/{memberId}/nominees
   → Refresh: GET /api/members/{memberId}/nominees

3. User clicks "Edit" on nominee row:
   → Pre-fill form with nominee data
   → User modifies + submits
   → PATCH /api/members/{memberId}/nominees/{nomineeId}
   → Refresh list

4. User clicks "Delete" on nominee:
   → Check: if nomineeCount > 1
   → Show confirmation modal
   → DELETE /api/members/{memberId}/nominees/{nomineeId}
   → Refresh list

5. User clicks "Continue to Documents":
   → POST /api/members/{memberId}/complete/nominees
   → Navigate to Step 3
```

---

### **SCENARIO: Step 3 - Documents & Payment**
```
1. Load existing data:
   → GET /api/members/{memberId}/documents
   → GET /api/members/{memberId}/payment

2. User uploads document:
   → Upload file to storage service → get fileUrl
   → POST /api/members/{memberId}/documents (with fileUrl)
   → Refresh: GET /api/members/{memberId}/documents

3. User deletes document:
   → DELETE /api/members/{memberId}/documents/{documentId}
   → Refresh list

4. User records payment (if not exists):
   → Fill payment form
   → POST /api/members/{memberId}/payment
   → Show payment summary (read-only)

5. User clicks "Submit Registration":
   → Validate: all steps complete
   → POST /api/members/{memberId}/submit
   → Show success with memberCode
   → Redirect to member details or list
```

---

### **SCENARIO: Viewing Submitted/Approved Member**
```
1. User clicks "View" on member:
   → GET /api/members/{memberId}
   → Check registrationStatus

2. If "PendingApproval" or "Approved":
   → Show read-only view
   → Display all data (personal, nominees, documents, payment)
   → Show approval status/history

3. Cannot modify:
   → All edit buttons disabled
   → Show info message: "Member submitted for approval"
```

---

### **SCENARIO: Listing/Searching Members**
```
SIMPLE LIST (with basic filters):
→ GET /api/members?registrationStatus=Draft&page=1&limit=20

ADVANCED SEARCH (complex filters):
→ POST /api/members/search
{
  "searchTerm": "keyword",
  "filters": [...],
  "sortBy": "createdAt",
  "page": 1,
  "pageSize": 20
}
```

---

## ENDPOINT SUMMARY TABLE

| Action | Method | Endpoint | When to Use |
|--------|--------|----------|-------------|
| **Create new member** | POST | `/api/members/register` | First save of new registration |
| **Update draft** | PATCH | `/api/members/:memberId/draft/personal-details` | Edit existing draft, auto-save |
| **Complete Step 1** | POST | `/api/members/:memberId/complete/personal-details` | "Continue" to Step 2 |
| **Add nominee** | POST | `/api/members/:memberId/nominees` | Add new nominee |
| **List nominees** | GET | `/api/members/:memberId/nominees` | Load Step 2, refresh after changes |
| **Update nominee** | PATCH | `/api/members/:memberId/nominees/:nomineeId` | Edit existing nominee |
| **Delete nominee** | DELETE | `/api/members/:memberId/nominees/:nomineeId` | Remove nominee (if > 1) |
| **Complete Step 2** | POST | `/api/members/:memberId/complete/nominees` | "Continue" to Step 3 |
| **Upload document** | POST | `/api/members/:memberId/documents` | Add member/nominee document |
| **List documents** | GET | `/api/members/:memberId/documents` | Load Step 3, refresh after changes |
| **Delete document** | DELETE | `/api/members/:memberId/documents/:documentId` | Remove document |
| **Record payment** | POST | `/api/members/:memberId/payment` | Save payment details (once) |
| **Get payment** | GET | `/api/members/:memberId/payment` | Check if payment exists |
| **Submit registration** | POST | `/api/members/:memberId/submit` | Final submission - create approval |
| **Get member details** | GET | `/api/members/:memberId` | View/Edit - fetch current data |
| **List members (simple)** | GET | `/api/members?...params` | Basic member list with filters |
| **Search members** | POST | `/api/members/search` | Advanced search with complex filters |
| **Get tiers** | GET | `/api/membership/tiers?activeOnly=true` | Populate tier dropdown |

---

## Key Points for Implementation

1. **Session Management**: Store memberId in state after Step 1
2. **Draft Auto-Save**: Consider auto-save on blur for draft endpoint
3. **File Upload**: Handle file upload (base64 or multipart) before API call
4. **Dropdown Data**: Pre-fetch tiers, units, agents on page load
5. **Nominee List**: Refresh after add/edit/delete operations
6. **Payment Tracking**: Show total amount calculation
7. **Success Redirect**: After submission, show confirmation + redirect to details page
8. **Edit Mode**: Detect if editing vs creating based on memberId in URL
9. **Step Navigation**: Only allow forward navigation after step completion
10. **Read-Only Mode**: Disable all edits if registrationStatus !== "Draft"



## open api snippet

```
    "/api/members/register": {
      "post": {
        "tags": ["Members - Registration"],
        "summary": "Start member registration (Step 1: Personal Details)",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["firstName", "lastName", "dateOfBirth", "gender", "contactNumber", "addressLine1", "city", "state", "postalCode", "country", "tierId", "unitId", "agentId"],
                "properties": {
                  "firstName": { "type": "string" },
                  "middleName": { "type": "string" },
                  "lastName": { "type": "string" },
                  "dateOfBirth": { "type": "string", "format": "date" },
                  "gender": { "type": "string", "enum": ["Male", "Female", "Other"] },
                  "contactNumber": { "type": "string" },
                  "alternateContactNumber": { "type": "string" },
                  "email": { "type": "string", "format": "email" },
                  "addressLine1": { "type": "string" },
                  "addressLine2": { "type": "string" },
                  "city": { "type": "string" },
                  "state": { "type": "string" },
                  "postalCode": { "type": "string" },
                  "country": { "type": "string" },
                  "tierId": { "type": "string", "format": "uuid" },
                  "unitId": { "type": "string", "format": "uuid" },
                  "agentId": { "type": "string", "format": "uuid" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Member registration started",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "memberId": { "type": "string", "format": "uuid" },
                    "memberCode": { "type": "string" },
                    "currentStep": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/members/{memberId}": {
      "get": {
        "tags": ["Members - Queries"],
        "summary": "Get member details",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": {
            "description": "Member details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "memberId": { "type": "string", "format": "uuid" },
                    "memberCode": { "type": "string" },
                    "firstName": { "type": "string" },
                    "lastName": { "type": "string" },
                    "registrationStatus": { "type": "string" },
                    "memberStatus": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/members": {
      "get": {
        "tags": ["Members - Queries"],
        "summary": "List members with filters",
        "parameters": [
          { "name": "registrationStatus", "in": "query", "schema": { "type": "string", "enum": ["Draft", "PendingApproval", "Approved", "Rejected"] } },
          { "name": "memberStatus", "in": "query", "schema": { "type": "string", "enum": ["Active", "Frozen", "Suspended", "Closed", "Deceased"] } },
          { "name": "unitId", "in": "query", "schema": { "type": "string", "format": "uuid" } },
          { "name": "agentId", "in": "query", "schema": { "type": "string", "format": "uuid" } },
          { "name": "tierId", "in": "query", "schema": { "type": "string", "format": "uuid" } },
          { "name": "searchQuery", "in": "query", "schema": { "type": "string" } },
          { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
        ],
        "responses": {
          "200": {
            "description": "List of members",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": { "type": "array", "items": { "type": "object" } },
                    "total": { "type": "integer" },
                    "page": { "type": "integer" },
                    "limit": { "type": "integer" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/members/{memberId}/draft/personal-details": {
      "patch": {
        "tags": ["Members - Registration"],
        "summary": "Save personal details as draft",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "firstName": { "type": "string" },
                  "middleName": { "type": "string" },
                  "lastName": { "type": "string" },
                  "dateOfBirth": { "type": "string", "format": "date" },
                  "gender": { "type": "string", "enum": ["Male", "Female", "Other"] },
                  "contactNumber": { "type": "string" },
                  "email": { "type": "string", "format": "email" },
                  "addressLine1": { "type": "string" },
                  "city": { "type": "string" },
                  "state": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Draft saved successfully" }
        }
      }
    },
    "/api/members/{memberId}/complete/personal-details": {
      "post": {
        "tags": ["Members - Registration"],
        "summary": "Complete personal details step",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": { "description": "Personal details step completed" }
        }
      }
    },
    "/api/members/{memberId}/nominees": {
      "post": {
        "tags": ["Members - Nominees"],
        "summary": "Add nominee (Step 2)",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name", "relationType", "dateOfBirth", "contactNumber", "addressLine1", "city", "state", "postalCode", "country", "idProofType", "idProofNumber"],
                "properties": {
                  "name": { "type": "string" },
                  "relationType": { "type": "string", "enum": ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"] },
                  "dateOfBirth": { "type": "string", "format": "date" },
                  "contactNumber": { "type": "string" },
                  "addressLine1": { "type": "string" },
                  "city": { "type": "string" },
                  "state": { "type": "string" },
                  "postalCode": { "type": "string" },
                  "country": { "type": "string" },
                  "idProofType": { "type": "string", "enum": ["NationalID", "Passport", "DrivingLicense", "VoterID", "Other"] },
                  "idProofNumber": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Nominee added",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "nomineeId": { "type": "string", "format": "uuid" }
                  }
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": ["Members - Nominees"],
        "summary": "Get all nominees for a member",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": {
            "description": "List of nominees",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "nomineeId": { "type": "string", "format": "uuid" },
                      "name": { "type": "string" },
                      "relationType": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/members/{memberId}/nominees/{nomineeId}": {
      "patch": {
        "tags": ["Members - Nominees"],
        "summary": "Update nominee",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          },
          {
            "name": "nomineeId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "contactNumber": { "type": "string" },
                  "addressLine1": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Nominee updated successfully" }
        }
      },
      "delete": {
        "tags": ["Members - Nominees"],
        "summary": "Remove nominee",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          },
          {
            "name": "nomineeId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": { "description": "Nominee removed successfully" }
        }
      }
    },
    "/api/members/{memberId}/complete/nominees": {
      "post": {
        "tags": ["Members - Nominees"],
        "summary": "Complete nominees step",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": { "description": "Nominees step completed" }
        }
      }
    },
    "/api/members/{memberId}/documents": {
      "post": {
        "tags": ["Members - Documents"],
        "summary": "Upload document (Step 3)",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["documentType", "documentCategory", "documentName", "fileUrl", "fileSize", "mimeType"],
                "properties": {
                  "nomineeId": { "type": "string", "format": "uuid" },
                  "documentType": { "type": "string", "enum": ["NationalID", "Passport", "MemberPhoto", "Other"] },
                  "documentCategory": { "type": "string", "enum": ["MemberIdentity", "MemberAddress", "MemberPhoto", "NomineeProof", "Other"] },
                  "documentName": { "type": "string" },
                  "fileUrl": { "type": "string", "format": "uri" },
                  "fileSize": { "type": "integer" },
                  "mimeType": { "type": "string", "enum": ["application/pdf", "image/jpeg", "image/png"] }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Document uploaded",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "documentId": { "type": "string", "format": "uuid" }
                  }
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": ["Members - Documents"],
        "summary": "Get all documents for a member",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": {
            "description": "List of documents",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "documentId": { "type": "string", "format": "uuid" },
                      "documentType": { "type": "string" },
                      "documentName": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/members/{memberId}/documents/{documentId}": {
      "delete": {
        "tags": ["Members - Documents"],
        "summary": "Remove document",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          },
          {
            "name": "documentId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": { "description": "Document removed successfully" }
        }
      }
    },
    "/api/members/{memberId}/payment": {
      "post": {
        "tags": ["Members - Payment"],
        "summary": "Record registration payment (Step 3)",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["registrationFee", "advanceDeposit", "collectedBy", "collectionDate", "collectionMode"],
                "properties": {
                  "registrationFee": { "type": "number" },
                  "advanceDeposit": { "type": "number" },
                  "collectedBy": { "type": "string", "format": "uuid" },
                  "collectionDate": { "type": "string", "format": "date" },
                  "collectionMode": { "type": "string", "enum": ["Cash", "BankTransfer", "Cheque", "Online"] },
                  "referenceNumber": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "Payment recorded successfully" }
        }
      },
      "get": {
        "tags": ["Members - Payment"],
        "summary": "Get payment details",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": {
            "description": "Payment details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "registrationFee": { "type": "number" },
                    "advanceDeposit": { "type": "number" },
                    "collectionMode": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/members/{memberId}/submit": {
      "post": {
        "tags": ["Members - Registration"],
        "summary": "Submit registration for approval",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": { "description": "Registration submitted for approval" }
        }
      }
    },
    "/api/members/{memberId}/suspend": {
      "post": {
        "tags": ["Members - Management"],
        "summary": "Suspend a member",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["reason", "suspendedBy"],
                "properties": {
                  "reason": { "type": "string" },
                  "suspendedBy": { "type": "string", "format": "uuid" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Member suspended successfully" }
        }
      }
    },
    "/api/members/{memberId}/reactivate": {
      "post": {
        "tags": ["Members - Management"],
        "summary": "Reactivate a suspended member",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["reactivatedBy"],
                "properties": {
                  "reactivatedBy": { "type": "string", "format": "uuid" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Member reactivated successfully" }
        }
      }
    },
    "/api/members/{memberId}/close": {
      "post": {
        "tags": ["Members - Management"],
        "summary": "Close member account",
        "parameters": [
          {
            "name": "memberId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["closureReason"],
                "properties": {
                  "closureReason": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Member account closed successfully" }
        }
      }
    },

```