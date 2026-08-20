import assert from 'node:assert/strict';
import { buildGoogleMapsUrl, normalizeWebsiteUrl, resolveGoogleMapsUrl, validateGoogleMapsUrl, validateWebsiteUrl } from './businessLinks';
import { DataProcessor } from './processor';

const placeId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
const exactMapsUri = 'https://www.google.com/maps/place/?q=place_id:ChIJN1t_tDeuEmsRUsoyG83frY4';

assert.equal(normalizeWebsiteUrl(' www.example.com/services '), 'https://www.example.com/services');
assert.equal(normalizeWebsiteUrl('https://www.google.com/maps/place/test'), null);
assert.equal(validateWebsiteUrl('https://example.com'), true);
assert.equal(validateWebsiteUrl('https://www.google.com/search?q=business'), false);

assert.equal(validateGoogleMapsUrl(exactMapsUri, placeId), true);
assert.equal(validateGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=Salon', placeId), false);
assert.equal(resolveGoogleMapsUrl({ provider: 'google_places', placeId, googleMapsUri: exactMapsUri, placeName: 'Exact Salon' }), exactMapsUri);
const builtUrl = buildGoogleMapsUrl(placeId, 'Exact Salon')!;
assert.equal(new URL(builtUrl).searchParams.get('query_place_id'), placeId);
assert.equal(resolveGoogleMapsUrl({ provider: 'mock', placeId, placeName: 'Demo Salon' }), null);

const records = DataProcessor.processAndDeduplicate([{
  provider: 'google_places', placeId, title: 'Exact Salon', websiteUri: 'www.example.com',
  googleMapsUri: exactMapsUri, location: { lat: 28.7, lng: 77.1 }
}]);
assert.equal(records.length, 1);
assert.equal(records[0].google_maps_url, exactMapsUri);
assert.equal(records[0].website, 'https://www.example.com/');

console.log('Business link normalization tests passed.');
