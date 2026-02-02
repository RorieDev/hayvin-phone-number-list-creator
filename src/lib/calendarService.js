/**
 * Calendar Service - Handles Google Calendar integration
 * Uses Google Calendar's quick add feature to create events
 */

/**
 * Generate a Google Calendar event URL for adding an event
 * @param {Object} options - Event configuration
 * @param {string} options.title - Event title (required)
 * @param {string} options.description - Event description
 * @param {string} options.location - Event location
 * @param {Date} options.startTime - Start time (optional, defaults to now)
 * @param {number} options.durationMinutes - Duration in minutes (default: 30)
 * @returns {string} - Google Calendar URL
 */
export function generateGoogleCalendarUrl({
    title,
    description = '',
    location = '',
    startTime = null,
    durationMinutes = 30
}) {
    // Use provided start time or default to now
    const start = startTime ? new Date(startTime) : new Date();
    
    // Calculate end time
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    // Format dates as ISO string and remove special characters for Google Calendar format
    const startISO = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endISO = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // Build event details text with contact info
    const details = description ? `${description}\n\n` : '';
    const eventDetails = `${details}Calendar: rorie.devine@gmail.com`;

    // Build the Google Calendar URL using the event creation endpoint
    const baseUrl = 'https://calendar.google.com/calendar/u/0/r/eventedit';
    const params = new URLSearchParams({
        text: title,
        dates: `${startISO}/${endISO}`,
        details: eventDetails,
        location: location,
        ctz: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Create a demo event for a lead
 * @param {Object} lead - Lead object with business information
 * @param {Date} startTime - Optional start time (defaults to now)
 */
export function createDemoEvent(lead, startTime = null) {
    const title = `Demo - ${lead.business_name}`;
    const description = buildLeadDescription(lead, 'Demo');
    
    const url = generateGoogleCalendarUrl({
        title,
        description,
        location: lead.address || 'Virtual',
        startTime,
        durationMinutes: 30
    });

    window.open(url, '_blank');
}

/**
 * Create a callback event for a lead
 * @param {Object} lead - Lead object with business information
 * @param {Date} startTime - Optional start time (defaults to now)
 */
export function createCallbackEvent(lead, startTime = null) {
    const title = `Call Back - ${lead.business_name}`;
    const description = buildLeadDescription(lead, 'Callback');
    
    const url = generateGoogleCalendarUrl({
        title,
        description,
        location: lead.address || 'Phone Call',
        startTime,
        durationMinutes: 30
    });

    window.open(url, '_blank');
}

/**
 * Build a formatted description with lead contact information
 * @param {Object} lead - Lead object
 * @param {string} eventType - Type of event (Demo or Callback)
 * @returns {string} - Formatted description
 */
function buildLeadDescription(lead, eventType) {
    const lines = [
        `📞 Contact: ${lead.business_name}`,
        `Phone: ${lead.phone_number}`
    ];

    if (lead.email) {
        lines.push(`Email: ${lead.email}`);
    }

    if (lead.address) {
        lines.push(`Address: ${lead.address}`);
    }

    if (lead.rating) {
        lines.push(`Rating: ${lead.rating}⭐ (${lead.total_ratings} reviews)`);
    }

    if (lead.website_url) {
        lines.push(`Website: ${lead.website_url}`);
    }

    lines.push('');
    lines.push(`Event Type: ${eventType}`);

    return lines.join('\n');
}
