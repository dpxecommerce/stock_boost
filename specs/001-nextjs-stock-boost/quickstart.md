# Quickstart Guide: Next.js Stock Boost Management System

**Created**: 2025-11-03  
**Purpose**: Step-by-step guide to set up and run the stock boost management application

## Prerequisites

- **Node.js**: Version 18.17 or later
- **npm/yarn**: Latest version
- **Git**: For version control
- **VS Code**: Recommended editor with Next.js extensions

## Quick Setup (5 Minutes)

### 1. Initialize Next.js Project

```bash
# Create Next.js project with TypeScript and Tailwind
npx create-next-app@latest stock-boost-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd stock-boost-app
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install \
  @tanstack/react-query \
  zod \
  jose \
  bcryptjs \
  @types/bcryptjs

# Development dependencies  
npm install -D \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @vitejs/plugin-react
```

### 3. Configure Environment Variables

Create `.env.local`:
```bash
# Development configuration
NEXT_PUBLIC_USE_MOCK_API=true
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

### 4. Set Up Project Structure

```bash
# Create directory structure
mkdir -p app/\(auth\)/login
mkdir -p app/dashboard
mkdir -p app/api/auth
mkdir -p app/api/boosts
mkdir -p app/api/skus
mkdir -p components/ui
mkdir -p components/forms
mkdir -p components/tables
mkdir -p components/layout
mkdir -p lib/api
mkdir -p lib/auth
mkdir -p types
mkdir -p tests/integration
mkdir -p tests/components
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the Next.js welcome page.

## Implementation Checklist

### Phase 1: Authentication Foundation

#### ✅ Authentication Utilities
Create `lib/auth/session.ts`:
```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.JWT_SECRET
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload
}
```

#### ✅ Middleware Setup
Create `middleware.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth/session'

const protectedRoutes = ['/dashboard']
const publicRoutes = ['/login', '/']

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path)
  const isPublicRoute = publicRoutes.includes(path)

  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)

  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isPublicRoute && session?.userId && !req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
```

#### ✅ Login Page
Create `app/(auth)/login/page.tsx`:
```typescript
import { LoginForm } from '@/components/forms/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Stock Boost Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage stock boosts
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
```

### Phase 2: Mock API Implementation

#### ✅ Mock API Services
Create `lib/api/mock-api.ts`:
```typescript
import { AuthService, BoostService } from './interfaces'
import bcrypt from 'bcryptjs'

export class MockAuthService implements AuthService {
  private users = new Map([
    ['admin', {
      id: 'user-1',
      username: 'admin',
      passwordHash: bcrypt.hashSync('password123', 10)
    }]
  ])

  async login(credentials: LoginCredentials) {
    await this.delay(200, 500)
    
    const user = this.users.get(credentials.username)
    if (!user || !bcrypt.compareSync(credentials.password, user.passwordHash)) {
      return { success: false, error: 'Invalid credentials' }
    }

    return { 
      success: true, 
      data: { 
        id: user.id, 
        username: user.username,
        createdAt: new Date(),
        lastLoginAt: new Date()
      } 
    }
  }

  private async delay(min: number, max: number) {
    const ms = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

#### ✅ API Routes
Create `app/api/auth/login/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/api/service-factory'
import { encrypt } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    const result = await authService.login({ username, password })
    
    if (!result.success) {
      return NextResponse.json(result, { status: 401 })
    }

    // Create session
    const session = await encrypt({ userId: result.data.id })
    
    const response = NextResponse.json(result)
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}
```

### Phase 3: Core Components

#### ✅ UI Components (Atoms)
Create `components/ui/Button.tsx`:
```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'danger',
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

export { Button }
```

#### ✅ Login Form (Molecule)
Create `components/forms/LoginForm.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()

      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      <div className="space-y-4">
        <Input
          label="Username"
          type="text"
          value={credentials.username}
          onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
          required
        />
        
        <Input
          label="Password"
          type="password"
          value={credentials.password}
          onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
          required
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
```

### Phase 4: Dashboard Implementation

#### ✅ Dashboard Layout
Create `app/dashboard/layout.tsx`:
```typescript
import { verifySession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()
  
  if (!session?.userId) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Stock Boost Management
              </h1>
            </div>
            <div className="flex items-center">
              <form action="/api/auth/logout" method="post">
                <button className="text-gray-500 hover:text-gray-700">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
```

## Testing Setup

### Configure Vitest
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### Test Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Development Workflow

### 1. Daily Development
```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test

# Check types
npm run build
```

### 2. Before Commits
```bash
# Run full test suite
npm run test:coverage

# Lint and format
npm run lint
npm run format

# Build check
npm run build
```

### 3. Switching from Mock to Real API
Update `.env.local`:
```bash
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=https://api.production.com
DATABASE_URL=postgresql://...
```

## Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_USE_MOCK_API
vercel env add JWT_SECRET
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database connected (if using real API)
- [ ] Authentication secrets rotated
- [ ] Error monitoring enabled
- [ ] Performance monitoring enabled

## Troubleshooting

### Common Issues

1. **Hot reload not working**: Restart dev server
2. **Authentication loops**: Clear cookies and restart
3. **Type errors**: Run `npm run build` to check
4. **Test failures**: Ensure mock data is consistent

### Performance Tips

1. Use React.memo for expensive components
2. Implement proper loading states
3. Add optimistic updates for better UX
4. Use Next.js Image component for optimization

## Next Steps

After completing the quickstart:

1. **Add real database integration** with Prisma
2. **Implement comprehensive testing** suite
3. **Add advanced features** like batch operations
4. **Set up monitoring** and error tracking
5. **Optimize performance** for production

This quickstart provides a solid foundation for rapid development while maintaining the constitutional principles of component-first architecture, fast development cycles, and minimal viable testing.