const GOOGLE_MAPS_HOSTS = new Set([
  'google.com', 'www.google.com', 'maps.google.com', 'www.maps.google.com',
  'maps.app.goo.gl', 'goo.gl'
]);

function toUrl(value: string | null | undefined): URL | null {
  if (!value || !value.trim()) return null;
  try { return new URL(value.trim()); } catch { return null; }
}

export function normalizeWebsiteUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = value.trim().replace(/\s/g, '');
  const url = toUrl(/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
  if (!url || !['http:', 'https:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.includes('google.') || host.includes('maps.google') || host.includes('googleusercontent.') || host.includes('facebook.') || host.includes('instagram.') || host.includes('linkedin.')) return null;
  return url.toString();
}

export function validateWebsiteUrl(value: string | null | undefined): boolean {
  return normalizeWebsiteUrl(value) !== null;
}

export function extractPlaceId(value: string | null | undefined): string | null {
  const url = toUrl(value);
  if (!url) return null;
  const queryPlaceId = url.searchParams.get('query_place_id');
  if (queryPlaceId && queryPlaceId.trim()) return queryPlaceId.trim();

  const q = url.searchParams.get('q');
  if (q) {
    const match = q.match(/place_id:([A-Za-z0-9_-]+)/);
    if (match && match[1]) return match[1].trim();
  }

  const dataMatch = url.pathname.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
  if (dataMatch && dataMatch[1]) return dataMatch[1].trim();

  return null;
}

export function validateGoogleMapsUrl(value: string | null | undefined, placeId?: string | null): boolean {
  const url = toUrl(value);
  if (!url) return false;
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  const isGoogleHost = GOOGLE_MAPS_HOSTS.has(host) || host.endsWith('.google.com');
  if (!isGoogleHost) return false;
  if (host === 'maps.app.goo.gl' || (host === 'goo.gl' && url.pathname.startsWith('/maps'))) return true;
  const path = url.pathname.toLowerCase();
  const isMapsUrl = path.includes('/maps') || path.includes('/place') || path.includes('/search');
  if (!isMapsUrl) return false;

  const extractedId = extractPlaceId(value);

  // Search URLs (/search) are generic queries unless query_place_id is explicitly set
  if (path.includes('/search')) {
    const queryPlaceId = url.searchParams.get('query_place_id');
    if (!queryPlaceId || !queryPlaceId.trim()) return false;
    if (placeId && queryPlaceId.trim() !== placeId.trim()) return false;
    return true;
  }

  if (placeId && extractedId && extractedId !== placeId.trim()) {
    return false;
  }

  return true;
}

export function buildGoogleMapsUrl(placeId: string | null | undefined, placeName?: string | null | undefined, address?: string | null): string | null {
  if (!placeId || !placeId.trim()) return null;
  const cleanPlaceId = placeId.trim();
  const query = [placeName?.trim(), address?.trim()].filter(Boolean).join(', ') || 'Google';
  const params = new URLSearchParams({ api: '1' });
  params.set('query', query);
  params.set('query_place_id', cleanPlaceId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function resolveGoogleMapsUrl(input: { provider?: string | null; placeId?: string | null; googleMapsUri?: string | null; placeName?: string | null; address?: string | null }): string | null {
  const provider = (input.provider || '').toLowerCase();
  if (provider === 'mock') {
    if (input.googleMapsUri && validateGoogleMapsUrl(input.googleMapsUri, input.placeId)) {
      return input.googleMapsUri.trim();
    }
    return null;
  }

  if (validateGoogleMapsUrl(input.googleMapsUri, input.placeId)) return input.googleMapsUri!.trim();
  if (input.placeId && input.placeId.trim()) {
    return buildGoogleMapsUrl(input.placeId, input.placeName, input.address);
  }
  return null;
}
