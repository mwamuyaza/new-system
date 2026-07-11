# University Hub Portal: System Architecture & Developer Documentation

Welcome to the **Developer & Integration Manual** for the University Hub Portal. This system is a full-stack academic registry platform designed to run in sandboxed and containerized environments (such as Cloud Run) behind a rigid port forwarding proxy. 

This document details the underlying technologies, data persistence layers, security authentication mechanisms, APIs, and manual configuration guidelines.

---

## 1. System Composition & Architecture

The application is structured as a full-stack monolithic application with a segregated React rendering front-end and a Node.js/Express back-end.

```
       [ Client-Side Render ] (Vite / React 18 / Tailwind / Lucide Icons)
                                  ⇅ (Web API Requests)
       [ Server-Side Engine ] (Node.js / Express TS / custom authentication)
                                  ⇅ (I/O Synchronization)
      [ JSON Database Store ] (Local filesystem file: university_data.json)
```

- **Frontend Client**: React 18, Vite, Lucide-react for system icons, Tailwind CSS for modern responsive utility design.
- **Backend Server**: Node.js v18/v20 with Express, TypeScript support compiled and bundled with `esbuild`.
- **Primary Data Layer**: Custom file-backed structured store (`/server/dbStore.ts`). 
- **Mail Pipeline**: SMTP / Resend API configuration with automatic debug/terminal console bypasses for sandboxed previews.

---

## 2. API Schema Definitions & Core Entities

All system database records and structures are declared and strictly typed under `src/types.ts` and synced with `server/dbStore.ts`.

### 2.1 Staff (Faculty) Entity
```typescript
interface Staff {
  id: number;
  userId: number; // Syncs with User record ID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  qualification: string;
  position: string;
  salary: number;
  staffId: string; // generated format: FAC-{YEAR}-{RANDOM}
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'PENDING_APPROVAL';
  profilePic?: string;
}
```

### 2.2 Student Entity
```typescript
interface Student {
  id: number;
  userId: number; // Syncs with User record ID
  firstName: string;
  lastName: string;
  studentId: string; // generated format: ST-{YEAR}-{RANDOM}
  email: string;
  phone: string;
  address: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'WITHDRAWN';
  classCohortId: number;
  adminApproved: boolean; // First key of Dual Approval
  lecturerApproved: boolean; // Second key of Dual Approval
  profilePic?: string;
}
```

---

## 3. Mandatory Email Verification & Authentication Flows

```
[ POST /api/auth/signup ]
      ↓
 Generates: user.isVerified = false
 Generates: user.verificationCode = 6-digit OTP
      ↓
 [ POST /api/auth/verify ] (Client submits OTP code)
      ↓
 Validates code -> Sets user.isVerified = true -> Generates Session Token
```

### 3.1 Sign Up / Self-Onboarding
Under self-onboarding endpoints (`/api/auth/signup` for Students, `/api/auth/signup-staff` for Lecturers), the database records a secondary authentication safeguard:
1. `user.isVerified` defaults to `false`.
2. `user.verificationCode` is populated with a random, high-entropy 6-digit numeric string.
3. The server triggers the `sendEmail` transport utility.

### 3.2 Verification & Resending Code
- **Endpoint**: `POST /api/auth/verify`
  - Body: `{ username, code }`
  - Validates code matches the database record, sets `isVerified` to `true`, saves the database, and issues a standard session token (`user-token-{role}-{userId}-{timestamp}`).
- **Endpoint**: `POST /api/auth/resend-code`
  - Body: `{ username }`
  - Re-generates a fresh 6-digit numeric OTP code and resends the email.

---

## 4. Double Approval Admissions System

Admitting students into cohorts utilizes a multi-step signature structure to prevent unilateral enrollments.

1. **Self-Onboard**: Account starts as `PENDING_APPROVAL` with `adminApproved = false`, `lecturerApproved = false`.
2. **Admin Signature**: When logged in as an Admin, hitting `PUT /api/students/:id/approve` toggles `adminApproved = true`. If the assigned cohort Lecturer has already signed, the student status instantly changes to `ACTIVE`.
3. **Faculty Signature**: When logged in as the cohort's assigned Instructor, approving the student via the Lecturer console toggles `lecturerApproved = true`. If the administrator has already approved, the system promotes the student status to `ACTIVE`.

---

## 5. Security & Forgot Password Workflows

Password recovery follows standard high-integrity cryptographic codes similar to verification bypass:
- **Phase 1: Request Recovery Code**
  - Endpoint: `POST /api/auth/forgot-password-request`
  - Body: `{ username, email }`
  - Generates a 6-digit reset OTP code (`user.resetCode`) and dispatches it via email.
- **Phase 2: Save New Password**
  - Endpoint: `POST /api/auth/forgot-password`
  - Body: `{ username, email, code, newPassword }`
  - Validates `user.resetCode === code`. On match, hashes/updates the user password, clears `resetCode`, and saves.

---

## 6. Complete API Reference

| Endpoint | Method | Role Allowed | Description |
|---|---|---|---|
| `/api/auth/login` | `POST` | Public | Authenticates credentials. Rejects with `ACCOUNT_UNVERIFIED` if `isVerified === false` |
| `/api/auth/signup` | `POST` | Public | Creates pending Student account + generates email OTP code |
| `/api/auth/signup-staff` | `POST` | Public | Creates pending Faculty account + generates email OTP code |
| `/api/auth/verify` | `POST` | Public | Validates verification OTP code to unlock login capability |
| `/api/auth/resend-code` | `POST` | Public | Resends a fresh activation verification code to user email |
| `/api/auth/forgot-password-request` | `POST` | Public | Begins passcode reset procedure (sends 6 digit reset OTP) |
| `/api/auth/forgot-password` | `POST` | Public | Submits code and overrides registered password |
| `/api/admissions/pending`| `GET` | `ADMIN` | Fetches lists of pending students and faculty registrations |
| `/api/students/:id/approve` | `PUT`| `ADMIN` / `STAFF` | Records an Admin/Faculty approval signature on student admissions |
| `/api/students/:id/reject` | `PUT` | `ADMIN` | Sets student status to `WITHDRAWN` and drops course registrations |
| `/api/staff/:id/approve` | `PUT` | `ADMIN` | Activates staff credentials (moves status to `ACTIVE`) |
| `/api/staff/:id/reject` | `PUT` | `ADMIN` | Rejects/terminates faculty applicant |

---

## 7. Environment Variables & Sandbox Configuration

When deploying or changing platform integrations, configuration is governed entirely through server-side environment variables defined in `.env.example`.

### 7.1 Sandbox Validation Fallbacks
To support developers and testers in non-production environments where mail servers are unavailable, **both registration and recovery APIs expose verification OTP codes directly inside the server response**:
- Keys: `_debugCode` (visible inside response bodies).
- **Security Guard**: Never expose `_debugCode` within public production systems; log validation errors natively via system output triggers.

---

## 8. Build System & Packaging Pipeline

The application build system compiles both environment pipelines seamlessly into ready-to-run files inside `/dist`.

### 8.1 Package Build Configuration
The target scripts in `package.json` compile backend TypeScript files into standard CommonJS wrappers using `esbuild`:
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs"
  }
}
```

- **Execution Mode**: `npm run build` bundles backend controllers, resolves filesystem structures, and places components inside `/dist`. Run `npm run start` to boot production instances on port `3000`.

---

## 9. Java Spring Boot + MySQL Backend Service (Alternative Stack)

We have provided a production-ready, highly organized **Java Spring Boot + MySQL** backend inside the `/spring-boot-backend` directory. This allows developers to immediately run or deploy a separated enterprise-grade backend infrastructure.

### 9.1 Repository Package Structure
```
/spring-boot-backend
├── pom.xml                                      # Maven dependencies (JPA, Mail, MySQL Connector)
└── src
    └── main
        ├── java/com/university/hub
        │   ├── HubApplication.java               # Main entrypoint class
        │   ├── model
        │   │   ├── User.java                     # Authentication credentials with verification codes
        │   │   ├── Student.java                  # Student details, dual approval flags, and status
        │   │   └── Staff.java                    # Faculty member profiles and qualifications
        │   ├── repository
        │   │   ├── UserRepository.java           # Users JPA Repository
        │   │   ├── StudentRepository.java        # Students JPA Repository
        │   │   └── StaffRepository.java          # Staff JPA Repository
        │   ├── dto
        │   │   └── AuthRequest.java              # Request payloads for auth flow
        │   ├── service
        │   │   └── EmailService.java             # Sends real HTML verification OTPs with JavaMail
        │   └── controller
        │       ├── AuthController.java           # REST controller for Sign Up, Verification, Login
        │       └── AdminController.java          # Approvals desk, student/staff state transitions
        └── resources
            └── application.properties            # MySQL and real SMTP mail settings
```

### 9.2 Key Implementations
- **Real SMTP Authentication**: Integrated via Spring Boot Mail inside `EmailService.java`. It parses the properties dynamically and constructs robust HTML templates for both sign-up verification codes and forgot-password reset passcodes.
- **Dual Approval Guard**: Enforced inside `AdminController.java`. The `approveStudent` endpoint checks for the signature role of the actor (`ADMIN` vs. `STAFF`). When both flags are flipped (`adminApproved = true` and `lecturerApproved = true`), the student's status changes from `PENDING_APPROVAL` to `ACTIVE`.
- **Pre-configured MySQL Driver**: Uses the modern standard `com.mysql.cj.jdbc.Driver` with automated Schema migration (`spring.jpa.hibernate.ddl-auto=update`), keeping data tables synchronized with JPA annotations on startup.

### 9.3 Launching Locally or in Production
To start this Spring Boot + MySQL backend:
1. Ensure a MySQL database server is running locally or in the cloud.
2. Edit `/spring-boot-backend/src/main/resources/application.properties` to input your MySQL and SMTP authentication credentials.
3. Open a terminal in `/spring-boot-backend` and execute:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
4. The server will launch on port `8080` (context path `/api`). Connect your React Vite frontend client to this address using standard fetch or axios client configurations.

