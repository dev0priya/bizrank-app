import { OpportunityScorer } from './opportunityScorer';

// ==========================================
// UNIT TESTS: OpportunityScorer
// ==========================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n==========================================');
  console.log('OPPORTUNITY SCORER — UNIT TESTS');
  console.log('==========================================\n');

  // -------------------------------------------
  // Test 1: No website + phone + strong category = HIGH
  // -------------------------------------------
  console.log('Test 1: Strong opportunity signals (no website + phone + strong cat)');
  const result1 = OpportunityScorer.score({
    websiteStatus: 'NO_WEBSITE',
    hasPhone: true,
    rating: 4.5,
    reviewCount: 50,
    hasInstagram: false,
    hasFacebook: false,
    businessStatus: 'OPERATIONAL',
    categoryWeight: 0.92, // e.g. Hotel
    opportunityEligible: true,
    hasEmail: false,
  });
  assert(result1.level === 'HIGH', `Level should be HIGH — got ${result1.level} (score: ${result1.score})`);
  assert(result1.score >= 70, `Score should be >= 70 — got ${result1.score}`);
  assert(result1.signals.some(s => s.includes('No verified official website')), 'Should signal no website');
  assert(result1.signals.some(s => s.includes('Phone number available')), 'Should signal phone');
  assert(result1.signals.some(s => s.includes('Strong rating')), 'Should signal strong rating');

  // -------------------------------------------
  // Test 2: NOT_TARGET for ATM
  // -------------------------------------------
  console.log('\nTest 2: ATM — NOT_TARGET');
  const result2 = OpportunityScorer.score({
    websiteStatus: 'NO_WEBSITE',
    hasPhone: true,
    rating: 3.0,
    reviewCount: 5,
    hasInstagram: false,
    hasFacebook: false,
    businessStatus: 'OPERATIONAL',
    categoryWeight: 0.0,
    opportunityEligible: false, // ATM, government office, etc.
    hasEmail: false,
  });
  assert(result2.level === 'NOT_TARGET', `Level should be NOT_TARGET — got ${result2.level}`);
  assert(result2.score === 0, `Score should be 0 — got ${result2.score}`);

  // -------------------------------------------
  // Test 3: Verified website = lower score
  // -------------------------------------------
  console.log('\nTest 3: Business with verified website should score lower');
  const result3 = OpportunityScorer.score({
    websiteStatus: 'WEBSITE_VERIFIED',
    hasPhone: true,
    rating: 4.5,
    reviewCount: 100,
    hasInstagram: false,
    hasFacebook: false,
    businessStatus: 'OPERATIONAL',
    categoryWeight: 0.90,
    opportunityEligible: true,
    hasEmail: false,
  });
  const resultNoWebsite = OpportunityScorer.score({
    websiteStatus: 'NO_WEBSITE',
    hasPhone: true,
    rating: 4.5,
    reviewCount: 100,
    hasInstagram: false,
    hasFacebook: false,
    businessStatus: 'OPERATIONAL',
    categoryWeight: 0.90,
    opportunityEligible: true,
    hasEmail: false,
  });
  assert(result3.score < resultNoWebsite.score, `Verified website (${result3.score}) should score less than no website (${resultNoWebsite.score})`);
  assert(!result3.signals.some(s => s.includes('No verified official website')), 'Should NOT signal no website');

  // -------------------------------------------
  // Test 4: Low quality website
  // -------------------------------------------
  console.log('\nTest 4: Low quality website — partial score');
  const result4 = OpportunityScorer.score({
    websiteStatus: 'LOW_QUALITY_WEBSITE',
    hasPhone: true,
    rating: 3.5,
    reviewCount: 20,
    hasInstagram: true,
    hasFacebook: false,
    businessStatus: 'OPERATIONAL',
    categoryWeight: 0.88,
    opportunityEligible: true,
    hasEmail: false,
  });
  assert(result4.signals.some(s => s.includes('Low-quality website')), 'Should signal low quality website');

  // -------------------------------------------
  // Test 5: Social media without website = extra bonus
  // -------------------------------------------
  console.log('\nTest 5: Social media without website = SOCIAL_PRESENCE bonus');
  const withSocial = OpportunityScorer.score({
    websiteStatus: 'NO_WEBSITE',
    hasPhone: false,
    rating: null,
    reviewCount: null,
    hasInstagram: true,
    hasFacebook: false,
    businessStatus: null,
    categoryWeight: 0.85,
    opportunityEligible: true,
    hasEmail: false,
  });
  const withoutSocial = OpportunityScorer.score({
    websiteStatus: 'NO_WEBSITE',
    hasPhone: false,
    rating: null,
    reviewCount: null,
    hasInstagram: false,
    hasFacebook: false,
    businessStatus: null,
    categoryWeight: 0.85,
    opportunityEligible: true,
    hasEmail: false,
  });
  assert(withSocial.score > withoutSocial.score, `Social presence (${withSocial.score}) should score higher than no social (${withoutSocial.score})`);
  assert(withSocial.signals.some(s => s.includes('Social media')), 'Should signal social presence');

  // -------------------------------------------
  // Test 6: Score is deterministic (same inputs = same output)
  // -------------------------------------------
  console.log('\nTest 6: Score is deterministic');
  const input = {
    websiteStatus: 'NO_WEBSITE' as const,
    hasPhone: true,
    rating: 4.0,
    reviewCount: 25,
    hasInstagram: false,
    hasFacebook: true,
    businessStatus: 'Open',
    categoryWeight: 0.90,
    opportunityEligible: true,
    hasEmail: true,
  };
  const run1 = OpportunityScorer.score(input);
  const run2 = OpportunityScorer.score(input);
  const run3 = OpportunityScorer.score(input);
  assert(run1.score === run2.score && run2.score === run3.score, `All 3 runs should produce same score: ${run1.score}, ${run2.score}, ${run3.score}`);

  // -------------------------------------------
  // Test 7: Score never exceeds 100
  // -------------------------------------------
  console.log('\nTest 7: Score is capped at 100');
  const maxSignals = OpportunityScorer.score({
    websiteStatus: 'NO_WEBSITE',
    hasPhone: true,
    rating: 5.0,
    reviewCount: 1000,
    hasInstagram: true,
    hasFacebook: true,
    businessStatus: 'OPERATIONAL',
    categoryWeight: 1.0,
    opportunityEligible: true,
    hasEmail: true,
  });
  assert(maxSignals.score <= 100, `Score should be <= 100, got ${maxSignals.score}`);

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n==========================================');
  if (failed === 0) {
    console.log(`ALL ${passed} TESTS PASSED ✅`);
  } else {
    console.log(`${passed} passed, ${failed} FAILED ❌`);
  }
  console.log('==========================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error('Test runner crashed:', e);
  process.exit(1);
});
