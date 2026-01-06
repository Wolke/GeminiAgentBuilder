// G8N Services - Google Auth Service
// OAuth 2.0 authentication with Google Identity Services

export interface GoogleAuthConfig {
    clientId: string;
}

export interface GoogleAuthState {
    isSignedIn: boolean;
    accessToken: string | null;
    userEmail: string | null;
    expiresAt: number | null;
}

// Storage keys
const STORAGE_KEY = 'g8n_google_auth';

class GoogleAuthService {
    private config: GoogleAuthConfig | null = null;
    private tokenClient: google.accounts.oauth2.TokenClient | null = null;
    private state: GoogleAuthState = {
        isSignedIn: false,
        accessToken: null,
        userEmail: null,
        expiresAt: null,
    };
    private listeners: Set<(state: GoogleAuthState) => void> = new Set();

    /**
     * Initialize the auth service with OAuth client ID
     */
    init(clientId: string): void {
        this.config = { clientId };
        this.loadStoredAuth();
        this.initTokenClient();
    }

    /**
     * Load stored auth from localStorage
     */
    private loadStoredAuth(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as GoogleAuthState;
                // Check if token is still valid
                if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
                    this.state = parsed;
                    this.notifyListeners();
                } else {
                    // Token expired, clear it
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (e) {
            console.error('[GoogleAuth] Failed to load stored auth:', e);
        }
    }

    /**
     * Initialize Google Identity Services token client
     */
    private initTokenClient(): void {
        if (!this.config?.clientId) return;

        // Wait for GIS library to load
        if (typeof google === 'undefined' || !google.accounts?.oauth2) {
            console.warn('[GoogleAuth] Google Identity Services not loaded yet');
            return;
        }

        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.config.clientId,
            scope: [
                'openid',
                'email',
                'https://www.googleapis.com/auth/script.projects',
                'https://www.googleapis.com/auth/script.deployments',
                'https://www.googleapis.com/auth/drive', // Required for listing and deleting projects
            ].join(' '),
            callback: (response) => this.handleTokenResponse(response),
        });
    }

    /**
     * Handle OAuth token response
     */
    private handleTokenResponse(response: google.accounts.oauth2.TokenResponse): void {
        if (response.error) {
            console.error('[GoogleAuth] Token error:', response.error);
            return;
        }

        const expiresAt = Date.now() + (response.expires_in || 3600) * 1000;

        this.state = {
            isSignedIn: true,
            accessToken: response.access_token,
            userEmail: null, // Will be fetched separately
            expiresAt,
        };

        // Fetch user info
        this.fetchUserInfo();

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notifyListeners();
    }

    /**
     * Fetch user email from Google API
     */
    private async fetchUserInfo(): Promise<void> {
        if (!this.state.accessToken) return;

        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${this.state.accessToken}` },
            });
            const data = await response.json();
            this.state.userEmail = data.email;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
            this.notifyListeners();
        } catch (e) {
            console.error('[GoogleAuth] Failed to fetch user info:', e);
        }
    }

    /**
     * Sign in with Google
     */
    signIn(): void {
        if (!this.tokenClient) {
            this.initTokenClient();
        }
        this.tokenClient?.requestAccessToken();
    }

    /**
     * Sign out
     */
    signOut(): void {
        if (this.state.accessToken) {
            google.accounts.oauth2.revoke(this.state.accessToken, () => {
                console.log('[GoogleAuth] Token revoked');
            });
        }

        this.state = {
            isSignedIn: false,
            accessToken: null,
            userEmail: null,
            expiresAt: null,
        };
        localStorage.removeItem(STORAGE_KEY);
        this.notifyListeners();
    }

    /**
     * Get current auth state
     */
    getState(): GoogleAuthState {
        return { ...this.state };
    }

    /**
     * Check if token is valid
     */
    isTokenValid(): boolean {
        return this.state.isSignedIn &&
            this.state.accessToken !== null &&
            (this.state.expiresAt || 0) > Date.now();
    }

    /**
     * Subscribe to auth state changes
     */
    subscribe(callback: (state: GoogleAuthState) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(): void {
        this.listeners.forEach((cb) => cb(this.getState()));
    }
}

export const googleAuthService = new GoogleAuthService();

// Type declarations for Google Identity Services
declare global {
    interface Window {
        google?: typeof google;
    }
    namespace google {
        namespace accounts {
            namespace oauth2 {
                function initTokenClient(config: {
                    client_id: string;
                    scope: string;
                    callback: (response: TokenResponse) => void;
                }): TokenClient;
                function revoke(token: string, callback: () => void): void;

                interface TokenClient {
                    requestAccessToken(): void;
                }

                interface TokenResponse {
                    access_token: string;
                    expires_in?: number;
                    error?: string;
                    error_description?: string;
                }
            }
        }
    }
}
