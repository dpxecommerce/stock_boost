import { NextRequest, NextResponse } from 'next/server';
import { typesenseSearchService } from '@/lib/services/typesense';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '*';
    const queryBy = searchParams.get('query_by') || 'item_no,item_no2,description,client';
    const filterBy = searchParams.get('filter_by') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');

    // Validate parameters
    if (perPage > 100) {
      return NextResponse.json(
        { error: 'per_page cannot exceed 100' },
        { status: 400 }
      );
    }

    const searchResults = await typesenseSearchService.searchProducts({
      q: query,
      queryBy,
      filterBy,
      page,
      perPage
    });

    return NextResponse.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('Product search API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Product search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Support POST for complex search queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      q = '*',
      queryBy = 'item_no,item_no2,description,client',
      filterBy,
      sortBy,
      page = 1,
      perPage = 10 
    } = body;

    // Validate parameters
    if (perPage > 100) {
      return NextResponse.json(
        { error: 'per_page cannot exceed 100' },
        { status: 400 }
      );
    }

    const searchResults = await typesenseSearchService.searchProducts({
      q,
      queryBy,
      filterBy,
      sortBy,
      page,
      perPage
    });

    return NextResponse.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('Product search API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Product search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}