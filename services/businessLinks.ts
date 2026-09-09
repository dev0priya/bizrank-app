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

export function validateGoogleMapsUrl(value: string | null | undefined, placeId?: string | null): boolean {
  const url = toUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  const isGoogleHost = GOOGLE_MAPS_HOSTS.has(host) || host.endsWith('.google.com');
  if (!isGoogleHost) return false;
  if (host === 'maps.app.goo.gl' || host === 'goo.gl') return true;
  const path = url.pathname.toLowerCase();
  const isMapsUrl = path.includes('/maps') || path.includes('/place') || path.includes('/search');
  if (!isMapsUrl) return false;
  const queryPlaceId = url.searchParams.get('query_place_id');
  if (queryPlaceId && placeId && queryPlaceId !== placeId) return false;
  return true;
}

export function buildGoogleMapsUrl(placeId: string | null | undefined, placeName: string | null | undefined, address?: string | null): string | null {
  if (!placeName && !placeId) return null;
  const query = [placeName, address].filter(Boolean).join(', ');
  const params = new URLSearchParams({ api: '1' });
  if (query) params.set('query', query);
  if (placeId) params.set('query_place_id', placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function resolveGoogleMapsUrl(input: { provider?: string | null; placeId?: string | null; googleMapsUri?: string | null; placeName?: string | null; address?: string | null }): string | null {
  if (validateGoogleMapsUrl(input.googleMapsUri, input.placeId)) return input.googleMapsUri!.trim();
  if (input.placeId && input.placeName) {
    return buildGoogleMapsUrl(input.placeId, input.placeName, input.address);
  }
  if (input.placeName) {
    return buildGoogleMapsUrl(input.placeId, input.placeName, input.address);
  }
  return null;
}
