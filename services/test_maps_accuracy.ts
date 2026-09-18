import assert from 'node:assert/strict';
import {
  buildGoogleMapsUrl,
  buildNameAndAddressMapsUrl,
  extractPlaceId,
  getBusinessMapsUrl,
  isCanonicalPlaceUrl,
  resolveGoogleMapsUrl,
  validateGoogleMapsUrl
} from './businessLinks';
import { DataProcessor } from './processor';

console.log('--- Starting Comprehensive Google Maps Accuracy Tests ---');

// =========================================================================
// TEST CASE 1: Exact User Example - Restaurant Name + Full Address URL Generation
// =========================================================================
console.log('1. Testing exact user example for Restaurant Name + Full Address URL generation...');
const userExampleBiz = {
  business_name: 'ABC Restaurant',
  full_address: '123 MG Road, Delhi, India',
  google_maps_url: null
};

const generatedUrl = getBusinessMapsUrl(userExampleBiz);
const expectedUrl = 'https://www.google.com/maps/search/?api=1&query=ABC%20Restaurant%2C%20123%20MG%20Road%2C%20Delhi%2C%20India';

assert.equal(generatedUrl, expectedUrl, 'Generated URL must exactly match the required format and encoding');
console.log(`   ✅ Passed: Generated URL matches expected format exactly:\n      ${generatedUrl}`);

// =========================================================================
// TEST CASE 2: Same-Name Multiple Restaurants Isolation (Different Addresses)
// =========================================================================
console.log('2. Testing multiple restaurants with identical names resolve to their own exact locations...');
const branchDelhi = {
  business_name: 'Paradise Biryani',
  full_address: 'Plot 12, Connaught Place, New Delhi, India',
  google_maps_url: null
};

const branchBangalore = {
  business_name: 'Paradise Biryani',
  full_address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka, India',
  google_maps_url: null
};

const branchHyderabad = {
  business_name: 'Paradise Biryani',
  full_address: 'MG Road, Secunderabad, Telangana, India',
  google_maps_url: null
};

const urlDelhi = getBusinessMapsUrl(branchDelhi)!;
const urlBangalore = getBusinessMapsUrl(branchBangalore)!;
const urlHyderabad = getBusinessMapsUrl(branchHyderabad)!;

assert.ok(urlDelhi.includes(encodeURIComponent('Connaught Place, New Delhi')), 'Delhi branch URL must contain Delhi address');
assert.ok(urlBangalore.includes(encodeURIComponent('Indiranagar, Bengaluru')), 'Bangalore branch URL must contain Bangalore address');
assert.ok(urlHyderabad.includes(encodeURIComponent('Secunderabad, Telangana')), 'Hyderabad branch URL must contain Hyderabad address');

assert.notEqual(urlDelhi, urlBangalore, 'Delhi and Bangalore branch URLs must be strictly different');
assert.notEqual(urlBangalore, urlHyderabad, 'Bangalore and Hyderabad branch URLs must be strictly different');
assert.notEqual(urlDelhi, urlHyderabad, 'Delhi and Hyderabad branch URLs must be strictly different');
console.log('   ✅ Passed: Same-name restaurants open their own exact addresses, not nearby or similar branches.');

// =========================================================================
// TEST CASE 3: "Unavailable" ONLY When Address Is Genuinely Missing
// =========================================================================
console.log('3. Testing "Unavailable" (null) is returned ONLY when location data is genuinely missing...');
const bizNoAddress = {
  business_name: 'Ghost Restaurant',
  full_address: null,
  city: null,
  state: null,
  google_maps_url: null
};

const bizEmptyAddress = {
  business_name: 'Ghost Restaurant',
  full_address: '   ',
  city: null,
  state: null,
  google_maps_url: null
};

const bizWithCityStateOnly = {
  business_name: 'City Cafe',
  full_address: null,
  city: 'Jaipur',
  state: 'Rajasthan',
  google_maps_url: null
};

assert.equal(getBusinessMapsUrl(bizNoAddress), null, 'Must return null (Maps Unavailable) when address is genuinely missing');
assert.equal(getBusinessMapsUrl(bizEmptyAddress), null, 'Must return null (Maps Unavailable) when address is empty whitespace');
assert.ok(getBusinessMapsUrl(bizWithCityStateOnly)?.includes('Jaipur%2C%20Rajasthan'), 'Must construct location when city and state exist');
console.log('   ✅ Passed: "Unavailable" returned only when genuinely no usable address exists.');

// =========================================================================
// TEST CASE 4: Rejection of Generic Name-Only Queries (No Wrong Nearby Restaurant)
// =========================================================================
console.log('4. Testing generic name-only search URLs are rejected to prevent opening wrong restaurants...');
assert.equal(
  validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=ABC+Restaurant'),
  false,
  'Generic name-only query must be rejected'
);
assert.equal(
  validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=Pizza+Hut'),
  false,
  'Name-only chain query must be rejected'
);
assert.equal(
  validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=ABC%20Restaurant%2C%20123%20MG%20Road%2C%20Delhi%2C%20India'),
  true,
  'Proper name + address query must be accepted'
);
console.log('   ✅ Passed: Name-only queries rejected, preventing Google Maps from guessing nearby branches.');

// =========================================================================
// TEST CASE 5: Existing Bad Name-Only URL Overridden by Exact Name + Address
// =========================================================================
console.log('5. Testing bad legacy name-only URL in DB is overridden by exact name + address...');
const legacyBadBiz = {
  business_name: 'ABC Restaurant',
  full_address: '123 MG Road, Delhi, India',
  google_maps_url: 'https://www.google.com/maps/search/?api=1&query=ABC+Restaurant' // old bad URL
};

const fixedUrl = getBusinessMapsUrl(legacyBadBiz);
assert.equal(fixedUrl, expectedUrl, 'Old bad name-only URL must be replaced by exact name + address URL');
console.log('   ✅ Passed: Legacy bad name-only URLs are automatically replaced by exact name + address.');

// =========================================================================
// TEST CASE 6: Canonical Place URLs Are Preserved Directly
// =========================================================================
console.log('6. Testing preservation of canonical Maps URLs (short links, place detail links, CID)...');
const canonicalPlaceUrl = 'https://www.google.com/maps/place/ABC+Dental/@28.6139,77.2090,17z/data=!4m6!3m5!1s0x390cfd37b0!8m2!3d28.6139!4d77.2090';
const canonicalShortUrl = 'https://maps.app.goo.gl/abcdef123456';
const cidUrl = 'https://maps.google.com/?cid=12345678901234567890';

assert.equal(isCanonicalPlaceUrl(canonicalPlaceUrl), true);
assert.equal(isCanonicalPlaceUrl(canonicalShortUrl), true);
assert.equal(isCanonicalPlaceUrl(cidUrl), true);
assert.equal(isCanonicalPlaceUrl('https://www.google.com/maps/search/?api=1&query=Test'), false);

const bizCanonical = {
  business_name: 'ABC Dental',
  full_address: '123 MG Road, Delhi, India',
  google_maps_url: canonicalPlaceUrl
};
assert.equal(getBusinessMapsUrl(bizCanonical), canonicalPlaceUrl, 'Canonical place URL must be preserved');
console.log('   ✅ Passed: Canonical place URLs are preserved directly.');

// =========================================================================
// TEST CASE 7: Deduplication Retains Distinct Businesses
// =========================================================================
console.log('7. Testing deduplication retains distinct businesses with same name...');
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

const deduplicated = DataProcessor.processAndDeduplicate([bizA_raw, bizB_raw]);
assert.equal(deduplicated.length, 2, 'Deduplication must NOT collapse businesses with different addresses/place IDs');
console.log('   ✅ Passed: Both businesses are preserved during deduplication.');

// =========================================================================
// TEST CASE 8: Security and Hostname Validation
// =========================================================================
console.log('8. Testing security validation (HTTPS only, valid Google domains only)...');
assert.equal(
  validateGoogleMapsUrl('http://www.google.com/maps/search/?api=1&query=ABC%2C%20Delhi'),
  false,
  'Insecure HTTP must be rejected'
);
assert.equal(
  validateGoogleMapsUrl('https://evil-phishing.com/maps/search/?api=1&query=ABC%2C%20Delhi'),
  false,
  'Phishing/non-Google domain must be rejected'
);
assert.equal(
  validateGoogleMapsUrl('javascript:alert(1)'),
  false,
  'XSS payload must be rejected'
);
console.log('   ✅ Passed: Protocol and hostname security rules enforced.');

console.log('\n=============================================================');
console.log('🎉 ALL GOOGLE MAPS ACCURACY & IDENTITY TESTS PASSED!');
console.log('=============================================================\n');
