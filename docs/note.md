### Key Features
- User login with email and password
- Password reset request flow
- Password reset confirmation
- JWT-based session management
- Integration with local user database

### Base URL
```
/api/auth
```

---

## API Endpoints

### 1. Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticates a user with email and password. Returns access token, refresh token, and user information.

**Request Headers:**
```typescript
Content-Type: application/json
```

**Request Body:**
```typescript
{
  email: string;      // Valid email address
  password: string;   // Non-empty password
}
```

**Response (200 OK):**
```typescript
{
  accessToken: string | null;    // JWT access token
  refreshToken: string | null;   // JWT refresh token
  expiresAt: number | null;      // Unix timestamp (seconds) when token expires
  user: {
    userId: string;
    externalAuthId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    userMetadata: any | null;
    createdAt: Date;
    lastSyncedAt: Date | null;
  } | null;
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body (validation error)
- `401 Unauthorized`: Invalid credentials or authentication failed
- `500 Internal Server Error`: Server error

**Example Request:**
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Example Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1735689600,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "externalAuthId": "supabase-user-id-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "userMetadata": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastSyncedAt": null
  }
}
```

---

### 2. Request Password Reset

**Endpoint:** `POST /api/auth/reset-password/request`

**Description:** Initiates a password reset flow. Sends a password reset email to the user if the email exists in the system. For security, the response is the same whether the email exists or not.

**Request Headers:**
```typescript
Content-Type: application/json
```

**Request Body:**
```typescript
{
  email: string;  // Valid email address
}
```

**Response (200 OK):**
```typescript
{
  message: string;  // "If email exists, a reset link has been sent"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid email format
- `500 Internal Server Error`: Server error

**Business Logic:**
- The endpoint does not reveal whether an email exists in the system
- A password reset token is generated and stored (hashed) in the database
- Token expires after 1 hour
- Reset link is sent via email (handled by Supabase)
- Reset link format: `${APP_URL}/auth/reset-password?token=${token}`

**Example Request:**
```typescript
POST /api/auth/reset-password/request
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Example Response:**
```json
{
  "message": "If email exists, a reset link has been sent"
}
```

---

### 3. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Confirms password reset using a valid token and sets a new password.

**Request Headers:**
```typescript
Content-Type: application/json
```

**Request Body:**
```typescript
{
  token: string;        // Password reset token from email link
  newPassword: string;  // New password (min 8 characters, must meet strength requirements)
}
```

**Response (200 OK):**
```typescript
{
  message: string;  // "Password reset successful"
}
```

**Error Responses:**
- `400 Bad Request`: 
  - Invalid or expired token
  - Password does not meet strength requirements
  - Invalid request body (validation error)
- `500 Internal Server Error`: Server error

**Password Strength Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

**Business Logic:**
- Token is validated (not used, not expired)
- Password strength is validated
- Password is updated in Supabase
- Token is marked as used
- Token can only be used once

**Example Request:**
```typescript
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "NewSecurePassword123"
}
```

**Example Response:**
```json
{
  "message": "Password reset successful"
}
```

---

## Data Models

### Login Request
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

### Login Response
```typescript
interface LoginResponse {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: User | null;
}

interface User {
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
```

### Password Reset Request
```typescript
interface PasswordResetRequest {
  email: string;
}
```

### Password Reset Response
```typescript
interface PasswordResetResponse {
  message: string;
}
```

### Reset Password Request
```typescript
interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
```

### Reset Password Response
```typescript
interface ResetPasswordResponse {
  message: string;
}
```

### Error Response
```typescript
interface ErrorResponse {
  message: string;
  statusCode: number;
  error?: any;
}
```

---

## Business Logic

### Login Flow

1. **User submits credentials**
   - Frontend validates email format and password presence
   - Sends request to `/api/auth/login`

2. **Backend processing**
   - Validates request body (email format, password presence)
   - Authenticates with Supabase using `signInWithPassword`
   - Retrieves local user record using `externalAuthId` from Supabase user
   - Returns tokens and user information

3. **Frontend handling**
   - Stores access token and refresh token securely
   - Stores user information in application state
   - Sets up token refresh mechanism
   - Redirects to appropriate route based on user role/permissions

### Password Reset Flow

#### Step 1: Request Password Reset

1. **User requests reset**
   - User enters email address
   - Frontend validates email format
   - Sends request to `/api/auth/reset-password/request`

2. **Backend processing**
   - Finds user by email (if exists)
   - Generates secure random token (32 bytes, hex encoded)
   - Hashes token using SHA-256
   - Stores hashed token in database with 1-hour expiration
   - Sends password reset email via Supabase (contains reset link)

3. **Frontend handling**
   - Shows success message (same message regardless of email existence)
   - Instructs user to check email

#### Step 2: Reset Password

1. **User clicks reset link**
   - Link format: `/auth/reset-password?token=abc123...`
   - Frontend extracts token from URL query parameter
   - Displays password reset form

2. **User submits new password**
   - Frontend validates password strength
   - Sends request to `/api/auth/reset-password` with token and new password

3. **Backend processing**
   - Validates password strength (8+ chars, uppercase, lowercase, number)
   - Hashes provided token
   - Finds valid token record (not used, not expired)
   - Updates password in Supabase via admin API
   - Marks token as used

4. **Frontend handling**
   - Shows success message
   - Redirects to login page
   - User can now login with new password

### Token Management

- **Access Token**: Used for authenticating API requests
- **Refresh Token**: Used to obtain new access tokens when current one expires
- **Token Storage**: Store tokens securely (consider using httpOnly cookies or secure storage)
- **Token Expiration**: Check `expiresAt` timestamp to determine when to refresh
- **Token Refresh**: Implement automatic token refresh before expiration

---

## Validations

### Frontend Validations

#### Login Form
```typescript
// Email validation
- Required field
- Valid email format (RFC 5322 compliant)
- Example: user@example.com

// Password validation
- Required field
- Minimum 1 character (backend enforces this)
```

#### Password Reset Request Form
```typescript
// Email validation
- Required field
- Valid email format
```

#### Reset Password Form
```typescript
// Token validation
- Required field
- Non-empty string

// New Password validation
- Required field
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- Show real-time validation feedback
```

### Backend Validations (for reference)

#### Login Schema (Zod)
```typescript
{
  email: z.string().email(),
  password: z.string().min(1)
}
```

#### Password Reset Request Schema
```typescript
{
  email: z.string().email()
}
```

#### Reset Password Schema
```typescript
{
  token: z.string().min(1),
  newPassword: z.string().min(8)
}
```

**Additional Backend Password Validation:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
