/**
 * Lead Scoring System
 * 
 * A deterministic, explainable scoring algorithm for prioritizing outbound sales leads.
 * 
 * SCORING LOGIC:
 * - Base score: 50 points
 * - Final score clamped between 0-100
 * - Higher score = higher priority for calling
 * 
 * This module is designed to be easily understood and modified by non-ML engineers.
 */

// ============================================
// CONFIGURATION - Adjust weights here
// ============================================

const SCORING_CONFIG = {
    BASE_SCORE: 50,
    MIN_SCORE: 0,
    MAX_SCORE: 100,

    // Positive signals (add points)
    MOBILE_NUMBER_BONUS: 15,           // Mobile = likely owner/decision-maker
    HIGH_RATING_BONUS: 10,             // Rating >= 4.5 = quality business
    SMALL_OPERATOR_BONUS: 10,          // No corporate indicators = SMB
    EXTENDED_HOURS_BONUS: 10,          // 24/7 or late hours = high demand
    URBAN_POSTCODE_BONUS: 5,           // Dense area = higher value

    // Negative signals (subtract points)
    FREEPHONE_PENALTY: -15,            // 0800 = call center/gatekeeper
    LARGE_CHAIN_PENALTY: -10,          // Franchise = harder sell
    RECEPTIONIST_SIGNALS_PENALTY: -10, // "Reception" in website = gatekeepers
    LOW_REVIEWS_PENALTY: -5,           // <10 reviews = new/inactive business

    // Thresholds
    HIGH_RATING_THRESHOLD: 4.5,
    LOW_REVIEW_COUNT_THRESHOLD: 10,
};

// Corporate/franchise indicators in business names
const CORPORATE_INDICATORS = [
    'group', 'holdings', 'plc', 'corporation', 'corp',
    'international', 'global', 'national', 'franchise',
    'mcdonald', 'costa', 'starbucks', 'subway', 'kfc',
    'tesco', 'sainsbury', 'asda', 'morrisons'
];

// Small operator indicators (positive)
const SMALL_OPERATOR_INDICATORS = [
    'local', 'family', 'independent', 'est.', 'since',
    'son', 'sons', 'brothers', 'sisters', '& son'
];

// Receptionist/gatekeeper signals in website text
const RECEPTIONIST_SIGNALS = [
    'reception', 'receptionist', 'office team',
    'call centre', 'call center', 'switchboard',
    'main office', 'head office', 'customer service team'
];

// Urban/dense UK postcodes (first 2-3 characters)
const URBAN_POSTCODES = [
    'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9',
    'EC', 'WC', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12',
    'SW', 'SE', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11',
    'NW', 'M1', 'M2', 'M3', 'M4', 'B1', 'B2', 'B3', 'B4', 'B5',
    'L1', 'L2', 'L3', 'L4', 'L5', 'G1', 'G2', 'G3', 'G4',
    'EH1', 'EH2', 'EH3', 'CF1', 'CF2', 'CF10', 'LS1', 'LS2'
];


// ============================================
// MAIN SCORING FUNCTION
// ============================================

/**
 * Score a lead from 0-100 based on available metadata.
 * 
 * @param {Object} lead - Lead object with the following optional fields:
 *   - phone_number: string
 *   - rating: number (0-5)
 *   - total_ratings: number
 *   - business_name: string
 *   - address: string (should contain postcode)
 *   - opening_hours: string
 *   - website_text: string (optional, scraped website content)
 * 
 * @returns {Object} {
 *   score: number (0-100),
 *   band: string ('Call first' | 'High potential' | 'Medium' | 'Low priority'),
 *   reasons: string[] (array of contributing factors),
 *   explanation: string (formatted explanation)
 * }
 */
export function scoreLead(lead) {
    let score = SCORING_CONFIG.BASE_SCORE;
    const positiveReasons = [];
    const negativeReasons = [];

    // ----------------------------------------
    // 1. PHONE NUMBER ANALYSIS
    // ----------------------------------------
    const phone = (lead.phone_number || '').replace(/\s+/g, '');

    // Check for mobile number (07xxx in UK)
    if (isMobileNumber(phone)) {
        score += SCORING_CONFIG.MOBILE_NUMBER_BONUS;
        positiveReasons.push('Mobile number detected — likely owner/decision-maker');
    }

    // Check for freephone/call-centre numbers (0800, 0808)
    if (isFreephoneNumber(phone)) {
        score += SCORING_CONFIG.FREEPHONE_PENALTY;
        negativeReasons.push('Freephone number — may have gatekeepers');
    }

    // ----------------------------------------
    // 2. GOOGLE RATING ANALYSIS
    // ----------------------------------------
    if (lead.rating >= SCORING_CONFIG.HIGH_RATING_THRESHOLD) {
        score += SCORING_CONFIG.HIGH_RATING_BONUS;
        positiveReasons.push(`High Google rating (${lead.rating}★)`);
    }

    // Check for low review count
    if (lead.total_ratings !== undefined && lead.total_ratings < SCORING_CONFIG.LOW_REVIEW_COUNT_THRESHOLD) {
        score += SCORING_CONFIG.LOW_REVIEWS_PENALTY;
        negativeReasons.push(`Low review count (${lead.total_ratings} reviews)`);
    } else if (lead.total_ratings >= 50) {
        // Bonus insight for high review count (not scored, just noted)
        positiveReasons.push(`Strong review count (${lead.total_ratings} reviews)`);
    }

    // ----------------------------------------
    // 3. BUSINESS NAME ANALYSIS
    // ----------------------------------------
    const businessName = (lead.business_name || '').toLowerCase();

    // Check for corporate/franchise indicators
    if (hasCorporateIndicators(businessName)) {
        score += SCORING_CONFIG.LARGE_CHAIN_PENALTY;
        negativeReasons.push('Large chain or franchise detected');
    }

    // Check for small operator signals
    if (hasSmallOperatorIndicators(businessName)) {
        score += SCORING_CONFIG.SMALL_OPERATOR_BONUS;
        positiveReasons.push('Small/family business indicators');
    }

    // ----------------------------------------
    // 4. LOCATION ANALYSIS
    // ----------------------------------------
    const postcode = extractPostcode(lead.address);
    if (postcode && isUrbanPostcode(postcode)) {
        score += SCORING_CONFIG.URBAN_POSTCODE_BONUS;
        positiveReasons.push('Urban/dense location');
    }

    // ----------------------------------------
    // 5. OPENING HOURS ANALYSIS
    // ----------------------------------------
    const hours = (lead.opening_hours || '').toLowerCase();
    if (hasExtendedHours(hours)) {
        score += SCORING_CONFIG.EXTENDED_HOURS_BONUS;
        positiveReasons.push('Extended/24-hour availability');
    }

    // ----------------------------------------
    // 6. WEBSITE TEXT ANALYSIS (if available)
    // ----------------------------------------
    const websiteText = (lead.website_text || '').toLowerCase();
    if (hasReceptionistSignals(websiteText)) {
        score += SCORING_CONFIG.RECEPTIONIST_SIGNALS_PENALTY;
        negativeReasons.push('Website mentions reception/call centre');
    }

    // ----------------------------------------
    // CALCULATE FINAL SCORE
    // ----------------------------------------

    // Clamp score between 0-100
    score = Math.max(SCORING_CONFIG.MIN_SCORE, Math.min(SCORING_CONFIG.MAX_SCORE, score));

    // Round to nearest integer
    score = Math.round(score);

    // Determine score band
    const band = getScoreBand(score);

    // Combine reasons
    const reasons = [...positiveReasons, ...negativeReasons];

    // Generate explanation string
    const explanation = generateExplanation(score, positiveReasons, negativeReasons);

    return {
        score,
        band,
        reasons,
        explanation,
        // Include breakdown for debugging/display
        breakdown: {
            positive: positiveReasons,
            negative: negativeReasons
        }
    };
}


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if phone number is a UK mobile (07xxx)
 */
function isMobileNumber(phone) {
    return /^(\+44|0)7\d{9}$/.test(phone) || phone.startsWith('07');
}

/**
 * Check if phone number is freephone (0800, 0808)
 */
function isFreephoneNumber(phone) {
    return /^0800|^0808/.test(phone);
}

/**
 * Check if business name contains corporate/franchise indicators
 */
function hasCorporateIndicators(name) {
    return CORPORATE_INDICATORS.some(indicator => name.includes(indicator));
}

/**
 * Check if business name suggests small operator
 */
function hasSmallOperatorIndicators(name) {
    return SMALL_OPERATOR_INDICATORS.some(indicator => name.includes(indicator));
}

/**
 * Extract UK postcode from address string
 */
function extractPostcode(address) {
    if (!address) return null;
    const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d?[A-Z]{0,2}/i);
    return match ? match[0].toUpperCase().replace(/\s+/g, '') : null;
}

/**
 * Check if postcode is in an urban/dense area
 */
function isUrbanPostcode(postcode) {
    const prefix = postcode.substring(0, 3);
    const shortPrefix = postcode.substring(0, 2);
    return URBAN_POSTCODES.includes(prefix) || URBAN_POSTCODES.includes(shortPrefix);
}

/**
 * Check if opening hours indicate extended availability
 */
function hasExtendedHours(hours) {
    const extendedIndicators = ['24', '24/7', '24 hour', 'all day', 'always open'];
    return extendedIndicators.some(indicator => hours.includes(indicator));
}

/**
 * Check if website text mentions receptionist/gatekeeper signals
 */
function hasReceptionistSignals(text) {
    return RECEPTIONIST_SIGNALS.some(signal => text.includes(signal));
}

/**
 * Determine score band label
 */
function getScoreBand(score) {
    if (score >= 80) return 'Call first';
    if (score >= 60) return 'High potential';
    if (score >= 40) return 'Medium';
    return 'Low priority';
}

/**
 * Get CSS class for score band styling
 */
export function getScoreBandClass(band) {
    switch (band) {
        case 'Call first': return 'score-band--call-first';
        case 'High potential': return 'score-band--high';
        case 'Medium': return 'score-band--medium';
        case 'Low priority': return 'score-band--low';
        default: return '';
    }
}

/**
 * Get color for score (for visual indicators)
 */
export function getScoreColor(score) {
    if (score >= 80) return '#22c55e'; // Green
    if (score >= 60) return '#3b82f6'; // Blue
    if (score >= 40) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
}

/**
 * Generate human-readable explanation string
 */
function generateExplanation(score, positiveReasons, negativeReasons) {
    let explanation = `Score: ${score}\n`;

    positiveReasons.forEach(reason => {
        explanation += `  + ${reason}\n`;
    });

    negativeReasons.forEach(reason => {
        explanation += `  − ${reason}\n`;
    });

    if (positiveReasons.length === 0 && negativeReasons.length === 0) {
        explanation += '  (No specific signals detected)\n';
    }

    return explanation.trim();
}


// ============================================
// MOCK LEADS FOR TESTING
// ============================================

export const MOCK_LEADS = [
    {
        id: 'mock-1',
        business_name: 'John Smith Plumbing',
        phone_number: '07777 123456',
        rating: 4.8,
        total_ratings: 127,
        address: '12 High Street, London W1A 1AA',
        category: 'plumber',
        status: 'new'
    },
    {
        id: 'mock-2',
        business_name: 'FastFix Group Holdings PLC',
        phone_number: '0800 123 4567',
        rating: 3.2,
        total_ratings: 892,
        address: '100 Corporate Park, Milton Keynes MK9 2AA',
        category: 'plumber',
        website_text: 'Contact our reception team during office hours',
        status: 'new'
    },
    {
        id: 'mock-3',
        business_name: 'Local Family Electricians',
        phone_number: '07890 654321',
        rating: 4.9,
        total_ratings: 45,
        address: '5 Village Road, Manchester M1 1AA',
        opening_hours: 'Open 24/7',
        category: 'electrician',
        status: 'new'
    },
    {
        id: 'mock-4',
        business_name: 'Budget Builders Ltd',
        phone_number: '01onal 789012',
        rating: 4.0,
        total_ratings: 8,
        address: '99 Industrial Estate, Leeds LS1 4AA',
        category: 'builder',
        status: 'new'
    }
];

// Test the scoring function
export function testScoring() {
    console.log('=== Lead Scoring Test ===\n');

    MOCK_LEADS.forEach(lead => {
        const result = scoreLead(lead);
        console.log(`${lead.business_name}`);
        console.log(`Phone: ${lead.phone_number}`);
        console.log(`Rating: ${lead.rating} (${lead.total_ratings} reviews)`);
        console.log(result.explanation);
        console.log(`Band: ${result.band}`);
        console.log('---\n');
    });
}
