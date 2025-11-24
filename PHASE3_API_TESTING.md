# Phase 3 Backend API Testing Guide

## Overview
This guide provides step-by-step instructions to test the Organizations & Client Sharing functionality.

## Prerequisites
- Server running on http://localhost:3000
- A registered user account (or create one via signup)
- Tool for API testing (Postman, curl, or browser dev tools)

---

## 1. Authentication Setup

First, login to get your auth token:

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:** You'll receive a cookie `authToken` which will be automatically included in subsequent requests.

---

## 2. Organization Management

### 2.1 Check Current Organization

```bash
GET http://localhost:3000/api/organizations/me
Cookie: authToken=<your-token>
```

**Expected Response (if migrated):**
```json
{
  "organization": {
    "id": "...",
    "name": "Your Name's Personal Org",
    "joinCode": "ABC123",
    "members": [...]
  },
  "userRole": "OWNER",
  "allMemberships": [...]
}
```

### 2.2 Create New Organization

```bash
POST http://localhost:3000/api/organizations
Content-Type: application/json
Cookie: authToken=<your-token>

{
  "name": "My Test Organization"
}
```

### 2.3 Join Existing Organization

```bash
POST http://localhost:3000/api/organizations/join
Content-Type: application/json
Cookie: authToken=<your-token>

{
  "joinCode": "ABC123"
}
```

### 2.4 Regenerate Join Code (OWNER/ADMIN only)

```bash
POST http://localhost:3000/api/organizations/regenerate-code
Cookie: authToken=<your-token>
```

---

## 3. Project Scoping Tests

### 3.1 List Projects (Organization-Scoped)

```bash
GET http://localhost:3000/api/projects
Cookie: authToken=<your-token>
```

**Expected:** Returns only projects belonging to your current organization

### 3.2 Create Project (Auto-Assigned to Org)

```bash
POST http://localhost:3000/api/projects
Content-Type: application/json
Cookie: authToken=<your-token>

{
  "jobNumber": "TEST-001",
  "clientName": "Test Client",
  "siteAddress": "123 Test St",
  "status": "SURVEY"
}
```

---

## 4. Client Share Links

### 4.1 Generate Share Link

```bash
POST http://localhost:3000/api/projects/<project-id>/share
Cookie: authToken=<your-token>
```

**Expected Response:**
```json
{
  "shareUrl": "/share/abc123def456ghi789",
  "token": "abc123def456ghi789"
}
```

### 4.2 Access Shared Project (Public - No Auth Required)

```bash
GET http://localhost:3000/api/share/<token>
```

**Expected:** Returns sanitized project data with photos and notes

---

## 5. Test Scenarios

### Scenario A: New User Flow
1. Register new user
2. Login
3. Try to list projects → Should get 400 "must create or join organization"
4. Create organization
5. Create project → Should succeed
6. List projects → Should see the project

### Scenario B: Multi-User Organization
1. User A creates organization
2. User A gets join code
3. User B joins using join code
4. User A creates project
5. User B lists projects → Should see User A's project

### Scenario C: Client Sharing
1. Create project with photos and notes
2. Generate share link
3. Access share link (no auth) → Should see project data
4. Verify no sensitive data is exposed

---

## Success Criteria

✅ All organization CRUD operations work
✅ Projects are properly scoped by organization
✅ Share links generate and work publicly
✅ Access control enforced (org membership, roles)
✅ Data migration successful (existing users → personal orgs)
✅ No sensitive data leaked in public share endpoint
