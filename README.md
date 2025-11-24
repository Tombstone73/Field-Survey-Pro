# Field Survey Pro

A comprehensive field survey management application for trade printing companies. Manage projects, capture photos with annotations, collaborate with teams, and share professional reports with clients.

## Features

### ✨ Core Features
- **Project Management** - Track jobs from survey to completion
- **Photo Capture & Annotation** - Add dimensions, text, and freehand drawings to photos
- **Notes & Documentation** - Keep detailed project notes
- **Portfolio Management** - Showcase your best work
- **Status Tracking** - SURVEY → INSTALL → REVISIT → COMPLETED

### 🏢 Phase 3: Organizations & Client Sharing
- **Multi-User Organizations** - Team collaboration with role-based permissions
- **Project Scoping** - Projects belong to organizations
- **Client Sharing** - Generate public read-only share links
- **Professional Presentation** - Beautiful client-facing project views

## Tech Stack

### Backend
- **Node.js** with Express
- **TypeScript**
- **Prisma ORM** with SQLite
- **JWT Authentication**
- **Multer** for file uploads

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Vite** for build tooling
- **CSS Variables** for theming

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd field-survey-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `server/.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-this"
FRONTEND_URL="http://localhost:5173"
UPLOAD_DIR="./uploads"
```

4. **Initialize the database**
```bash
cd server
npx prisma migrate dev
npx tsx src/scripts/migrate-orgs.ts
```

5. **Start the development servers**

In one terminal (server):
```bash
cd server
npm run dev
```

In another terminal (client):
```bash
cd client
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Project Structure

```
field-survey-pro/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── styles/        # CSS files
│   └── package.json
│
├── server/                # Express backend
│   ├── src/
│   │   ├── middleware/    # Auth, error handling
│   │   ├── prisma/        # Database schema
│   │   ├── routes/        # API routes
│   │   ├── scripts/       # Utility scripts
│   │   └── utils/         # Helper functions
│   ├── uploads/           # Photo storage
│   └── package.json
│
└── package.json           # Root workspace config
```

## API Documentation

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Organizations
- `GET /api/organizations/me` - Get current organization
- `POST /api/organizations` - Create organization
- `POST /api/organizations/join` - Join organization
- `POST /api/organizations/regenerate-code` - Regenerate join code

### Projects
- `GET /api/projects` - List projects (org-scoped)
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/share` - Generate share link

### Photos
- `POST /api/photos` - Upload photo
- `GET /api/photos/:id` - Get photo details
- `PUT /api/photos/:id` - Update photo
- `DELETE /api/photos/:id` - Delete photo
- `POST /api/photos/portfolio-bulk` - Bulk add to portfolio

### Notes
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Share (Public)
- `GET /api/share/:token` - View shared project (no auth)

## User Roles

- **OWNER** - Full control, can regenerate join codes
- **ADMIN** - Manage projects, regenerate join codes
- **MEMBER** - Create and edit projects

## Development

### Database Migrations
```bash
cd server
npx prisma migrate dev --name migration_name
```

### Generate Prisma Client
```bash
cd server
npx prisma generate
```

### View Database
```bash
cd server
npx prisma studio
```

## Phase 3 Documentation

See the following files for detailed Phase 3 information:
- `PHASE3_COMPLETE.md` - Implementation summary
- `PHASE3_API_TESTING.md` - API testing guide
- `PHASE3_USER_FLOWS.md` - User flow diagrams
- `PHASE3_QUICK_REF.md` - Quick reference

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ for field survey professionals**
