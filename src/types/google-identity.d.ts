/**
 * TypeScript declarations for Google Identity Services
 * https://developers.google.com/identity/gsi/web/reference/js-reference
 */

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        callback: (response: TokenResponse) => void;
        requestAccessToken(options?: { prompt?: string }): void;
      }

      interface TokenResponse {
        access_token?: string;
        expires_in?: number;
        scope?: string;
        token_type?: string;
        error?: string;
      }

      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;
    }
  }
}

interface Window {
  google: typeof google;
}
