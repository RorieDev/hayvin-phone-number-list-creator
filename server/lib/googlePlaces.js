import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/**
 * Search for places using Google Places API (New) - Text Search
 * @param {string} query - Search query (e.g., "plumbers in London")
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} - Array of place results
 */
export async function searchPlaces(query, maxResults = 20) {
    if (!GOOGLE_PLACES_API_KEY) {
        throw new Error('Google Places API key not configured');
    }

    try {
        const response = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            {
                textQuery: query,
                maxResultCount: Math.min(maxResults, 20), // API limit is 20 per request
                languageCode: 'en-GB'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.businessStatus,places.googleMapsUri'
                }
            }
        );

        return response.data.places || [];
    } catch (error) {
        console.error('Google Places search error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || error.message);
    }
}

/**
 * Get detailed information about a place including phone number
 * @param {string} placeId - Google Place ID (format: places/xxxxx)
 * @returns {Promise<object>} - Place details
 */
export async function getPlaceDetails(placeId) {
    if (!GOOGLE_PLACES_API_KEY) {
        throw new Error('Google Places API key not configured');
    }

    // The new API already returns all fields in search, so this is mainly for refresh
    try {
        const response = await axios.get(
            `https://places.googleapis.com/v1/${placeId}`,
            {
                headers: {
                    'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                    'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,rating,userRatingCount,types,businessStatus,googleMapsUri'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Google Places details error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Search and format results
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results to fetch
 * @param {function} onProgress - Callback for progress updates
 * @returns {Promise<Array>} - Array of places with formatted details
 */
export async function searchAndGetDetails(query, maxResults = 20, onProgress = null) {
    const places = await searchPlaces(query, maxResults);
    const detailedResults = [];

    for (let i = 0; i < places.length; i++) {
        const place = places[i];

        try {
            // Format the place data from the new API structure
            const formattedPlace = {
                place_id: place.id,
                business_name: place.displayName?.text || 'Unknown',
                address: place.formattedAddress || null,
                phone_number: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
                website: place.websiteUri || null,
                rating: place.rating || null,
                total_ratings: place.userRatingCount || 0,
                category: place.types?.[0] || 'unknown',
                business_status: place.businessStatus || 'UNKNOWN',
                google_maps_url: place.googleMapsUri || null
            };

            detailedResults.push(formattedPlace);

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: places.length,
                    lastBusiness: formattedPlace.business_name
                });
            }
        } catch (error) {
            console.error(`Failed to process ${place.displayName?.text}:`, error.message);
        }
    }

    return detailedResults;
}
