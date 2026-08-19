// ==========================================
// BIZRANK OPPORTUNITY SCORING CONFIGURATION
// Deterministic, configurable scoring rules
// DO NOT put scoring logic in the UI
// ==========================================

export const OPPORTUNITY_SCORING = {
  // +25: No verified official website (primary signal)
  NO_WEBSITE: 25,
  // +15: Phone number available (can be contacted)
  HAS_PHONE: 15,
  // +10: Strong rating (>= 4.0)
  STRONG_RATING: 10,
  // +10: Meaningful review count (>= 10 reviews)
  MEANINGFUL_REVIEWS: 10,
  // +10: Social presence without a website (Instagram / Facebook URL found)
  SOCIAL_PRESENCE: 10,
  // +10: Category has strong website value (websiteOpportunityWeight >= 0.85)
  STRONG_CATEGORY: 10,
  // +10: Business is active (businessStatus = OPERATIONAL or similar)
  ACTIVE_BUSINESS: 10,
  // +5: Business has email but no website
  HAS_EMAIL_NO_WEBSITE: 5,
  // +5: Low-quality website (broken, outdated, poor mobile)
  LOW_QUALITY_WEBSITE: 5,
} as const;

export const OPPORTUNITY_THRESHOLDS = {
  HIGH: 70,    // >= 70: HIGH opportunity
  MEDIUM: 45,  // >= 45: MEDIUM opportunity
  LOW: 20,     // >= 20: LOW opportunity
  // Below 20: NOT_TARGET
} as const;

export type OpportunityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_TARGET' | 'UNKNOWN';

export type WebsiteStatus =
  | 'UNKNOWN'           // Not yet checked
  | 'NO_WEBSITE'        // Confirmed no website
  | 'WEBSITE_FOUND'     // URL provided by provider, not yet verified
  | 'WEBSITE_VERIFIED'  // Audit confirmed working site
  | 'LOW_QUALITY_WEBSITE'; // Site exists but poor quality

// Rating threshold for "strong rating" signal
export const RATING_STRONG_THRESHOLD = 4.0;
// Review count threshold for "meaningful reviews" signal
export const REVIEW_COUNT_THRESHOLD = 10;
// Category weight threshold for "strong category" signal
export const CATEGORY_WEIGHT_STRONG_THRESHOLD = 0.85;

// Category types that indicate a commercial local business
export const COMMERCIAL_BUSINESS_STATUSES = [
  'OPERATIONAL',
  'Open',
  'open',
  'OPEN',
];
