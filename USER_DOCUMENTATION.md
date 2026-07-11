# University Portal: End-User Manual & Portal Guide

Welcome to the **University Hub Portal**. This document serves as a comprehensive user manual designed to guide students, faculty members (lecturers), and academic administrators through the onboarding, account verification, security recovery, and portal approval systems.

---

## Table of Contents
1. [Portal Overview](#1-portal-overview)
2. [Student Lifecycle & Admissions](#2-student-lifecycle--admissions)
   - [2.1 Self-Registration / Sign Up](#21-self-registration--sign-up)
   - [2.2 Two-Factor E-mail Verification](#22-two-factor-e-mail-verification)
   - [2.3 Dual Approval Safeguard](#23-dual-approval-safeguard)
3. [Faculty (Lecturer) Lifecycle](#3-faculty-lecturer-lifecycle)
   - [3.1 Faculty Self-Onboarding](#31-faculty-self-onboarding)
   - [3.2 Administrator Validation](#32-administrator-validation)
4. [Administrative Admissions Desk (ADMIN Only)](#4-administrative-admissions-desk-admin-only)
   - [4.1 Reviewing Student Applications](#41-reviewing-student-applications)
   - [4.2 Reviewing Faculty Applications](#42-reviewing-faculty-applications)
5. [Security & Credentials Recovery (Forgot Password)](#5-security--credentials-recovery-forgot-password)
6. [Generating a Print-Ready PDF from Browser](#6-generating-a-print-ready-pdf-from-browser)

---

## 1. Portal Overview

The **University Hub Portal** is a unified academic registry designed to manage student registration, faculty onboarding, lecture scheduling, student grades, and tuition accounting. To maintain rigorous security and record validation, the system features:
- **Mandatory E-mail Verification**: Every student and faculty member must verify their email with a 6-digit cryptographic passcode.
- **Admin & Faculty Dual-Approve**: Registered student applicants are only admitted to classes when *both* the administrative team and assigned lecturers sign off on their profiles.
- **Admissions Onboarding Desk**: A dedicated, live workspace for system administrators to authorize incoming student and lecturer credentials.

---

## 2. Student Lifecycle & Admissions

```
[ Sign Up ] ➔ [ Receive Code via Email ] ➔ [ Enter 6-Digit Code ] ➔ [ Pending Approvals (Admin & Faculty) ] ➔ [ Fully Active ]
```

### 2.1 Self-Registration / Sign Up
1. Navigate to the landing page and click the **Sign Up / Onboard** tab.
2. Select **Student** as your registry role.
3. Supply your details:
   - **First & Last Name**
   - **Unique Username**
   - **Valid E-mail Address** (Used for receiving security codes)
   - **Contact Phone & Physical Address**
   - **Desired Class Cohort**
   - **Secret Password**
4. Click **Onboard and Sign Up Now**.

### 2.2 Two-Factor E-mail Verification
Upon signing up, the portal generates a secure 6-digit verification code.
* **Production**: Dispatched instantly to your provided email address.
* **Sandbox / Dry-Run**: Displays in a blue **DEBUG CONSOLE OTP** badge at the top of your layout for offline verification.
1. Enter the 6-digit code on the verification screen.
2. Click **Verify and Activate**.
3. *Note*: If the verification email does not arrive or expires, click the **Didn't receive code? Resend Email** option.

### 2.3 Dual Approval Safeguard
Once verified, your screen will show **"Enrollment Pending Admission"**. 
To ensure academic integrity, your account must be authorized by:
1. **Admissions Desk** (System Admin)
2. **Class Lecturer** (Assigned Faculty Member)

Once *both* entities click "Approve" on your application, the portal fully unlocks: your class dashboards, tuition balances, digital assignments, and grading booklets will instantly go live.

---

## 3. Faculty (Lecturer) Lifecycle

### 3.1 Faculty Self-Onboarding
1. On the registration screen, choose **Lecturer** as your registry role.
2. Input your active credentials:
   - **Full Name, Username, & E-mail**
   - **Academic Credentials & Qualifications** (e.g., MSc Computer Science, Dr. of Engineering)
   - **Assigned Department** (e.g., Department of Software Architecture)
   - **Desired Position** (e.g., Senior Lecturer, Adjunct Professor)
3. Submit your application. Retrieve your 6-digit verification code from your inbox (or sandbox debug console) and verify your email.

### 3.2 Administrator Validation
Verified faculty members will see **"Faculty Access Pending Admission"**.
An administrative officer must review your academic qualifications, resume, and department credentials. Once the administrator approves your profile within the Admissions Desk, your dashboard becomes fully unlocked, providing management interfaces for grades, timetables, and lecture material publications.

---

## 4. Administrative Admissions Desk (ADMIN Only)

Administrators are equipped with an advanced **Admissions Desk** control center to govern incoming profiles and prevent unauthorized entry.

### 4.1 Reviewing Student Applications
1. Open the left sidebar and select the **Admissions Desk** tab.
2. Under the **Students Queue**, click any pending student applicant to inspect their details:
   - Applied Date, E-mail, and Phone numbers.
   - Live approval statuses (Displays whether Admin or Faculty signatures are still pending).
3. To authorize, click **Admit / Approve**. This registers your executive Admin signature.
4. To reject, click **Reject Application**. This terminates the applicant record and sets their student profile status to **WITHDRAWN** (revoking associated classroom enrollments).

### 4.2 Reviewing Faculty Applications
1. Go to the **Admissions Desk** tab and choose **Faculty Queue**.
2. Inspect the applicant's academic qualifications, assigned department, and desired role.
3. Click **Approve Faculty** to move their status to **ACTIVE**. This immediately unlocks their platform access.
4. Click **Reject/Deny** to flag the profile as **TERMINATED**.

---

## 5. Security & Credentials Recovery (Forgot Password)

If you have forgotten your password, the system permits recovery through audited email verification codes:
1. On the login screen, click the **Forgot Password** option.
2. Input your **Username** and **Registered E-mail Address**.
3. Press **Request Code**. The system verifies your database record and sends a secure authorization code to your email.
4. Input the code, key in your **New Password**, and click **Update Password**.
5. Once your code is accepted, your security credentials are recalculated, and you are redirected to the standard login screen.

---

## 6. Generating a Print-Ready PDF from Browser

To convert this manual page, or any dashboard content, into a clean, physical PDF document, please utilize the standard browser-native print converter:
1. In your web browser, press `Ctrl + P` (Windows) or `Cmd + P` (macOS).
2. Set the destination to **Save as PDF**.
3. Under **More Settings**, tick the **Background graphics** and **Background colors** checkbox to ensure the elegant styled borders and high-contrast badges are preserved.
4. Click **Save** and specify your local directory path.
