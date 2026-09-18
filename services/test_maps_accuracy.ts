import assert from 'node:assert/strict';
import {
  buildGoogleMapsUrl,
  extractPlaceId,
  resolveGoogleMapsUrl,
  validateGoogleMapsUrl
} from './businessLinks';
import { DataProcessor } from './processor';

console.log('--- Starting Comprehensive Google Maps Accuracy Tests ---');

// =========================================================================
// TEST CASE 1: Exact Place ID Isolation (Two businesses with identical names)
// =========================================================================
console.log('1. Testing exact Place ID isolation for identically named businesses...');
const bizA_raw = {
  provider: 'google_places',
  placeId: 'PLACE_ID_A',
  title: 'ABC Dental Clinic',
  address: '123 Main St, New Delhi',
  googleMapsUri: null
};

const bizB_raw = {
  provider: 'google_places',
  placeId: 'PLACE_ID_B',
  title: 'ABC Dental Clinic',
  address: '456 Market St, New Delhi',
  googleMapsUri: null
};

const urlA = resolveGoogleMapsUrl({
  provider: bizA_raw.provider,
  placeId: bizA_raw.placeId,
  placeName: bizA_raw.title,
  address: bizA_raw.address
})!;

const urlB = resolveGoogleMapsUrl({
  provider: bizB_raw.provider,
  placeId: bizB_raw.placeId,
  placeName: bizB_raw.title,
  address: bizB_raw.address
})!;

assert.ok(urlA, 'Business A must produce a Maps URL');
assert.ok(urlB, 'Business B must produce a Maps URL');
assert.notEqual(urlA, urlB, 'Business A and Business B URLs must be strictly different');

const parsedUrlA = new URL(urlA);
const parsedUrlB = new URL(urlB);

assert.equal(parsedUrlA.searchParams.get('query_place_id'), 'PLACE_ID_A', 'Business A URL must point to PLACE_ID_A');
assert.equal(parsedUrlB.searchParams.get('query_place_id'), 'PLACE_ID_B', 'Business B URL must point to PLACE_ID_B');
console.log('   ✅ Passed: Business A and B URLs resolve to their exact respective Place IDs.');

// =========================================================================
// TEST CASE 2: Deduplication with same name but distinct Place IDs
// =========================================================================
console.log('2. Testing deduplication retains distinct businesses with same name...');
const deduplicated = DataProcessor.processAndDeduplicate([bizA_raw, bizB_raw]);
assert.equal(deduplicated.length, 2, 'Deduplication must NOT collapse businesses with different place IDs');
assert.equal(deduplicated[0].place_id, 'PLACE_ID_A');
assert.equal(deduplicated[1].place_id, 'PLACE_ID_B');
console.log('   ✅ Passed: Both businesses are preserved during deduplication.');

// =========================================================================
// TEST CASE 3: Business with Missing Maps ID
// =========================================================================
console.log('3. Testing business with missing Maps ID does NOT fallback to name-only search...');
const missingMapsBiz = {
  provider: 'apify',
  placeId: null,
  title: 'Unknown Small Salon',
  address: 'Somewhere in Rohini',
  googleMapsUri: null
};

const resolvedMissing = resolveGoogleMapsUrl({
  provider: missingMapsBiz.provider,
  placeId: missingMapsBiz.placeId,
  placeName: missingMapsBiz.title,
  address: missingMapsBiz.address
});

assert.equal(resolvedMissing, null, 'Must NOT generate a name-based Maps URL when Place ID is missing');
assert.equal(buildGoogleMapsUrl(null, 'Unknown Small Salon'), null, 'buildGoogleMapsUrl must return null without placeId');
assert.equal(buildGoogleMapsUrl('', 'Unknown Small Salon'), null, 'buildGoogleMapsUrl must return null for empty placeId');
console.log('   ✅ Passed: Missing Maps identifier cleanly returns null (no generic name fallback).');

// =========================================================================
// TEST CASE 4: Business with Canonical Maps URL
// =========================================================================
console.log('4. Testing preservation of canonical Maps URLs...');
const canonicalPlaceUrl = 'https://www.google.com/maps/place/ABC+Dental/@28.6139,77.2090,17z/data=!4m6!3m5!1s0x390cfd37b0!8m2!3d28.6139!4d77.2090';
const canonicalShortUrl = 'https://maps.app.goo.gl/abcdef123456';

const resolvedCanonical1 = resolveGoogleMapsUrl({
  provider: 'apify',
  placeId: '0x390cfd37b0',
  googleMapsUri: canonicalPlaceUrl,
  placeName: 'ABC Dental'
});
assert.equal(resolvedCanonical1, canonicalPlaceUrl, 'Canonical place URL must be preserved');

const resolvedCanonical2 = resolveGoogleMapsUrl({
  provider: 'apify',
  googleMapsUri: canonicalShortUrl,
  placeName: 'ABC Dental'
});
assert.equal(resolvedCanonical2, canonicalShortUrl, 'Canonical short link must be preserved');
console.log('   ✅ Passed: Canonical Maps URLs are preserved.');

// =========================================================================
// TEST CASE 5: Generic Search Query Rejection
// =========================================================================
console.log('5. Testing generic name-only search URLs are rejected by validateGoogleMapsUrl...');
assert.equal(
  validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=ABC+Dental+Clinic'),
  false,
  'Generic name-only search URL must be rejected'
);
assert.equal(
  validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=Salon&city=Delhi'),
  false,
  'Generic query with city must be rejected'
);
assert.equal(
  validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=ABC&query_place_id=PLACE_ID_A', 'PLACE_ID_B'),
  false,
  'URL with mismatched place ID must be rejected'
);
assert.equal(
  validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=ABC&query_place_id=PLACE_ID_A', 'PLACE_ID_A'),
  true,
  'URL with matching place ID must be accepted'
);
console.log('   ✅ Passed: Unreliable search URLs are rejected, exact Place ID search URLs are accepted.');

// =========================================================================
// TEST CASE 6: Security & URL Protocol Validation
// =========================================================================
console.log('6. Testing security validation (HTTPS only, valid Google domains only)...');
assert.equal(
  validateGoogleMapsUrl('http://www.google.com/maps/search/?api=1&query=Google&query_place_id=PLACE_ID_A'),
  false,
  'Insecure HTTP must be rejected'
);
assert.equal(
  validateGoogleMapsUrl('https://attacker.evil.com/maps/search/?api=1&query=Google&query_place_id=PLACE_ID_A'),
  false,
  'Phishing/non-Google domain must be rejected'
);
assert.equal(
  validateGoogleMapsUrl('javascript:alert(1)'),
  false,
  'XSS payload must be rejected'
);
console.log('   ✅ Passed: Protocol and hostname security rules enforced.');

// =========================================================================
// TEST CASE 7: Place ID Extraction from URLs
// =========================================================================
console.log('7. Testing Place ID extraction from canonical Google Maps URLs...');
assert.equal(
  extractPlaceId('https://www.google.com/maps/search/?api=1&query=Clinic&query_place_id=ChIJ12345XYZ'),
  'ChIJ12345XYZ'
);
assert.equal(
  extractPlaceId('https://www.google.com/maps/place/?q=place_id:ChIJ67890ABC'),
  'ChIJ67890ABC'
);
assert.equal(
  extractPlaceId('https://www.google.com/maps/place/Salon/@28.7,77.1,17z/data=!4m2!3m1!1sChIJ_abc_123'),
  'ChIJ_abc_123'
);
assert.equal(
  extractPlaceId('https://www.google.com/maps/search/?api=1&query=OnlyName'),
  null
);
console.log('   ✅ Passed: Place IDs extracted correctly.');

// =========================================================================
// TEST CASE 8: CRM Deduplication Isolation (Business A vs Business B)
// =========================================================================
console.log('8. Testing CRM deduplication isolation for same-name businesses...');
// Simulating the duplicate conditions logic in app/api/crm/leads/route.ts
function getCrmDuplicateConditions(business: { place_id?: string | null; google_maps_url?: string | null; phone_number?: string | null }) {
  const duplicateConditions: Array<Record<string, string | null>> = [];
  const trimmedPlaceId = business.place_id?.trim();
  const trimmedMapsUrl = business.google_maps_url?.trim();

  if (trimmedPlaceId) {
    duplicateConditions.push({ place_id: trimmedPlaceId });
  } else if (trimmedMapsUrl) {
    duplicateConditions.push({ google_maps_url: trimmedMapsUrl });
  } else {
    const trimmedPhone = business.phone_number?.trim();
    if (trimmedPhone) {
      duplicateConditions.push({ phone_number: trimmedPhone, place_id: null });
    }
  }
  return duplicateConditions;
}

const condA = getCrmDuplicateConditions({ place_id: 'PLACE_ID_A', google_maps_url: urlA });
const condB = getCrmDuplicateConditions({ place_id: 'PLACE_ID_B', google_maps_url: urlB });

assert.deepEqual(condA, [{ place_id: 'PLACE_ID_A' }]);
assert.deepEqual(condB, [{ place_id: 'PLACE_ID_B' }]);
assert.notDeepEqual(condA, condB, 'CRM duplicate conditions for Business A and Business B must not overlap');
console.log('   ✅ Passed: CRM duplicate logic protects against cross-conflating separate branches.');

// =========================================================================
// TEST CASE 9: Mock Provider Handling
// =========================================================================
console.log('9. Testing mock provider handling does not leak fake Maps URLs...');
const mockResult = resolveGoogleMapsUrl({
  provider: 'mock',
  placeId: 'ChIJ12345mock',
  placeName: 'Demo Mock Dental'
});
assert.equal(mockResult, null, 'Mock provider must not generate unverified Maps URLs');
console.log('   ✅ Passed: Mock provider places do not generate fake Maps URLs.');

console.log('\n=============================================================');
console.log('🎉 ALL GOOGLE MAPS ACCURACY & IDENTITY TESTS PASSED!');
console.log('=============================================================\n');
