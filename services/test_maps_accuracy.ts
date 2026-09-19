import assert from 'node:assert/strict';
import {
  buildCompleteAddress,
  buildGoogleMapsUrl,
  buildNameAndAddressMapsUrl,
  extractPlaceId,
  getBusinessMapsUrl,
  isExactGoogleMapsUrl,
  resolveGoogleMapsUrl,
  validateGoogleMapsUrl
} from './businessLinks';
import { DataProcessor } from './processor';

console.log('--- Starting Comprehensive Google Maps Accuracy Tests ---');

// =========================================================================
// TEST CASE 1: Exact User Example (XYZ Salon) - Name + Complete Address + City
// =========================================================================
console.log('1. Testing exact user example: XYZ Salon (Shop 12, Main Market, Sector 18, Noida, Uttar Pradesh)...');
const userExampleSalon = {
  business_name: 'XYZ Salon',
  full_address: 'Shop 12, Main Market, Sector 18, Noida, Uttar Pradesh',
  city: 'Noida',
  state: 'Uttar Pradesh',
  google_maps_url: null,
  place_id: null
};

const generatedSalonUrl = getBusinessMapsUrl(userExampleSalon);
const expectedSalonUrl = 'https://www.google.com/maps/search/?api=1&query=XYZ%20Salon%2C%20Shop%2012%2C%20Main%20Market%2C%20Sector%2018%2C%20Noida%2C%20Uttar%20Pradesh';

assert.equal(generatedSalonUrl, expectedSalonUrl, 'Generated Salon URL must exactly match user required format and encoding');
console.log(`   ✅ Passed: XYZ Salon URL generated exactly:\n      ${generatedSalonUrl}`);

// =========================================================================
// TEST CASE 2: Priority 1 - Exact Google Maps URL / Place Identifier in Existing Data
// =========================================================================
console.log('2. Testing Priority 1: Exact Maps URL with query_place_id is preserved directly...');
const dbRecordWithPlaceIdUrl = {
  business_name: 'La Grande Boucherie',
  place_id: 'ChIJ58OtM8pZwokRbd6DT6gcVys',
  google_maps_url: 'https://www.google.com/maps/search/?api=1&query=La%20Grande%20Boucherie&query_place_id=ChIJ58OtM8pZwokRbd6DT6gcVys',
  full_address: '145 W 53rd St, New York, NY 10019'
};

const resolvedDbUrl = getBusinessMapsUrl(dbRecordWithPlaceIdUrl);
assert.equal(resolvedDbUrl, dbRecordWithPlaceIdUrl.google_maps_url, 'Must preserve existing exact Google Maps URL containing query_place_id');
assert.ok(isExactGoogleMapsUrl(dbRecordWithPlaceIdUrl.google_maps_url), 'isExactGoogleMapsUrl must recognize URLs with query_place_id');
console.log(`   ✅ Passed: Existing exact Google Maps URL preserved without degrading to generic search:\n      ${resolvedDbUrl}`);

// =========================================================================
// TEST CASE 3: Priority 2 - Place Identifier (place_id) Generates Exact Place Search
// =========================================================================
console.log('3. Testing Priority 2: When place_id is present without pre-existing URL...');
const bizWithPlaceIdOnly = {
  business_name: 'Manhatta',
  place_id: 'ChIJoTXWl8dbwokRpKA2BJFVsGA',
  google_maps_url: null,
  full_address: '28 Liberty St 60th floor, New York, NY 10005'
};

const resolvedPlaceIdUrl = getBusinessMapsUrl(bizWithPlaceIdOnly)!;
assert.ok(resolvedPlaceIdUrl.includes('query_place_id=ChIJoTXWl8dbwokRpKA2BJFVsGA'), 'Generated URL must include exact query_place_id');
assert.ok(resolvedPlaceIdUrl.includes(encodeURIComponent('Manhatta')), 'Generated URL must include business name');
console.log(`   ✅ Passed: Place ID URL accurately generated:\n      ${resolvedPlaceIdUrl}`);

// =========================================================================
// TEST CASE 4: Verification Across All 6 Business Categories
// =========================================================================
console.log('4. Testing exact Google Maps location generation across all 6 business categories...');
const categoriesTestCases = [
  {
    category: '1. Restaurant',
    biz: {
      business_name: 'Bukhara Restaurant',
      full_address: 'ITC Maurya, Diplomatic Enclave, Sardar Patel Marg, New Delhi, Delhi',
      city: 'New Delhi',
      state: 'Delhi'
    },
    expectedSubstring: encodeURIComponent('Bukhara Restaurant, ITC Maurya, Diplomatic Enclave, Sardar Patel Marg, New Delhi, Delhi')
  },
  {
    category: '2. Store',
    biz: {
      business_name: 'Fabindia Store',
      full_address: 'Connaught Place, Block C, Inner Circle, New Delhi, Delhi',
      city: 'New Delhi',
      state: 'Delhi'
    },
    expectedSubstring: encodeURIComponent('Fabindia Store, Connaught Place, Block C, Inner Circle, New Delhi, Delhi')
  },
  {
    category: '3. Salon',
    biz: {
      business_name: 'XYZ Salon',
      full_address: 'Shop 12, Main Market, Sector 18, Noida, Uttar Pradesh',
      city: 'Noida',
      state: 'Uttar Pradesh'
    },
    expectedSubstring: encodeURIComponent('XYZ Salon, Shop 12, Main Market, Sector 18, Noida, Uttar Pradesh')
  },
  {
    category: '4. Dental Clinic',
    biz: {
      business_name: 'Clove Dental Clinic',
      full_address: 'A-23, Central Market, Lajpat Nagar II, New Delhi, Delhi',
      city: 'New Delhi',
      state: 'Delhi'
    },
    expectedSubstring: encodeURIComponent('Clove Dental Clinic, A-23, Central Market, Lajpat Nagar II, New Delhi, Delhi')
  },
  {
    category: '5. Gym',
    biz: {
      business_name: "Gold's Gym",
      full_address: 'Plot 8, Sector 14, Gurugram, Haryana',
      city: 'Gurugram',
      state: 'Haryana'
    },
    expectedSubstring: encodeURIComponent("Gold's Gym, Plot 8, Sector 14, Gurugram, Haryana")
  },
  {
    category: '6. Institute',
    biz: {
      business_name: 'FIITJEE Institute',
      full_address: 'Sarvapriya Vihar, Kalu Sarai, New Delhi, Delhi',
      city: 'New Delhi',
      state: 'Delhi'
    },
    expectedSubstring: encodeURIComponent('FIITJEE Institute, Sarvapriya Vihar, Kalu Sarai, New Delhi, Delhi')
  }
];

for (const tc of categoriesTestCases) {
  const url = getBusinessMapsUrl(tc.biz);
  assert.ok(url, `${tc.category} must generate a valid Maps URL`);
  assert.ok(url.includes(tc.expectedSubstring), `${tc.category} URL must contain complete business name, address, and city`);
  assert.ok(!url.includes('undefined'), `${tc.category} URL must not contain undefined`);
  console.log(`   ✅ Passed [${tc.category}]:\n      ${url}`);
}

// =========================================================================
// TEST CASE 5: Same-Name Businesses in Different Cities Never Conflict
// =========================================================================
console.log('5. Testing same-name businesses in different cities never conflate or open nearby branch...');
const gymDelhi = {
  business_name: 'Anytime Fitness',
  full_address: 'Main Market, Malviya Nagar, New Delhi, Delhi'
};
const gymMumbai = {
  business_name: 'Anytime Fitness',
  full_address: 'Link Road, Andheri West, Mumbai, Maharashtra'
};

const urlGymDelhi = getBusinessMapsUrl(gymDelhi)!;
const urlGymMumbai = getBusinessMapsUrl(gymMumbai)!;

assert.notEqual(urlGymDelhi, urlGymMumbai, 'Delhi and Mumbai branches must produce different URLs');
assert.ok(urlGymDelhi.includes(encodeURIComponent('Malviya Nagar, New Delhi')), 'Delhi branch must open Delhi address');
assert.ok(urlGymMumbai.includes(encodeURIComponent('Andheri West, Mumbai')), 'Mumbai branch must open Mumbai address');
console.log('   ✅ Passed: Same-name businesses resolve strictly to their own respective addresses.');

// =========================================================================
// TEST CASE 6: "Unavailable" ONLY When Location Data Is Genuinely Missing
// =========================================================================
console.log('6. Testing "Unavailable" (null) triggers ONLY when address/location is genuinely missing...');
const bizNoLocation = {
  business_name: 'Mystery Business',
  full_address: null,
  city: null,
  state: null,
  google_maps_url: null,
  place_id: null
};

const bizWhitespaceOnly = {
  business_name: 'Mystery Business',
  full_address: '   ',
  city: null,
  state: null,
  google_maps_url: null,
  place_id: null
};

assert.equal(getBusinessMapsUrl(bizNoLocation), null, 'Must return null (Maps Unavailable) when all location data is missing');
assert.equal(getBusinessMapsUrl(bizWhitespaceOnly), null, 'Must return null (Maps Unavailable) when address is blank whitespace');

// When address IS available, it must NEVER be Unavailable
assert.ok(getBusinessMapsUrl({ business_name: 'Test Store', full_address: '10 Main St, Delhi' }), 'Must NOT be unavailable when address exists');
console.log('   ✅ Passed: "Unavailable" is never shown when address is available.');

// =========================================================================
// TEST CASE 7: Generic Name-Only Queries Strictly Rejected
// =========================================================================
console.log('7. Testing generic name-only search URLs are rejected...');
assert.equal(validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=ABC+Restaurant'), false);
assert.equal(validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=XYZ+Salon'), false);
assert.equal(validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=XYZ%20Salon%2C%20Noida'), true);
console.log('   ✅ Passed: Generic name-only URLs rejected, address-qualified URLs accepted.');

// =========================================================================
// TEST CASE 8: Canonical Formats (shortlink, place detail, cid) Preserved
// =========================================================================
console.log('8. Testing canonical Google Maps URL formats (shortlink, /place/, cid) are preserved...');
const shortUrl = 'https://maps.app.goo.gl/xyz123';
const cidUrl = 'https://maps.google.com/?cid=9876543210';
const placeUrl = 'https://www.google.com/maps/place/XYZ+Salon/@28.57,77.32,17z/data=!4m6!3m5!1s0x390ce5';

assert.equal(getBusinessMapsUrl({ business_name: 'XYZ', google_maps_url: shortUrl }), shortUrl);
assert.equal(getBusinessMapsUrl({ business_name: 'XYZ', google_maps_url: cidUrl }), cidUrl);
assert.equal(getBusinessMapsUrl({ business_name: 'XYZ', google_maps_url: placeUrl }), placeUrl);
console.log('   ✅ Passed: Direct canonical place links preserved.');

console.log('\n=============================================================');
console.log('🎉 ALL 8 GOOGLE MAPS ACCURACY & CATEGORY TESTS PASSED!');
console.log('=============================================================\n');

