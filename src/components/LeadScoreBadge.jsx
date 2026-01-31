import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { scoreLead, getScoreColor } from '../lib/leadScoring';

/**
 * LeadScoreBadge - Displays a lead's calculated score with tooltip explanation
 * 
 * @param {Object} lead - Lead object to score
 * @param {boolean} showBand - Whether to show the band label (default: true)
 * @param {boolean} compact - Compact mode for table cells (default: false)
 */
export default function LeadScoreBadge({ lead, showBand = true, compact = false }) {
    // Memoize score calculation to avoid recalculating on every render
    const scoreResult = useMemo(() => scoreLead(lead), [
        lead.phone_number,
        lead.rating,
        lead.total_ratings,
        lead.business_name,
        lead.address,
        lead.opening_hours,
        lead.website_text
    ]);

    const { score, band, breakdown } = scoreResult;
    const color = getScoreColor(score);

    // Determine CSS class based on band
    const getBandClass = () => {
        switch (band) {
            case 'Call first': return 'lead-score--call-first';
            case 'High potential': return 'lead-score--high';
            case 'Medium': return 'lead-score--medium';
            case 'Low priority': return 'lead-score--low';
            default: return '';
        }
    };

    // Get icon based on score range
    const getScoreIcon = () => {
        if (score >= 70) return <TrendingUp size={12} />;
        if (score <= 35) return <TrendingDown size={12} />;
        return null;
    };

    if (compact) {
        return (
            <div
                className={`lead-score ${getBandClass()}`}
                title={scoreResult.explanation}
                style={{ position: 'relative' }}
            >
                <span className="lead-score-value">{score}</span>
                {getScoreIcon()}
            </div>
        );
    }

    return (
        <div
            className={`lead-score ${getBandClass()}`}
            style={{ position: 'relative' }}
        >
            <span className="lead-score-value">{score}</span>
            {getScoreIcon()}
            {showBand && <span className="lead-score-band">{band}</span>}

            {/* Tooltip with explanation */}
            <div className="lead-score-tooltip">
                <div style={{
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                    color: 'var(--text-primary)'
                }}>
                    Score: {score} — {band}
                </div>

                {(breakdown.positive.length > 0 || breakdown.negative.length > 0) ? (
                    <ul className="lead-score-tooltip-reasons">
                        {breakdown.positive.map((reason, i) => (
                            <li key={`pos-${i}`} className="positive">+ {reason}</li>
                        ))}
                        {breakdown.negative.map((reason, i) => (
                            <li key={`neg-${i}`} className="negative">− {reason}</li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        No specific signals detected
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * LeadScoreIndicator - Simple circular score indicator
 */
export function LeadScoreIndicator({ lead, size = 32 }) {
    const { score } = useMemo(() => scoreLead(lead), [lead]);
    const color = getScoreColor(score);

    // Calculate circle progress
    const circumference = 2 * Math.PI * 12;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div
            style={{
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}
            title={`Score: ${score}`}
        >
            <svg width={size} height={size} viewBox="0 0 32 32">
                {/* Background circle */}
                <circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="3"
                />
                {/* Progress circle */}
                <circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 16 16)"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
            </svg>
            <span style={{
                position: 'absolute',
                fontSize: size > 28 ? '10px' : '8px',
                fontWeight: 600,
                color: 'var(--text-primary)'
            }}>
                {score}
            </span>
        </div>
    );
}
