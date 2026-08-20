const GOOGLE_MAPS_HOSTS = new Set(['google.com', 'www.google.com', 'maps.google.com', 'www.maps.google.com']);

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
  if (!url || url.protocol !== 'https:' || !GOOGLE_MAPS_HOSTS.has(url.hostname.toLowerCase())) return false;
  const path = url.pathname.toLowerCase();
  const isMapsUrl = path.includes('/maps/') || path.includes('/maps') || path.includes('/place/') || path.includes('/search/');
  if (!isMapsUrl) return false;
  const queryPlaceId = url.searchParams.get('query_place_id');
  if (queryPlaceId && placeId && queryPlaceId !== placeId) return false;
  // A search URL is exact only when it carries the matching Google Place ID.
  if (path.includes('/search/') && !queryPlaceId) return false;
  return true;
}

export function buildGoogleMapsUrl(placeId: string | null | undefined, placeName: string | null | undefined): string | null {
  if (!placeId || !placeName) return null;
  const params = new URLSearchParams({ api: '1', query: placeName, query_place_id: placeId });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function resolveGoogleMapsUrl(input: { provider?: string | null; placeId?: string | null; googleMapsUri?: string | null; placeName?: string | null }): string | null {
  if (validateGoogleMapsUrl(input.googleMapsUri, input.placeId)) return input.googleMapsUri!.trim();
  // Google Places and Apify Place IDs can safely be converted into exact Google Maps URLs.
  const provider = input.provider?.toLowerCase();
  if (input.placeId && input.placeName && (provider === 'google_places' || provider === 'apify')) {
    return buildGoogleMapsUrl(input.placeId, input.placeName);
  }
  return null;
}
