const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (import.meta.env.PROD) {
        // In production, always use relative path unless specifically told otherwise (and not localhost)
        return (!envUrl || envUrl.includes('localhost')) ? '' : envUrl;
    }
    return envUrl || 'http://localhost:3001';
};

const API_URL = getApiUrl();

async function request(endpoint, options = {}) {
    const url = `${API_URL}/api${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// Places API
export const placesApi = {
    search: (query) => request(`/places/search?query=${encodeURIComponent(query)}`),

    scrape: (query, maxResults = 20, campaignId = null) =>
        request('/places/scrape', {
            method: 'POST',
            body: { query, maxResults, campaignId }
        })
};

// Leads API
export const leadsApi = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/leads${queryString ? `?${queryString}` : ''}`);
    },

    getById: (id) => request(`/leads/${id}`),

    update: (id, data) => request(`/leads/${id}`, {
        method: 'PUT',
        body: data
    }),

    delete: (id) => request(`/leads/${id}`, {
        method: 'DELETE'
    }),

    getStats: (campaignId = null) => {
        const query = campaignId ? `?campaign_id=${campaignId}` : '';
        return request(`/leads/stats/overview${query}`);
    }
};

// Campaigns API
export const campaignsApi = {
    getAll: () => request('/campaigns'),

    getById: (id) => request(`/campaigns/${id}`),

    create: (data) => request('/campaigns', {
        method: 'POST',
        body: data
    }),

    update: (id, data) => request(`/campaigns/${id}`, {
        method: 'PUT',
        body: data
    }),

    delete: (id) => request(`/campaigns/${id}`, {
        method: 'DELETE'
    })
};

// Call Logs API
export const callLogsApi = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/call-logs${queryString ? `?${queryString}` : ''}`);
    },

    create: (data) => request('/call-logs', {
        method: 'POST',
        body: data
    }),

    getTodayStats: (campaignId = null) => {
        const query = campaignId ? `?campaign_id=${campaignId}` : '';
        return request(`/call-logs/stats/today${query}`);
    },

    getCallbacks: (campaignId = null) => {
        const query = campaignId ? `?campaign_id=${campaignId}` : '';
        return request(`/call-logs/callbacks${query}`);
    }
};

// Health check
export const healthCheck = () => request('/health');
