import { useState, useEffect } from 'react';
import {
    Search,
    MapPin,
    Loader2,
    CheckCircle,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { placesApi, campaignsApi } from '../lib/api';
import { socketService } from '../lib/socket';

export default function Scraper() {
    const [query, setQuery] = useState('');
    const [maxResults, setMaxResults] = useState(20);
    const [campaignId, setCampaignId] = useState('');
    const [campaigns, setCampaigns] = useState([]);
    const [scraping, setScraping] = useState(false);
    const [progress, setProgress] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        campaignsApi.getAll().then(setCampaigns).catch(console.error);

        // Listen for scraping progress
        socketService.onScrapingProgress((data) => {
            setProgress(data);
        });

        socketService.onScrapingComplete((data) => {
            setResult(data);
            setScraping(false);
            setProgress(null);
        });

        return () => {
            socketService.off('scraping:progress');
            socketService.off('scraping:complete');
        };
    }, []);

    const handleScrape = async (e) => {
        e.preventDefault();

        if (!query.trim()) return;

        setScraping(true);
        setError(null);
        setResult(null);
        setProgress({ current: 0, total: maxResults, lastBusiness: 'Starting...' });

        try {
            const data = await placesApi.scrape(query, maxResults, campaignId || null);
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setScraping(false);
            setProgress(null);
        }
    };

    const exampleQueries = [
        'Plumbers in London',
        'Dentists in Manchester',
        'Electricians in Birmingham',
        'Estate agents in Bristol',
        'Auto repair shops in Leeds'
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Lead Scraper</h1>
                    <p className="text-muted">Search Google Places to find business leads with phone numbers</p>
                </div>
            </div>

            {/* Scraper Form */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <form onSubmit={handleScrape}>
                    <div className="form-group">
                        <label className="form-label">Search Query</label>
                        <div className="search-input-wrapper">
                            <Search size={18} />
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="e.g., Plumbers in London"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={scraping}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Max Results</label>
                            <input
                                type="number"
                                className="form-input"
                                min={1}
                                max={60}
                                value={maxResults}
                                onChange={(e) => setMaxResults(parseInt(e.target.value) || 20)}
                                disabled={scraping}
                            />
                            <p className="text-xs text-muted" style={{ marginTop: 'var(--space-1)' }}>
                                Google API returns up to 60 results per query
                            </p>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Assign to Campaign (Optional)</label>
                            <select
                                className="form-select"
                                value={campaignId}
                                onChange={(e) => setCampaignId(e.target.value)}
                                disabled={scraping}
                            >
                                <option value="">No campaign</option>
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={scraping || !query.trim()}
                        style={{ width: '100%' }}
                    >
                        {scraping ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Scraping...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Start Scraping
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Progress */}
            {scraping && progress && (
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-4)' }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary-400)' }} />
                        <span className="font-medium">Scraping in progress...</span>
                    </div>

                    <div className="progress-bar" style={{ marginBottom: 'var(--space-2)' }}>
                        <div
                            className="progress-fill"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted">
                        <span>{progress.current} / {progress.total} businesses processed</span>
                        <span>{progress.lastBusiness}</span>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="card" style={{
                    marginBottom: 'var(--space-6)',
                    borderColor: 'var(--success-600)',
                    background: 'rgba(34, 197, 94, 0.05)'
                }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                        <CheckCircle size={24} style={{ color: 'var(--success-500)' }} />
                        <h3 className="font-semibold">Scraping Complete!</h3>
                    </div>

                    <div className="grid grid-cols-3" style={{ gap: 'var(--space-4)' }}>
                        <div>
                            <div className="text-2xl font-bold">{result.scraped}</div>
                            <div className="text-sm text-muted">Businesses Found</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold" style={{ color: 'var(--primary-400)' }}>
                                {result.withPhone || result.saved}
                            </div>
                            <div className="text-sm text-muted">With Phone Numbers</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold" style={{ color: 'var(--success-500)' }}>
                                {result.saved}
                            </div>
                            <div className="text-sm text-muted">Saved to Database</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="card" style={{
                    marginBottom: 'var(--space-6)',
                    borderColor: 'var(--error-600)',
                    background: 'rgba(239, 68, 68, 0.05)'
                }}>
                    <div className="flex items-center gap-3">
                        <AlertCircle size={24} style={{ color: 'var(--error-500)' }} />
                        <div>
                            <h3 className="font-semibold" style={{ color: 'var(--error-500)' }}>Scraping Failed</h3>
                            <p className="text-sm text-muted">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Example Queries */}
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                    <MapPin size={18} style={{ display: 'inline', marginRight: 'var(--space-2)' }} />
                    Example Searches
                </h3>

                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {exampleQueries.map((example) => (
                        <button
                            key={example}
                            className="btn btn-secondary btn-sm"
                            onClick={() => setQuery(example)}
                            disabled={scraping}
                        >
                            {example}
                        </button>
                    ))}
                </div>

                <p className="text-sm text-muted" style={{ marginTop: 'var(--space-4)' }}>
                    💡 <strong>Tip:</strong> Be specific with your search queries. Include the business type and location for best results.
                    The scraper will fetch detailed information including phone numbers, ratings, and addresses.
                </p>
            </div>
        </div>
    );
}
