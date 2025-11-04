# Stock Boost Management System - MVP

A Next.js application for managing stock boost requests with TypeScript, Tailwind CSS, and React Query.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:** 
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Default Login Credentials

The MVP includes a mock API with pre-configured users:

| Username | Password | Role  |
|----------|----------|-------|
| `admin`  | `admin123` | Admin |
| `demo`   | `demo123`  | User  |

## 📊 Mock Data

The MVP includes sample data:
- **3 stock boosts** (2 active, 1 completed)
- **6 SKUs** across different categories (Widgets, Gadgets, Tools, Components)

## 🛠️ API Configuration

The application uses environment variables to control API behavior:

- **`NEXT_PUBLIC_USE_MOCK_API=true`** - Uses mock API (default for MVP)
- **`NEXT_PUBLIC_USE_MOCK_API=false`** - Uses external API server

To switch to external API:
1. Update `.env.local`: Set `NEXT_PUBLIC_USE_MOCK_API=false`
2. Configure `NEXT_PUBLIC_API_BASE_URL` to your API server
3. Restart the development server

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── lib/
│   ├── api/
│   │   ├── client.ts      # External API client
│   │   ├── mock-client.ts # Mock API implementation
│   │   └── factory.ts     # API client factory
│   ├── auth.ts            # Authentication manager
│   └── utils.ts           # Utility functions
├── types/                 # TypeScript type definitions
└── tests/                 # Test files
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Build & Deploy

### Static Export (Default)
```bash
npm run export
```
The static export will be generated in the `out/` directory.

### Deploy to Vercel
```bash
npm run build
npm start
```

## ✨ Features

### ✅ Implemented (User Story 1)
- [x] User authentication (login/logout)
- [x] Protected dashboard routes
- [x] Basic navigation and layout
- [x] Mock API with sample data
- [x] Static export capability

### 🚧 In Progress
- [ ] Active stock boost management (User Story 2)
- [ ] Historical boost tracking (User Story 3)
- [ ] Advanced filtering and search
- [ ] Real-time updates

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run export       # Create static export
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
```

## 📝 Environment Variables

Create a `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_USE_MOCK_API=true

# Development Settings
NEXT_PUBLIC_ENV=development
```

---

**Ready to get started?** Login with `admin` / `admin123` and explore the MVP! 🎉
