# Data Model: Next.js Stock Boost Management System

**Created**: 2025-11-03  
**Purpose**: Entity definitions, relationships, and validation rules

## Core Entities

### User Entity
**Purpose**: Represents authenticated system users with login credentials and session management

**Fields**:
- `id`: string (UUID) - Unique user identifier
- `username`: string - Unique login identifier
- `passwordHash`: string - bcrypt hashed password (min 10 rounds)
- `createdAt`: Date - Account creation timestamp
- `lastLoginAt`: Date | null - Last successful login timestamp

**Validation Rules**:
- `username`: 3-50 characters, alphanumeric + underscore only
- `password`: Minimum 8 characters, at least one letter and one number
- `id`: Auto-generated UUID v4

**Business Rules**:
- Username must be unique across system
- Password must be hashed before storage
- Login attempts tracked for security

### StockBoost Entity
**Purpose**: Represents a pricing boost applied to a specific SKU with amount, status, creation timestamp, and deactivation details

**Fields**:
- `id`: string (UUID) - Unique boost identifier
- `sku`: string - Product SKU identifier
- `amount`: number - Boost amount (positive decimal)
- `status`: 'active' | 'inactive' - Current boost status
- `createdAt`: Date - Boost creation timestamp
- `createdBy`: string (User.id) - User who created the boost
- `deactivatedAt`: Date | null - Deactivation timestamp
- `deactivationReason`: 'expired' | 'manual' | null - Reason for deactivation
- `expiresAt`: Date | null - Optional expiration date

**Validation Rules**:
- `sku`: 3-50 characters, alphanumeric + dash/underscore
- `amount`: Positive number, max 2 decimal places, range 0.01-999999.99
- `status`: Enum validation
- `deactivationReason`: Required when status is 'inactive'

**Business Rules**:
- Only one active boost per SKU at a time
- Amount must be positive
- Cannot modify boost once created (immutable record)
- Deactivation requires reason
- Expired boosts automatically marked inactive

### SKU Entity
**Purpose**: Represents product identifiers that can have boosts applied, with search and validation capabilities

**Fields**:
- `sku`: string - Product SKU (primary key)
- `name`: string - Product display name
- `category`: string - Product category
- `isActive`: boolean - Whether SKU is available for boosts
- `lastUsed`: Date | null - Last time used in boost

**Validation Rules**:
- `sku`: Unique, 3-50 characters
- `name`: 1-200 characters
- `category`: 1-100 characters

**Business Rules**:
- Only active SKUs can have new boosts created
- SKU search includes name and category
- Case-insensitive search

## Entity Relationships

### User → StockBoost (One-to-Many)
- One user can create multiple stock boosts
- Foreign key: `StockBoost.createdBy` references `User.id`
- Cascade: User deletion should transfer boosts to system user

### SKU → StockBoost (One-to-Many)
- One SKU can have multiple boosts over time
- Foreign key: `StockBoost.sku` references `SKU.sku`
- Constraint: Only one active boost per SKU

## State Transitions

### StockBoost Status Flow
```
[Created] → active
    ↓
active → inactive (manual deactivation)
    ↓
active → inactive (expiration)
```

**Transition Rules**:
- `active → inactive`: Requires deactivationReason and deactivatedAt
- No reverse transitions allowed (immutable history)
- System automatically transitions expired boosts

## Data Access Patterns

### Authentication Queries
- Find user by username (login)
- Verify session by user ID
- Update last login timestamp

### Boost Management Queries
- Get active boosts (paginated, sorted by createdAt desc)
- Get historical boosts (paginated, filtered by date range)
- Search boosts by SKU
- Create new boost (with duplicate active SKU check)
- Deactivate boost (manual or expiration)

### SKU Operations
- Search SKUs by partial match (name, SKU, category)
- Validate SKU exists and is active
- Update last used timestamp

## Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- SKUs table
CREATE TABLE skus (
    sku VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE
);

-- Stock boosts table
CREATE TABLE stock_boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) NOT NULL REFERENCES skus(sku),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivation_reason VARCHAR(20) CHECK (deactivation_reason IN ('expired', 'manual')),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT one_active_boost_per_sku EXCLUDE (sku WITH =) WHERE (status = 'active'),
    CONSTRAINT deactivation_data_consistency CHECK (
        (status = 'active' AND deactivated_at IS NULL AND deactivation_reason IS NULL) OR
        (status = 'inactive' AND deactivated_at IS NOT NULL AND deactivation_reason IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_stock_boosts_status ON stock_boosts(status);
CREATE INDEX idx_stock_boosts_created_at ON stock_boosts(created_at DESC);
CREATE INDEX idx_stock_boosts_sku ON stock_boosts(sku);
CREATE INDEX idx_skus_search ON skus USING gin(to_tsvector('english', name || ' ' || sku || ' ' || category));
```

## Prisma Schema

```prisma
model User {
  id          String   @id @default(uuid())
  username    String   @unique @db.VarChar(50)
  passwordHash String   @map("password_hash")
  createdAt   DateTime @default(now()) @map("created_at")
  lastLoginAt DateTime? @map("last_login_at")
  
  // Relationships
  stockBoosts StockBoost[]
  
  @@map("users")
}

model Sku {
  sku       String   @id @db.VarChar(50)
  name      String   @db.VarChar(200)
  category  String   @db.VarChar(100)
  isActive  Boolean  @default(true) @map("is_active")
  lastUsed  DateTime? @map("last_used")
  
  // Relationships
  stockBoosts StockBoost[]
  
  @@map("skus")
}

model StockBoost {
  id                  String   @id @default(uuid())
  sku                 String   @db.VarChar(50)
  amount              Decimal  @db.Decimal(10, 2)
  status              String   @db.VarChar(20)
  createdAt           DateTime @default(now()) @map("created_at")
  createdBy           String   @map("created_by")
  deactivatedAt       DateTime? @map("deactivated_at")
  deactivationReason  String?  @map("deactivation_reason") @db.VarChar(20)
  expiresAt           DateTime? @map("expires_at")
  
  // Relationships
  user User @relation(fields: [createdBy], references: [id])
  skuEntity Sku @relation(fields: [sku], references: [sku])
  
  @@map("stock_boosts")
}
```

## Mock Data Structure

For development and testing purposes:

```typescript
// Sample mock data
const mockUsers: User[] = [
  {
    id: "user-1",
    username: "admin",
    passwordHash: "$2b$10$...", // "password123"
    createdAt: new Date("2025-01-01"),
    lastLoginAt: new Date("2025-11-03")
  }
];

const mockSkus: Sku[] = [
  { sku: "LAPTOP-001", name: "Gaming Laptop Pro", category: "Electronics", isActive: true, lastUsed: null },
  { sku: "PHONE-123", name: "Smartphone X", category: "Electronics", isActive: true, lastUsed: null },
  { sku: "BOOK-456", name: "Programming Guide", category: "Books", isActive: true, lastUsed: null }
];

const mockBoosts: StockBoost[] = [
  {
    id: "boost-1",
    sku: "LAPTOP-001",
    amount: 50.00,
    status: "active",
    createdAt: new Date("2025-11-01"),
    createdBy: "user-1",
    deactivatedAt: null,
    deactivationReason: null,
    expiresAt: new Date("2025-12-01")
  },
  {
    id: "boost-2", 
    sku: "PHONE-123",
    amount: 25.50,
    status: "inactive",
    createdAt: new Date("2025-10-15"),
    createdBy: "user-1",
    deactivatedAt: new Date("2025-10-30"),
    deactivationReason: "manual",
    expiresAt: null
  }
];
```

## Validation Schemas (Zod)

```typescript
export const CreateBoostSchema = z.object({
  sku: z.string().min(3).max(50).regex(/^[A-Za-z0-9_-]+$/),
  amount: z.number().positive().max(999999.99).multipleOf(0.01)
});

export const LoginSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[A-Za-z0-9_]+$/),
  password: z.string().min(8).max(100)
});

export const SkuSearchSchema = z.object({
  query: z.string().min(1).max(100)
});
```

This data model provides a solid foundation for the stock boost management system while maintaining simplicity and following the constitutional principles of the project.