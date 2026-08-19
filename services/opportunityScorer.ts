import {
  OPPORTUNITY_SCORING,
  OPPORTUNITY_THRESHOLDS,
  OpportunityLevel,
  WebsiteStatus,
  RATING_STRONG_THRESHOLD,
  REVIEW_COUNT_THRESHOLD,
  CATEGORY_WEIGHT_STRONG_THRESHOLD,
  COMMERCIAL_BUSINESS_STATUSES,
} from '../config/opportunityConfig';

export interface OpportunityInput {
  websiteStatus: WebsiteStatus;
  hasPhone: boolean;
  rating: number | null;
  reviewCount: number | null;
  hasInstagram: boolean;
  hasFacebook: boolean;
  businessStatus: string | null;
  categoryWeight: number; // websiteOpportunityWeight from BusinessCategory
  opportunityEligible: boolean;
  hasEmail: boolean;
}

export interface OpportunityResult {
  score: number;
  level: OpportunityLevel;
  signals: string[];
}

/**
 * Deterministic opportunity scorer.
 * Produces a 0-100 score based on configurable signals.
 * NOT AI-based, NOT random.
 */
export class OpportunityScorer {
  static score(input: OpportunityInput): OpportunityResult {
    // If category is not eligible for website sales, immediately classify as NOT_TARGET
    if (!input.opportunityEligible) {
      return { score: 0, level: 'NOT_TARGET', signals: ['Category not eligible for website sales'] };
    }

    const signals: string[] = [];
    let score = 0;

    // Signal: No verified website (primary driver)
    if (input.websiteStatus === 'NO_WEBSITE' || input.websiteStatus === 'UNKNOWN') {
      score += OPPORTUNITY_SCORING.NO_WEBSITE;
      signals.push('No verified official website');
    } else if (input.websiteStatus === 'LOW_QUALITY_WEBSITE') {
      score += OPPORTUNITY_SCORING.LOW_QUALITY_WEBSITE;
      signals.push('Low-quality website detected');
    }

    // Signal: Phone available (can be reached)
    if (input.hasPhone) {
      score += OPPORTUNITY_SCORING.HAS_PHONE;
      signals.push('Phone number available');
    }

    // Signal: Strong rating
    if (input.rating !== null && input.rating >= RATING_STRONG_THRESHOLD) {
      score += OPPORTUNITY_SCORING.STRONG_RATING;
      signals.push(`Strong rating: ${input.rating.toFixed(1)}★`);
    }

    // Signal: Meaningful review count
    if (input.reviewCount !== null && input.reviewCount >= REVIEW_COUNT_THRESHOLD) {
      score += OPPORTUNITY_SCORING.MEANINGFUL_REVIEWS;
      signals.push(`${input.reviewCount} reviews`);
    }

    // Signal: Social presence without website
    if ((input.hasInstagram || input.hasFacebook) &&
        (input.websiteStatus === 'NO_WEBSITE' || input.websiteStatus === 'UNKNOWN')) {
      score += OPPORTUNITY_SCORING.SOCIAL_PRESENCE;
      signals.push('Social media presence without a website');
    }

    // Signal: High-value category
    if (input.categoryWeight >= CATEGORY_WEIGHT_STRONG_THRESHOLD) {
      score += OPPORTUNITY_SCORING.STRONG_CATEGORY;
      signals.push('Category has strong website opportunity');
    }

    // Signal: Active business
    if (input.businessStatus &&
        COMMERCIAL_BUSINESS_STATUSES.some(s => input.businessStatus!.toLowerCase().includes(s.toLowerCase()))) {
      score += OPPORTUNITY_SCORING.ACTIVE_BUSINESS;
      signals.push('Active business');
    } else if (!input.businessStatus) {
      // Unknown status — still give partial credit
      score += Math.round(OPPORTUNITY_SCORING.ACTIVE_BUSINESS * 0.5);
    }

    // Signal: Has email but no website
    if (input.hasEmail &&
        (input.websiteStatus === 'NO_WEBSITE' || input.websiteStatus === 'UNKNOWN')) {
      score += OPPORTUNITY_SCORING.HAS_EMAIL_NO_WEBSITE;
      signals.push('Has email contact but no website');
    }

    // Cap score at 100
    score = Math.min(100, score);

    // Classify level
    let level: OpportunityLevel;
    if (score >= OPPORTUNITY_THRESHOLDS.HIGH) {
      level = 'HIGH';
    } else if (score >= OPPORTUNITY_THRESHOLDS.MEDIUM) {
      level = 'MEDIUM';
    } else if (score >= OPPORTUNITY_THRESHOLDS.LOW) {
      level = 'LOW';
    } else {
      level = 'NOT_TARGET';
    }

    return { score, level, signals };
  }
}
