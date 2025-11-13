# Typesense Product Search Setup Guide

This document outlines the steps to set up product search using Typesense, including API key management, collection creation, and data synchronization from SQL Server.

## Prerequisites

- Typesense server is installed and running
- Access to SQL Server database containing product data
- Node.js environment with TypeScript support

## Table of Contents

1. [API Key Management](#1-api-key-management)
2. [Collection Schema Design](#2-collection-schema-design)
3. [Creating the Collection](#3-creating-the-collection)
4. [Data Extraction from SQL Server](#4-data-extraction-from-sql-server)
5. [Document Indexing](#5-document-indexing)
6. [Search Implementation](#6-search-implementation)
7. [Maintenance & Updates](#7-maintenance--updates)

---

## 1. API Key Management

### 1.1 Generate API Keys

Typesense uses three types of API keys:

- **Admin API Key**: Full access (create/delete collections, manage keys)
- **Search-only API Key**: Read-only access for client-side search
- **Scoped API Key**: Temporary keys with additional filters (optional)

### 1.2 Set Admin API Key

The admin API key is set when starting the Typesense server:

```bash
./typesense-server \
  --data-dir=/tmp/typesense-data \
  --api-key=your-admin-api-key-here \
  --enable-cors
```

Store this key securely in your environment variables:

```bash
# .env.local
TYPESENSE_ADMIN_API_KEY=b7c4e3fa19bdf80a48d6c3e4a9f2d7b05a9c2b8f19e6a0d47cbad30e1f1ce4ad
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
```

### 1.3 Generate Search-Only API Key (via Admin API)

Create a search-only key using the Typesense API:

```bash
curl 'http://localhost:8108/keys' \
  -X POST \
  -H "X-TYPESENSE-API-KEY: b7c4e3fa19bdf80a48d6c3e4a9f2d7b05a9c2b8f19e6a0d47cbad30e1f1ce4ad" \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "Product search key (read-only)",
    "actions": ["documents:search"],
    "collections": ["products"]
  }'
```

Store the generated search key in your environment for client-side use.

---

## 2. Collection Schema Design

### 2.1 Define Product Schema

Design your collection schema based on your SQL Server product table structure:

```typescript
// types/typesense.ts
export interface ProductDocument {
  id: string;                    // Primary key (using item_no)
  item_no: string;               // Primary item number
  item_no2: string;              // Secondary item number
  description: string;           // Product description
}

export interface ProductCollectionSchema {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    facet?: boolean;
    optional?: boolean;
    index?: boolean;
  }>;
  default_sorting_field?: string;
}
```

### 2.2 Collection Configuration

```typescript
export const PRODUCTS_COLLECTION_SCHEMA: ProductCollectionSchema = {
  name: 'products',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'item_no', type: 'string', facet: false },
    { name: 'item_no2', type: 'string', facet: false },
    { name: 'description', type: 'string' },
  ],
  default_sorting_field: 'item_no'
};
```

**Field Type Guidelines:**
- `string`: Text fields (item_no, item_no2, description)
- `facet: false`: Filtering not needed for item numbers
- `default_sorting_field`: Results sorted by item_no by default

---

## 3. Creating the Collection

### 3.1 Typesense Client Setup

Create a service to interact with Typesense:

```typescript
// services/typesenseService.ts
import Typesense from 'typesense';

const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.TYPESENSE_PORT || '8108'),
      protocol: process.env.TYPESENSE_PROTOCOL || 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_ADMIN_API_KEY || '',
  connectionTimeoutSeconds: 2,
});

export default typesenseClient;
```

### 3.2 Create Collection Script

```typescript
// scripts/createProductCollection.ts
import typesenseClient from '../services/typesenseService';
import { PRODUCTS_COLLECTION_SCHEMA } from '../types/typesense';

async function createProductCollection() {
  try {
    // Check if collection exists
    try {
      await typesenseClient.collections('products').retrieve();
      console.log('Collection "products" already exists');
      
      // Optional: Delete and recreate
      const shouldRecreate = process.argv.includes('--recreate');
      if (shouldRecreate) {
        await typesenseClient.collections('products').delete();
        console.log('Deleted existing collection');
      } else {
        return;
      }
    } catch (error: any) {
      if (error.httpStatus !== 404) {
        throw error;
      }
    }

    // Create collection
    const result = await typesenseClient.collections().create(
      PRODUCTS_COLLECTION_SCHEMA
    );
    
    console.log('Collection created successfully:', result);
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}

createProductCollection();
```

### 3.3 Run Collection Creation

```bash
# Install Typesense client
npm install typesense

# Run the script
npx tsx scripts/createProductCollection.ts

# Or to recreate an existing collection
npx tsx scripts/createProductCollection.ts --recreate
```

---

## 4. Data Extraction from SQL Server

### 4.1 SQL Server Connection Setup

```typescript
// services/sqlServerService.ts
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  server: process.env.SQL_SERVER || 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: true, // For Azure SQL
    trustServerCertificate: true, // For local dev
  },
};

export async function getProductsFromSQL(): Promise<any[]> {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    pool = await sql.connect(sqlConfig);
    
    const result = await pool.request().query(`
      SELECT 
        item_no as id,
        item_no,
        item_no2,
        description
      FROM Products
      WHERE IsDeleted = 0
      ORDER BY item_no
    `);
    
    return result.recordset;
  } catch (error) {
    console.error('SQL Server query error:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
```

### 4.2 Environment Variables

Add SQL Server credentials to your `.env.local`:

```bash
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=your-database-name
SQL_USER=your-username
SQL_PASSWORD=your-password
```

---

## 5. Document Indexing

### 5.1 Bulk Import Script

```typescript
// scripts/indexProducts.ts
import typesenseClient from '../services/typesenseService';
import { getProductsFromSQL } from '../services/sqlServerService';

async function indexProducts() {
  try {
    console.log('Fetching products from SQL Server...');
    const products = await getProductsFromSQL();
    console.log(`Found ${products.length} products to index`);

    if (products.length === 0) {
      console.log('No products to index');
      return;
    }

    // Import documents in batches
    const BATCH_SIZE = 100;
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      console.log(`Indexing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
      
      const importResults = await typesenseClient
        .collections('products')
        .documents()
        .import(batch, { action: 'upsert' });

      // Parse results (JSONL format)
      const results = importResults.split('\n').filter(Boolean);
      results.forEach((result) => {
        const parsed = JSON.parse(result);
        if (parsed.success) {
          imported++;
        } else {
          failed++;
          console.error('Failed to import document:', parsed.error);
        }
      });
    }

    console.log(`\nIndexing complete!`);
    console.log(`Successfully indexed: ${imported} documents`);
    console.log(`Failed: ${failed} documents`);
  } catch (error) {
    console.error('Error indexing products:', error);
    throw error;
  }
}

indexProducts();
```

### 5.2 Run Initial Import

```bash
# Install mssql package
npm install mssql

# Run indexing script
npx tsx scripts/indexProducts.ts
```

### 5.3 Individual Document Operations

```typescript
// Add single document
await typesenseClient
  .collections('products')
  .documents()
  .create({
    id: 'ITEM001',
    item_no: 'ITEM001',
    item_no2: 'ALT001',
    description: 'Example Product Description',
  });

// Update document
await typesenseClient
  .collections('products')
  .documents('ITEM001')
  .update({
    description: 'Updated Product Description',
  });

// Delete document
await typesenseClient
  .collections('products')
  .documents('123')
  .delete();
```

---

## 6. Search Implementation

### 6.1 Server-Side Search API

```typescript
// app/api/search/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import typesenseClient from '@/services/typesenseService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '20');

  try {
    const searchParameters = {
      q: query,
      query_by: 'item_no,item_no2,description',
      sort_by: '_text_match:desc,item_no:asc',
      page,
      per_page: perPage,
    };

    const searchResults = await typesenseClient
      .collections('products')
      .documents()
      .search(searchParameters);

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

### 6.2 Client-Side Search Component

```typescript
// components/ProductSearch.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export default function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search/products?q=${encodeURIComponent(debouncedQuery)}`
        );
        const data = await response.json();
        setResults(data.hits || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [debouncedQuery]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 border rounded"
      />
      
      {loading && <div>Searching...</div>}
      
      <div className="mt-4">
        {results.map((hit) => (
          <div key={hit.document.id} className="p-4 border-b">
            <h3 className="font-bold">{hit.document.item_no}</h3>
            <p>Item No 2: {hit.document.item_no2}</p>
            <p>Description: {hit.document.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Maintenance & Updates

### 7.1 Incremental Updates

Set up a scheduled job to sync recent changes:

```typescript
// scripts/syncRecentProducts.ts
import typesenseClient from '../services/typesenseService';
import sql from 'mssql';

async function syncRecentProducts() {
  const pool = await sql.connect(sqlConfig);
  
  // Get products updated in last hour
  const result = await pool.request().query(`
    SELECT * FROM Products 
    WHERE UpdatedAt > DATEADD(hour, -1, GETDATE())
  `);

  for (const product of result.recordset) {
    await typesenseClient
      .collections('products')
      .documents()
      .upsert(transformProductData(product));
  }
}

// Run every 5 minutes via cron or scheduled task
```

### 7.2 Real-Time Updates via Webhooks/Triggers

```typescript
// app/api/webhooks/product-update/route.ts
export async function POST(request: NextRequest) {
  const { action, productId } = await request.json();

  try {
    if (action === 'delete') {
      await typesenseClient
        .collections('products')
        .documents(productId)
        .delete();
    } else {
      // Fetch latest data and update
      const product = await fetchProductFromSQL(productId);
      await typesenseClient
        .collections('products')
        .documents()
        .upsert(product);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
```

### 7.3 Monitoring Collection Health

```typescript
// scripts/checkCollectionHealth.ts
async function checkCollectionHealth() {
  const collection = await typesenseClient
    .collections('products')
    .retrieve();

  console.log('Collection Stats:');
  console.log('- Name:', collection.name);
  console.log('- Document Count:', collection.num_documents);
  console.log('- Fields:', collection.fields.length);
  
  // Compare with SQL Server count
  const sqlCount = await getProductCountFromSQL();
  console.log('- SQL Server Count:', sqlCount);
  console.log('- Difference:', Math.abs(collection.num_documents - sqlCount));
}
```

### 7.4 Reindexing Strategy

```bash
# Full reindex workflow
npx tsx scripts/createProductCollection.ts --recreate
npx tsx scripts/indexProducts.ts
npx tsx scripts/checkCollectionHealth.ts
```

---

## Performance Tips

1. **Indexing Speed**: Use batch imports with `action: 'upsert'`
2. **Query Optimization**: Search across `item_no`, `item_no2`, and `description` for best results
3. **Caching**: Cache frequently searched queries on the server side
4. **Pagination**: Always implement pagination to limit result sets
5. **Sorting**: Default sorting by `item_no` provides consistent results

## Security Best Practices

1. Never expose admin API key to client-side code
2. Use search-only keys for client-side searches
3. Implement rate limiting on search endpoints
4. Validate and sanitize all search inputs
5. Use scoped API keys with filters for multi-tenant applications

## Troubleshooting

**Connection Issues:**
- Verify Typesense server is running: `curl http://localhost:8108/health`
- Check API key is correct
- Ensure network connectivity and firewall rules

**Import Failures:**
- Check document matches schema exactly
- Verify required fields are present
- Check data type compatibility
- Review error messages in import results

**Search Not Working:**
- Verify collection exists and has documents
- Check `query_by` fields are indexed
- Ensure filter syntax is correct
- Test with simple queries first

---

## Additional Resources

- [Typesense Documentation](https://typesense.org/docs/)
- [Typesense API Reference](https://typesense.org/docs/latest/api/)
- [Search Parameters Guide](https://typesense.org/docs/latest/api/search.html)
- [Typesense Cloud](https://cloud.typesense.org/) (Managed hosting option)
