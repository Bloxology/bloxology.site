const API_SERVER_URL = import.meta.env.VITE_API_URL || "/hcgi/api";

const apiServerClient = {
    fetch: async (url, options = {}) => {
        const response = await window.fetch(API_SERVER_URL + url, options);

        // Detect HTML responses early — this means the request hit the SPA
        // catch-all instead of the API (server down, routing misconfigured, etc.)
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            const err = new Error(
                `API request to ${url} returned HTML instead of JSON. ` +
                'The API server may not be running or the route is misconfigured.'
            );
            err.status = response.status;
            err.isRoutingError = true;
            throw err;
        }

        // Override .json() so every call site is protected against empty / invalid bodies
        const originalJson = response.json.bind(response);
        let bodyText = null;
        let bodyConsumed = false;

        response.json = async () => {
            if (!bodyConsumed) {
                bodyText = await response.clone().text();
                bodyConsumed = true;
            }
            if (!bodyText) {
                throw new Error(
                    'The API returned an empty response. Make sure the server is running and try again.'
                );
            }
            try {
                return JSON.parse(bodyText);
            } catch (_) {
                throw new Error(
                    'The API returned an invalid response. Make sure the server is running and try again.'
                );
            }
        };

        return response;
    }
};

export default apiServerClient;

export { apiServerClient };
