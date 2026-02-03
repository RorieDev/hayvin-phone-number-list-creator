export const DEFAULT_EMAIL_TEMPLATES = {
    outreach: {
        subject: "Never miss another call (or job) again",
        body: `Hi

Quick question — what happens when your phone rings while you're on a job, driving, or with a customer? Most businesses miss calls, miss opportunities, and miss revenue. Hayvin.ai fixes that by answering every call for you, 24/7, with an AI voice receptionist that sounds natural, professional, and never has a bad day.

Hayvin doesn't just take messages. It qualifies callers, captures key details, answers common questions, books appointments directly into your calendar, and even upsells or routes urgent jobs — all automatically. It’s more capable than a traditional call-answering service and costs a fraction of hiring staff.

If it makes sense, I’d love to show you a quick demo so you can hear it in action.

No pressure — just a short walkthrough to see if it’s a fit for your business.

Would it be easier to send you a link, or should I text you a time that works?

Cheers
Rorie from Hayvin.co.uk`
    }
};

export const getMailtoLink = (email, template = 'outreach') => {
    const { subject, body } = DEFAULT_EMAIL_TEMPLATES[template];
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
