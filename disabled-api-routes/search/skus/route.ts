import { NextRequest, NextResponse } from 'next/server';
import { typesenseSearchService } from '@/lib/services/typesense';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate parameters
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    if (limit > 50) {
      return NextResponse.json(
        { error: 'limit cannot exceed 50' },
        { status: 400 }
      );
    }

    // Search products using Typesense
    const searchResults = await typesenseSearchService.searchProducts({
      q: query.trim(),
      queryBy: 'item_no,item_no2,description',
      sortBy: '_text_match:desc',
      page: 1,
      perPage: limit
    });

    // Transform Typesense products to SKU format
    const skus = searchResults.hits.map(hit => ({
      id: hit.document.id,
      sku: hit.document.item_no,
      name: hit.document.description,
      category: 'Products', // Default category since it's not in ProductDocument
      currentStock: 0, // This would need to come from inventory system
      isActive: true,
      lastUsed: null,
      // Additional fields that might be useful
      itemNo2: hit.document.item_no2,
      client: hit.document.client,
      textMatch: hit.text_match
    }));

    return NextResponse.json({
      success: true,
      data: skus
    });

  } catch (error) {
    console.error('SKU search API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'SKU search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}