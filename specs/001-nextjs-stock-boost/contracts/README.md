# API Contracts: Stock Boost Management System

**Created**: 2025-11-03  
**Purpose**: External REST API contract definitions for client-server integration

## Overview

The Stock Boost Management API is provided by a separate server deployment. The Next.js frontend is a static application that communicates with this external API server. All endpoints follow standard HTTP conventions with JSON request/response bodies.

## API Server Configuration

### Environment Variables
- `NEXT_PUBLIC_API_BASE_URL`: Base URL of the external API server (e.g., `https://api.stockboost.com`)
- `NEXT_PUBLIC_API_VERSION`: API version to use (default: `v1`)

### Authentication
- **Method**: JWT tokens returned from login endpoint
- **Storage**: Browser localStorage for static deployment
- **Token Duration**: Configurable by API server
- **Header**: `Authorization: Bearer <token>`

## API Endpoints

**Base URL**: `{NEXT_PUBLIC_API_BASE_URL}/api/{NEXT_PUBLIC_API_VERSION}`

### Authentication Endpoints

#### `POST {baseUrl}/auth/login`
**Purpose**: Authenticate user and receive JWT token

**Request**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "admin",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLoginAt": "2025-11-03T10:30:00Z"
    }
  }
}
```

**Error** (401):
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

#### `POST {baseUrl}/auth/refresh`
**Purpose**: Refresh JWT token
**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### `GET {baseUrl}/auth/me`
**Purpose**: Get current authenticated user
**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "admin",
    "createdAt": "2025-01-01T00:00:00Z",
    "lastLoginAt": "2025-11-03T10:30:00Z"
  }
}
```

### Stock Boost Endpoints
**Headers**: All requests require `Authorization: Bearer <token>`

#### `GET {baseUrl}/boosts?type=active`
**Purpose**: Get all active stock boosts

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "boost-123e4567-e89b-12d3-a456-426614174000",
      "sku": "LAPTOP-001",
      "amount": 50.00,
      "status": "active",
      "createdAt": "2025-11-01T00:00:00Z",
      "createdBy": "123e4567-e89b-12d3-a456-426614174000",
      "deactivatedAt": null,
      "deactivationReason": null,
      "expiresAt": "2025-12-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/boosts?type=historical&page=1&limit=20`
**Purpose**: Get historical (inactive) stock boosts with pagination

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "boost-987e6543-e21b-43d2-b654-321987654321",
      "sku": "PHONE-123",
      "amount": 25.50,
      "status": "inactive",
      "createdAt": "2025-10-15T00:00:00Z",
      "createdBy": "123e4567-e89b-12d3-a456-426614174000",
      "deactivatedAt": "2025-10-30T00:00:00Z",
      "deactivationReason": "manual",
      "expiresAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### `POST /api/boosts`
**Purpose**: Create a new stock boost

**Request**:
```json
{
  "sku": "LAPTOP-001",
  "amount": 50.00,
  "expiresAt": "2025-12-01T00:00:00Z"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "boost-123e4567-e89b-12d3-a456-426614174000",
    "sku": "LAPTOP-001",
    "amount": 50.00,
    "status": "active",
    "createdAt": "2025-11-03T00:00:00Z",
    "createdBy": "123e4567-e89b-12d3-a456-426614174000",
    "deactivatedAt": null,
    "deactivationReason": null,
    "expiresAt": "2025-12-01T00:00:00Z"
  }
}
```

**Error** (400):
```json
{
  "success": false,
  "error": "SKU already has an active boost",
  "details": {
    "field": "sku",
    "value": "LAPTOP-001",
    "existingBoostId": "boost-existing-id"
  }
}
```

#### `DELETE /api/boosts/{id}`
**Purpose**: Manually deactivate a stock boost

**Request**:
```json
{
  "reason": "manual"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "boost-123e4567-e89b-12d3-a456-426614174000",
    "sku": "LAPTOP-001",
    "amount": 50.00,
    "status": "inactive",
    "createdAt": "2025-11-01T00:00:00Z",
    "createdBy": "123e4567-e89b-12d3-a456-426614174000",
    "deactivatedAt": "2025-11-03T10:30:00Z",
    "deactivationReason": "manual",
    "expiresAt": "2025-12-01T00:00:00Z"
  }
}
```

### SKU Endpoints

#### `GET /api/skus/search?q=laptop&limit=10`
**Purpose**: Search for SKUs by name, SKU code, or category

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "sku": "LAPTOP-001",
      "name": "Gaming Laptop Pro",
      "category": "Electronics",
      "isActive": true
    },
    {
      "sku": "LAPTOP-002",
      "name": "Business Laptop",
      "category": "Electronics",
      "isActive": true
    }
  ]
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": {
    "field": "fieldName",
    "code": "VALIDATION_ERROR",
    "additionalInfo": "..."
  }
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors, business rule violations)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (authenticated but insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

### Common Error Scenarios

#### Validation Errors (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "fields": {
      "amount": "Must be a positive number",
      "sku": "Must be 3-50 characters"
    }
  }
}
```

#### Business Rule Violations (400)
```json
{
  "success": false,
  "error": "SKU already has an active boost",
  "details": {
    "sku": "LAPTOP-001",
    "existingBoostId": "boost-existing-id"
  }
}
```

#### Authentication Errors (401)
```json
{
  "success": false,
  "error": "Authentication required"
}
```

## Implementation Notes

### Request/Response Guidelines
- **Content-Type**: Always `application/json`
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 with timezone (`2025-11-03T10:30:00Z`)
- **Decimal Precision**: 2 decimal places for monetary amounts

### Pagination (Historical Boosts)
- **Default page size**: 20 items
- **Maximum page size**: 100 items
- **Page numbering**: 1-based
- **Response includes**: `page`, `limit`, `total`, `totalPages`

### Security Headers
```http
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### Rate Limiting (Future Implementation)
- **Authentication endpoints**: 5 requests per minute per IP
- **API endpoints**: 100 requests per minute per authenticated user
- **Search endpoints**: 20 requests per minute per user

## Mock API Implementation

For development, the mock API should:

1. **Implement all endpoints** with realistic response times (100-800ms)
2. **Simulate errors** at a 5% rate for robustness testing
3. **Persist data** in memory with optional localStorage backup
4. **Include validation** matching the real API requirements
5. **Support all query parameters** and pagination
6. **Return proper HTTP status codes** and error formats

### Mock Data Seeding
```typescript
// Initial mock data for development
const mockUsers = [
  { id: "user-1", username: "admin", passwordHash: "..." }
];

const mockSkus = [
  { sku: "LAPTOP-001", name: "Gaming Laptop Pro", category: "Electronics" },
  { sku: "PHONE-123", name: "Smartphone X", category: "Electronics" },
  { sku: "BOOK-456", name: "Programming Guide", category: "Books" }
];

const mockBoosts = [
  {
    id: "boost-1",
    sku: "LAPTOP-001", 
    amount: 50.00,
    status: "active",
    createdAt: "2025-11-01T00:00:00Z"
  }
];
```

This API design follows REST conventions, provides comprehensive error handling, and supports the complete user journey for stock boost management while maintaining simplicity and type safety throughout.