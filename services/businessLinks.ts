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

  // Search URLs (/search)
  if (path.includes('/search')) {
    const queryPlaceId = url.searchParams.get('query_place_id');
    if (queryPlaceId && queryPlaceId.trim()) {
      if (placeId && queryPlaceId.trim() !== placeId.trim()) return false;
      return true;
    }
    // If a specific placeId was expected but URL lacks query_place_id, reject
    if (placeId) return false;
    
    // Exact name + address queries contain commas/address parts
    const query = url.searchParams.get('query');
    if (query && query.includes(',')) {
      return true;
    }
    return false;
  }

  if (placeId && extractedId && extractedId !== placeId.trim()) {
    return false;
  }

  return true;
}

export function isExactGoogleMapsUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const url = toUrl(value);
  if (!url || url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (host === 'maps.app.goo.gl' || (host === 'goo.gl' && url.pathname.startsWith('/maps'))) return true;
  if (!GOOGLE_MAPS_HOSTS.has(host) && !host.endsWith('.google.com')) return false;

  const path = url.pathname.toLowerCase();
  
  // 1. Direct place URL: /maps/place/...
  if (path.includes('/place/')) return true;

  // 2. CID URL: ?cid=...
  if (url.searchParams.has('cid')) return true;

  // 3. Search URL with explicit Place ID: query_place_id=...
  const queryPlaceId = url.searchParams.get('query_place_id');
  if (queryPlaceId && queryPlaceId.trim() && !queryPlaceId.includes('mock')) return true;

  // 4. Place ID query: ?q=place_id:...
  const q = url.searchParams.get('q');
  if (q && q.includes('place_id:')) return true;

  // 5. Data parameter containing place ID (!1sChIJ...)
  if (path.match(/!1s(ChIJ[A-Za-z0-9_-]+)/)) return true;

  return false;
}

export function isCanonicalPlaceUrl(value: string | null | undefined): boolean {
  return isExactGoogleMapsUrl(value);
}

export function buildCompleteAddress(business: {
  full_address?: string | null;
  city?: { name?: string | null } | string | null;
  state?: { name?: string | null } | string | null;
  area?: { name?: string | null } | string | null;
}): string | null {
  const fullAddr = business.full_address?.trim() || '';
  if (!fullAddr) {
    // If no full_address exists from the scraper, NEVER fabricate an address from search query location
    return null;
  }

  // The scraped full address from the listing is the true address — preserve 100% verbatim
  // NEVER append search parameters, search city, or search state
  return fullAddr;
}

export function buildGoogleMapsUrl(placeId: string | null | undefined, placeName?: string | null | undefined, address?: string | null): string | null {
  if (!placeId || !placeId.trim()) return null;
  const cleanPlaceId = placeId.trim();
  const query = [placeName?.trim(), address?.trim()].filter(Boolean).join(', ') || 'Google';
  const encodedQuery = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}&query_place_id=${encodeURIComponent(cleanPlaceId)}`;
}

export function buildNameAndAddressMapsUrl(name?: string | null, address?: string | null): string | null {
  const cleanName = name?.trim();
  const cleanAddress = address?.trim();
  if (!cleanName || !cleanAddress) return null;

  const query = `${cleanName}, ${cleanAddress}`;
  const encodedQuery = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
}

export function resolveGoogleMapsUrl(input: {
  provider?: string | null;
  placeId?: string | null;
  googleMapsUri?: string | null;
  placeName?: string | null;
  address?: string | null;
}): string | null {
  const provider = (input.provider || '').toLowerCase();
  if (provider === 'mock') {
    if (input.googleMapsUri && validateGoogleMapsUrl(input.googleMapsUri, input.placeId)) {
      return input.googleMapsUri.trim();
    }
    return null;
  }

  // 1. Direct exact/canonical place URL
  if (isExactGoogleMapsUrl(input.googleMapsUri)) {
    return input.googleMapsUri!.trim();
  }

  // 2. Exact Place ID if available
  if (input.placeId && input.placeId.trim() && !input.placeId.includes('mock')) {
    return buildGoogleMapsUrl(input.placeId, input.placeName, input.address);
  }

  // 3. Exact restaurant/business name + full address query
  const cleanName = input.placeName?.trim();
  const cleanAddress = input.address?.trim();
  if (cleanName && cleanAddress && cleanName.toLowerCase() !== 'unknown') {
    return buildNameAndAddressMapsUrl(cleanName, cleanAddress);
  }

  // 4. Valid search URL already present
  if (validateGoogleMapsUrl(input.googleMapsUri, input.placeId)) {
    return input.googleMapsUri!.trim();
  }

  return null;
}

export function getBusinessMapsUrl(business?: {
  google_maps_url?: string | null;
  business_name?: string | null;
  full_address?: string | null;
  place_id?: string | null;
  city?: { name?: string | null } | string | null;
  state?: { name?: string | null } | string | null;
  area?: { name?: string | null } | string | null;
  latitude?: number | null;
  longitude?: number | null;
} | null): string | null {
  if (!business) return null;

  const rawMapsUrl = business.google_maps_url?.trim() || null;
  const rawPlaceId = (business.place_id?.trim() || extractPlaceId(rawMapsUrl)) || null;
  const name = business.business_name?.trim();
  const completeAddress = buildCompleteAddress(business);

  // 1. FIRST PRIORITY: Existing exact Google Maps URL (Place URL, CID, shortlink, or query_place_id)
  if (rawMapsUrl && isExactGoogleMapsUrl(rawMapsUrl)) {
    return rawMapsUrl;
  }

  // 2. SECOND PRIORITY: Exact Place ID available
  if (rawPlaceId && !rawPlaceId.includes('mock')) {
    const query = [name, completeAddress].filter(Boolean).join(', ') || 'Business';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=${encodeURIComponent(rawPlaceId)}`;
  }

  // 3. THIRD PRIORITY: Existing valid Maps URL from scraper (already containing query_place_id or verified details)
  if (rawMapsUrl && validateGoogleMapsUrl(rawMapsUrl, rawPlaceId)) {
    return rawMapsUrl;
  }

  // 4. FOURTH PRIORITY: Exact Listing Name + Exact Scraped Listing Address (only when full listing address is present)
  if (name && name.toLowerCase() !== 'unknown' && completeAddress) {
    const query = `${name}, ${completeAddress}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  // Fallback: If no exact Place ID, canonical URL, or verified address exists,
  // do NOT generate URLs from coordinates or name alone. Return null ("Maps Unavailable").
  return null;
}
