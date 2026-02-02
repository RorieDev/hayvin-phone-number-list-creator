import { useState, useEffect, useRef, useMemo } from 'react';
import {
    X,
    MapPin,
    Star,
    Phone,
    Smartphone,
    Building,
    Headphones,
    Sparkles,
    Clock,
    AlertCircle,
    CheckCircle,
    MessageSquare,
    Calendar,
    XCircle,
    ClipboardList,
    Target,
    Lightbulb,
    TrendingUp,
    User,
    Globe,
    Edit3,
    Save,
    Gauge,
    Mail
} from 'lucide-react';
import { scoreLead, getScoreColor } from '../lib/leadScoring';
import { createDemoEvent, createCallbackEvent } from '../lib/calendarService';

/**
 * LeadInsightPanel - Right-hand panel showing detailed lead intelligence
 * 
 * This panel provides sales reps with:
 * - Business context and snapshot
 * - Phone number analysis
 * - AI-powered call strategy
 * - Optimal call timing
 * - Quick actions
 */
export default function LeadInsightPanel({ lead, onClose, onUpdate, onLogCall }) {
    const [notes, setNotes] = useState('');
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesSaved, setNotesSaved] = useState(false);
    const notesTimeoutRef = useRef(null);

    // Initialize notes when lead changes
    useEffect(() => {
        if (lead) {
            setNotes(lead.notes || '');
            setNotesSaved(false);
        }
    }, [lead?.id]);

    // Auto-save notes on blur
    const handleNotesBlur = async () => {
        if (notes !== (lead?.notes || '')) {
            setNotesSaving(true);
            try {
                await onUpdate?.(lead.id, { notes });
                setNotesSaved(true);
                // Clear saved indicator after 2 seconds
                notesTimeoutRef.current = setTimeout(() => setNotesSaved(false), 2000);
            } catch (err) {
                console.error('Failed to save notes:', err);
            } finally {
                setNotesSaving(false);
            }
        }
    };

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
            if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
        };
    }, [onClose]);

    if (!lead) return null;

    // Analyze phone number type
    const phoneAnalysis = analyzePhoneNumber(lead.phone_number);

    // Generate insight badges based on lead data
    const insightBadges = generateInsightBadges(lead, phoneAnalysis);

    // Generate selection reasons
    const selectionReasons = generateSelectionReasons(lead, phoneAnalysis);

    // Generate AI call strategy
    const callStrategy = generateCallStrategy(lead, phoneAnalysis);

    // Generate call timing recommendations
    const callTiming = generateCallTiming(lead);

    // Calculate lead score
    const leadScore = useMemo(() => scoreLead(lead), [lead]);
    const scoreColor = getScoreColor(leadScore.score);

    return (
        <div className="lead-insight-panel">
            {/* Header */}
            <div className="lead-insight-header">
                <button className="lead-insight-close" onClick={onClose} aria-label="Close panel">
                    <X size={20} />
                </button>

                {/* Business Snapshot */}
                <div className="lead-insight-snapshot" style={{ paddingTop: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {/* Compact Lead Score */}
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: 800,
                                color: scoreColor,
                                lineHeight: 1,
                                minWidth: '40px'
                            }}
                            title={leadScore.explanation}
                        >
                            {leadScore.score}
                        </div>

                        <h2 className="lead-insight-business-name" style={{ flex: 1, margin: 0 }}>{lead.business_name}</h2>
                    </div>


                    <div className="lead-insight-meta">
                        {lead.email && (
                            <span className="lead-insight-location">
                                <Mail size={14} />
                                {lead.email}
                            </span>
                        )}

                        {lead.rating && (
                            <span className="lead-insight-rating">
                                <Star size={14} fill="var(--warning-500)" stroke="var(--warning-500)" />
                                {lead.rating.toFixed(1)}
                                <span className="text-muted">({lead.total_ratings || 0} reviews)</span>
                            </span>
                        )}
                    </div>

                    {/* Insight Badges */}
                    <div className="lead-insight-badges">
                        {insightBadges.map((badge, i) => (
                            <span
                                key={i}
                                className={`lead-insight-badge lead-insight-badge--${badge.type}`}
                                title={badge.tooltip}
                            >
                                {badge.icon}
                                {badge.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="lead-insight-content">

                {/* Contact Intelligence */}
                <section className="lead-insight-section">
                    <h3 className="lead-insight-section-title">
                        <Phone size={16} />
                        Contact Intelligence
                    </h3>

                    <div className="lead-insight-phone-card">
                        <div className="lead-insight-phone-main">
                            {phoneAnalysis.icon}
                            <div>
                                <div className="lead-insight-phone-number">{lead.phone_number || 'No phone'}</div>
                                <div className="lead-insight-phone-type">{phoneAnalysis.type}</div>
                            </div>
                        </div>
                        <p className="lead-insight-phone-hint">{phoneAnalysis.hint}</p>
                    </div>

                    {lead.website && (
                        <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="lead-insight-website"
                        >
                            <Globe size={14} />
                            {new URL(lead.website).hostname}
                        </a>
                    )}

                    {lead.email && (
                        <a
                            href={`mailto:${lead.email}`}
                            className="lead-insight-website"
                            style={{ marginTop: 'var(--space-2)' }}
                        >
                            <Mail size={14} />
                            {lead.email}
                        </a>
                    )}
                </section>

                {/* Why This Lead Was Selected */}
                <section className="lead-insight-section">
                    <h3 className="lead-insight-section-title">
                        <Target size={16} />
                        Why This Lead Was Selected
                    </h3>

                    <ul className="lead-insight-reasons">
                        {selectionReasons.map((reason, i) => (
                            <li key={i} className="lead-insight-reason">
                                <CheckCircle size={14} />
                                {reason}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* AI Call Strategy */}
                <section className="lead-insight-section">
                    <h3 className="lead-insight-section-title">
                        <Sparkles size={16} />
                        AI Call Strategy
                    </h3>

                    <div className="lead-insight-strategy">
                        <div className="lead-insight-opening">
                            <span className="lead-insight-label">Recommended Opening</span>
                            <blockquote className="lead-insight-quote">
                                "{callStrategy.openingLine}"
                            </blockquote>
                        </div>

                        <div className="lead-insight-strategy-grid">
                            <div>
                                <span className="lead-insight-label">
                                    <Lightbulb size={12} />
                                    Likely Pain Points
                                </span>
                                <ul className="lead-insight-bullets lead-insight-bullets--pain">
                                    {callStrategy.painPoints.map((point, i) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <span className="lead-insight-label">
                                    <AlertCircle size={12} />
                                    Likely Objections
                                </span>
                                <ul className="lead-insight-bullets lead-insight-bullets--objection">
                                    {callStrategy.objections.map((obj, i) => (
                                        <li key={i}>{obj}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Best Time to Call */}
                <section className="lead-insight-section">
                    <h3 className="lead-insight-section-title">
                        <Clock size={16} />
                        Best Time to Call
                    </h3>

                    <div className="lead-insight-timing">
                        <div className="lead-insight-timing-good">
                            <span className="lead-insight-timing-label lead-insight-timing-label--good">
                                <CheckCircle size={12} />
                                Recommended
                            </span>
                            <div className="lead-insight-timing-slots">
                                {callTiming.recommended.map((slot, i) => (
                                    <span key={i} className="lead-insight-time-slot lead-insight-time-slot--good">
                                        {slot}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="lead-insight-timing-bad">
                            <span className="lead-insight-timing-label lead-insight-timing-label--bad">
                                <XCircle size={12} />
                                Avoid
                            </span>
                            <div className="lead-insight-timing-slots">
                                {callTiming.avoid.map((slot, i) => (
                                    <span key={i} className="lead-insight-time-slot lead-insight-time-slot--bad">
                                        {slot}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Notes */}
                <section className="lead-insight-section">
                    <h3 className="lead-insight-section-title">
                        <Edit3 size={16} />
                        Notes
                        {notesSaving && <span className="lead-insight-saving">Saving...</span>}
                        {notesSaved && <span className="lead-insight-saved"><Save size={12} /> Saved</span>}
                    </h3>

                    <textarea
                        className="lead-insight-notes"
                        placeholder="Add notes about this lead..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={handleNotesBlur}
                        rows={4}
                    />
                </section>
            </div>

            {/* Sticky Footer Actions */}
            <div className="lead-insight-footer">
                <button
                    className="btn btn-primary btn-lg lead-insight-call-btn"
                    onClick={() => onLogCall?.(lead)}
                >
                    <ClipboardList size={18} />
                    Call Now (Guided)
                </button>

                <div className="lead-insight-secondary-actions">
                    <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => createDemoEvent(lead)}
                        title="Add 30-minute demo to calendar"
                    >
                        <Calendar size={14} />
                        Book Demo
                    </button>
                    <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => createCallbackEvent(lead)}
                        title="Schedule 30-minute callback"
                    >
                        <Clock size={14} />
                        Set Callback
                    </button>
                    <button className="btn btn-ghost btn-sm lead-insight-not-interested">
                        <XCircle size={14} />
                        Not Interested
                    </button>
                </div>
            </div>
        </div >
    );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Analyze phone number to determine type and provide insights
 */
function analyzePhoneNumber(phone) {
    if (!phone) {
        return {
            type: 'Unknown',
            icon: <Phone size={20} className="text-muted" />,
            hint: 'No phone number available',
            isMobile: false,
            isLandline: false,
            isFreephone: false
        };
    }

    const cleaned = phone.replace(/\s+/g, '');

    // UK Mobile (07xxx)
    if (/^(\+44|0)7\d{9}$/.test(cleaned) || phone.startsWith('07')) {
        return {
            type: 'Mobile',
            icon: <Smartphone size={20} style={{ color: 'var(--success-500)' }} />,
            hint: 'Mobile primary → likely owner-operator or decision maker',
            isMobile: true,
            isLandline: false,
            isFreephone: false
        };
    }

    // Freephone (0800, 0808)
    if (/^0800|^0808/.test(cleaned)) {
        return {
            type: 'Freephone / Call Centre',
            icon: <Headphones size={20} style={{ color: 'var(--warning-500)' }} />,
            hint: 'Freephone number → may have gatekeepers or IVR system',
            isMobile: false,
            isLandline: false,
            isFreephone: true
        };
    }

    // Geographic landline (01xxx, 02xxx)
    if (/^01|^02/.test(cleaned)) {
        return {
            type: 'Landline',
            icon: <Building size={20} style={{ color: 'var(--primary-400)' }} />,
            hint: 'Landline → likely office/shop, may have receptionist',
            isMobile: false,
            isLandline: true,
            isFreephone: false
        };
    }

    // Default
    return {
        type: 'Phone',
        icon: <Phone size={20} />,
        hint: 'Standard phone number',
        isMobile: false,
        isLandline: true,
        isFreephone: false
    };
}

/**
 * Generate insight badges based on lead data
 */
function generateInsightBadges(lead, phoneAnalysis) {
    const badges = [];

    // Mobile = owner-operator
    if (phoneAnalysis.isMobile) {
        badges.push({
            type: 'positive',
            label: 'Owner-operator likely',
            icon: <User size={12} />,
            tooltip: 'Mobile number suggests direct access to decision maker'
        });
    }

    // High ratings = in demand
    if (lead.rating >= 4.5 && lead.total_ratings >= 50) {
        badges.push({
            type: 'positive',
            label: 'High demand business',
            icon: <TrendingUp size={12} />,
            tooltip: 'Strong reviews indicate healthy customer flow'
        });
    }

    // New lead
    if (lead.status === 'new') {
        badges.push({
            type: 'neutral',
            label: 'Fresh lead',
            icon: <Sparkles size={12} />,
            tooltip: 'Never contacted before'
        });
    }

    // Missed call risk (no freephone / landline only)
    if (phoneAnalysis.isLandline && !phoneAnalysis.isFreephone) {
        badges.push({
            type: 'warning',
            label: 'High missed-call risk',
            icon: <AlertCircle size={12} />,
            tooltip: 'Landline may go unanswered during busy hours'
        });
    }

    // Low competition indicator (few ratings)
    if (lead.total_ratings && lead.total_ratings < 20) {
        badges.push({
            type: 'positive',
            label: 'Growth opportunity',
            icon: <Target size={12} />,
            tooltip: 'Low review count suggests room for growth'
        });
    }

    return badges.slice(0, 3); // Max 3 badges
}

/**
 * Generate selection reasons
 */
function generateSelectionReasons(lead, phoneAnalysis) {
    const reasons = [];

    if (phoneAnalysis.isMobile) {
        reasons.push('Mobile number is primary contact — direct line to decision maker');
    }

    if (lead.rating >= 4.0) {
        reasons.push(`Strong Google rating (${lead.rating}★) suggests quality service and stable business`);
    }

    if (lead.total_ratings >= 30) {
        reasons.push('High review count indicates strong inbound demand');
    }

    if (!lead.website) {
        reasons.push('No website listed — may benefit from digital presence solutions');
    }

    if (phoneAnalysis.isLandline && !phoneAnalysis.isFreephone) {
        reasons.push('Local landline suggests established local business');
    }

    if (lead.category) {
        const category = formatCategory(lead.category);
        reasons.push(`Active in ${category} sector — matches your target market`);
    }

    // Ensure at least 2 reasons
    if (reasons.length < 2) {
        reasons.push('Identified as potential B2B customer based on business profile');
    }

    return reasons.slice(0, 4);
}

/**
 * Generate AI call strategy
 */
function generateCallStrategy(lead, phoneAnalysis) {
    const businessName = lead.business_name || 'there';
    const category = formatCategory(lead.category) || 'your business';

    // Opening line based on context
    let openingLine = `Hi, is this ${businessName}? Great! I'm calling because we help ${category} businesses in your area save time on [specific pain point]...`;

    if (phoneAnalysis.isMobile) {
        openingLine = `Hi, am I speaking with the owner of ${businessName}? Perfect — I'll be brief. We've helped other ${category} businesses in your area and I wanted to see if it's worth a quick chat.`;
    }

    // Pain points based on business type
    const painPoints = [
        'Missing calls while busy on jobs',
        'Spending too much time on admin',
        'Difficulty managing customer bookings'
    ];

    // Common objections
    const objections = [
        '"I\'m too busy right now" → Offer a callback time',
        '"We\'re already sorted" → Ask what they currently use',
        '"How much is it?" → Focus on ROI first'
    ];

    return { openingLine, painPoints, objections };
}

/**
 * Generate call timing recommendations
 */
function generateCallTiming(lead) {
    const category = lead.category?.toLowerCase() || '';

    // Default timing for trade businesses
    let recommended = ['8:00 - 9:00 AM', '12:00 - 1:00 PM', '5:00 - 6:00 PM'];
    let avoid = ['9:00 - 11:00 AM', '2:00 - 4:00 PM'];

    // Adjust for retail/hospitality
    if (category.includes('restaurant') || category.includes('cafe') || category.includes('bar')) {
        recommended = ['10:00 - 11:00 AM', '2:00 - 4:00 PM'];
        avoid = ['12:00 - 2:00 PM', '6:00 - 9:00 PM'];
    }

    // Adjust for offices
    if (category.includes('accounting') || category.includes('lawyer') || category.includes('office')) {
        recommended = ['10:00 - 12:00 PM', '2:00 - 4:00 PM'];
        avoid = ['8:00 - 9:30 AM', '4:30 - 6:00 PM'];
    }

    return { recommended, avoid };
}

/**
 * Extract postcode from UK address
 */
function extractPostcode(address) {
    if (!address) return 'Unknown';
    const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);
    return match ? match[0].toUpperCase() : 'UK';
}

/**
 * Extract town from address
 */
function extractTown(address) {
    if (!address) return 'Unknown';
    const parts = address.split(',');
    if (parts.length >= 2) {
        // Usually town is second-to-last before postcode
        const town = parts[parts.length - 2]?.trim();
        if (town && !town.match(/\d/)) {
            return town;
        }
    }
    return parts[0]?.trim() || 'Unknown';
}

/**
 * Format category string for display
 */
function formatCategory(category) {
    if (!category) return null;
    return category
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}
