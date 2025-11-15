# Typesense Product Search Helper

This helper class provides an easy way to search products using Typesense in your Next.js application.

## Setup

1. **Environment Variables**: Add the following to your `.env.local`:
```bash
NEXT_PUBLIC_TYPESENSE_HOST=search.dpxefs.com
NEXT_PUBLIC_TYPESENSE_PORT=443
NEXT_PUBLIC_TYPESENSE_PROTOCOL=https
NEXT_PUBLIC_TYPESENSE_API_KEY=your_api_key_here
```

2. **Install Dependencies**: Typesense client is already installed:
```bash
npm install typesense
```

## Usage

### Direct Service Usage

```typescript
import { typesenseSearchService } from '@/lib/services/typesense';

// Basic search
const results = await typesenseSearchService.searchProducts({
  q: 'laptop',
  perPage: 20
});

// Search by item number
const products = await typesenseSearchService.searchByItemNumber('ITEM001');

// Get suggestions for autocomplete
const suggestions = await typesenseSearchService.getProductSuggestions('lap');
```

### React Hook Usage

```typescript
import { useProductSearch } from '@/hooks/use-product-search';

function ProductSearchComponent() {
  const { products, loading, error } = useProductSearch({
    query: 'laptop',
    perPage: 10
  });

  return (
    <div>
      {loading && <p>Searching...</p>}
      {error && <p>Error: {error}</p>}
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.item_no}</h3>
          <p>{product.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### API Route Usage

```typescript
// pages/api/search.ts or app/api/search/route.ts
import { typesenseSearchService } from '@/lib/services/typesense';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  
  const results = await typesenseSearchService.searchProducts({
    q: query,
    perPage: 10
  });
  
  return Response.json(results);
}
```

### Using the ProductSearch Component

```tsx
import ProductSearch from '@/components/ProductSearch';

function MyPage() {
  const handleProductSelect = (product) => {
    console.log('Selected:', product);
  };

  return (
    <ProductSearch 
      onSelectProduct={handleProductSelect}
      placeholder="Search for products..."
    />
  );
}
```

## Available Methods

### TypesenseSearchService

- `searchProducts(params)` - General product search
- `searchByItemNumber(itemNo)` - Search by item number
- `searchByDescription(description)` - Search by description
- `searchByClient(client)` - Filter by client
- `getProductSuggestions(query, limit)` - Get autocomplete suggestions
- `healthCheck()` - Check Typesense server health
- `getCollectionStats()` - Get collection statistics

### Search Parameters

```typescript
interface ProductSearchParams {
  q: string;              // Search query
  queryBy?: string;       // Fields to search in
  filterBy?: string;      // Filter expression
  sortBy?: string;        // Sort expression
  page?: number;          // Page number (1-based)
  perPage?: number;       // Results per page
}
```

## API Endpoints

The helper includes a built-in API route at `/api/search/products`:

```bash
# GET request
curl "http://localhost:3000/api/search/products?q=laptop&per_page=10&page=1"

# Equivalent to your original curl command:
curl "http://localhost:3000/api/search/products?q=*&query_by=item_no,item_no2,description,client&per_page=10&page=1"
```

## Examples

Check `/src/lib/examples/typesense-examples.ts` for more detailed usage examples including:
- Advanced filtering
- Pagination
- Error handling
- Health checks

## Testing

Run the tests to ensure everything is working:

```bash
npm test tests/lib/services/typesense.test.ts
```

## Type Definitions

All TypeScript interfaces are available in `/src/types/typesense.ts`:
- `ProductDocument`
- `ProductSearchParams`  
- `ProductSearchResponse`
- `ProductSearchHit`