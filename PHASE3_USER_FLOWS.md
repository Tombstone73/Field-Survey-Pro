# Phase 3 User Flows

## Flow 1: New User Setup

```
1. Sign Up / Login
   ↓
2. Navigate to /account
   ↓
3. See "No Organization" message
   ↓
4. Click "Create Organization"
   ↓
5. Enter organization name
   ↓
6. Organization created!
   - You are now OWNER
   - Join code generated
   ↓
7. Navigate to /projects
   ↓
8. Create your first project
   - Auto-assigned to your organization
```

---

## Flow 2: Joining a Team

```
1. Login to your account
   ↓
2. Get join code from team owner
   ↓
3. Navigate to /account
   ↓
4. Click "Join Organization"
   ↓
5. Enter join code
   ↓
6. Successfully joined!
   - Role: MEMBER
   - Can now see team projects
   ↓
7. Navigate to /projects
   ↓
8. See all team projects
```

---

## Flow 3: Sharing with Client

```
1. Open a project (/projects/:id)
   ↓
2. Click "🔗 Share" button (top right)
   ↓
3. Share modal appears
   - Shows full share URL
   ↓
4. Click "📋 Copy Link"
   ↓
5. Send link to client (email, text, etc.)
   ↓
6. Client opens link
   - No login required!
   - Read-only view
   - See photos, annotations, notes
```

---

## Flow 4: Public Project View (Client Side)

```
1. Client receives share link
   Example: http://localhost:5173/share/abc123xyz789
   ↓
2. Opens link in browser
   - No account needed
   - No authentication
   ↓
3. Sees branded page with:
   - Project info (job #, client name, address)
   - Status badge
   - Photo grid
   - Annotations on photos
   - Project notes
   ↓
4. Can toggle annotations on/off
   ↓
5. Professional, clean presentation
```

---

## Flow 5: Organization Management (Owner)

```
1. Navigate to /account
   ↓
2. See organization details:
   - Organization name
   - Your role (OWNER)
   - Join code
   - Member list
   ↓
3. Actions available:
   - Copy join code
   - Regenerate join code
   - View all members with roles
   ↓
4. Share join code with team members
   ↓
5. They join and appear in member list
```

---

## Key Pages

### /account
**Purpose:** Manage organizations
**Features:**
- Create new organization
- Join existing organization
- View current organization
- See members and roles
- Regenerate join code
- Logout

### /projects
**Purpose:** List all projects
**Features:**
- View org-scoped projects
- Search and filter
- Create new project
- Handle "no organization" state

### /projects/:id
**Purpose:** Project details
**Features:**
- View/edit project
- Add photos and notes
- **NEW:** Share with client button
- Status management
- Portfolio selection

### /share/:token
**Purpose:** Public project view
**Features:**
- No authentication
- Read-only access
- View photos with annotations
- View notes
- Toggle annotations
- Professional presentation

---

## Error States

### No Organization
**Where:** /projects
**Message:** "You need to create or join an organization"
**Action:** Button to /account

### Invalid Share Link
**Where:** /share/:token
**Message:** "Share link not found or expired"
**Action:** Show error page

### Access Denied
**Where:** /projects/:id
**Message:** "Access denied" (403)
**Reason:** Project belongs to different organization

---

## Role Permissions

### OWNER
- ✅ Create projects
- ✅ Edit projects
- ✅ Delete projects
- ✅ Generate share links
- ✅ Regenerate join code
- ✅ View all members

### ADMIN
- ✅ Create projects
- ✅ Edit projects
- ✅ Delete projects
- ✅ Generate share links
- ✅ Regenerate join code
- ✅ View all members

### MEMBER
- ✅ Create projects
- ✅ Edit projects
- ✅ Delete projects
- ✅ Generate share links
- ❌ Regenerate join code
- ✅ View all members

---

## API Endpoints Used

### Organizations
```
GET    /api/organizations/me              - Get current org
POST   /api/organizations                 - Create org
POST   /api/organizations/join            - Join org
POST   /api/organizations/regenerate-code - New join code
```

### Projects
```
GET    /api/projects                      - List (org-scoped)
POST   /api/projects                      - Create (org-assigned)
GET    /api/projects/:id                  - View (org-checked)
PUT    /api/projects/:id                  - Update (org-checked)
DELETE /api/projects/:id                  - Delete (org-checked)
POST   /api/projects/:id/share            - Generate share link
```

### Share
```
GET    /api/share/:token                  - Public view (no auth)
```

---

## Testing Checklist

- [ ] Create organization
- [ ] Join organization with code
- [ ] Create project (auto-assigned to org)
- [ ] View projects (only see org projects)
- [ ] Generate share link
- [ ] Access share link (no login)
- [ ] View photos with annotations in share view
- [ ] Toggle annotations on/off
- [ ] Copy share URL to clipboard
- [ ] Regenerate join code (OWNER/ADMIN)
- [ ] View organization members
- [ ] Try accessing project from different org (should fail)
- [ ] Handle "no organization" state gracefully

---

## Success Indicators

✅ Users can create/join organizations
✅ Projects are scoped to organizations
✅ Share links work without authentication
✅ Annotations visible in public view
✅ No sensitive data exposed
✅ Clean, professional client presentation
✅ Seamless user experience
✅ All error states handled gracefully
