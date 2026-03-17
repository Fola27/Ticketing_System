import { PublicClientApplication } from '@azure/msal-browser'

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AAD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173',
  },
}

export const msalInstance = new PublicClientApplication(msalConfig)
export const loginRequest = { scopes: ['User.Read'] }
