import { NextRequest, NextResponse } from 'next/server';
import { fetchFromLaravel } from '@/libs/dynamicAPI';
import { resolveLaravelEndpoint } from '@/libs/laravelRouteMap';
import { fetchGitLabTree } from '@/libs/github';

function extractOwnerAndRepo(url: string): { owner: string; repo: string } | null {
  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split('/').filter(Boolean);

    if (segments.length >= 2) {
      return { owner: segments[0], repo: segments[1] };
    }
  } catch (err) {
    console.error('❌ Invalid GitLab URL:', err);
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  const { endpoint } = await params;
  const guest = req.nextUrl.searchParams.get('guest') === 'true';

  const laravelEndpoint = resolveLaravelEndpoint(endpoint, 'GET');
  if (!laravelEndpoint) {
    return NextResponse.json({ error: 'Invalid laravelEndpoint' }, { status: 404 });
  }

  // ✅ GitLab tree handler
  if (laravelEndpoint === 'github') {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const parsed = extractOwnerAndRepo(url);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitLab URL' }, { status: 400 });
    }

    try {
      const tree = await fetchGitLabTree(parsed.owner, parsed.repo);
      return NextResponse.json(tree);
    } catch (err) {
      console.error('❌ GitLab tree error:', err);
      return NextResponse.json(
        { error: 'Failed to fetch GitLab tree' },
        { status: 500 }
      );
    }
  }

  // ✅ Default Laravel proxy
  try {
    const result = await fetchFromLaravel(
      laravelEndpoint,
      'GET',
      undefined,
      undefined,
      guest
    );

    if (result.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(result, { status: result.status || 200 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  const body = await req.json();
  const { endpoint } = await params;

  const laravelEndpoint = resolveLaravelEndpoint(endpoint, 'POST', body);
  const guest = req.nextUrl.searchParams.get('guest') === 'true';

  if (!laravelEndpoint) {
    return NextResponse.json(
      { error: 'Invalid laravelEndpoint or missing type' },
      { status: 400 }
    );
  }

  try {
    const result = await fetchFromLaravel(
      laravelEndpoint,
      'POST',
      undefined,
      body,
      guest
    );

    if (result.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(result, { status: result.status || 200 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
