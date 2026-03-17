# Azure AD / Microsoft Graph Setup (quick steps)

1. Register an Azure AD application
   - In Azure Portal -> Azure Active Directory -> App registrations -> New registration
   - Name: UPDC Helpdesk API
   - Supported account types: Accounts in this organizational directory only
   - Redirect URI: (not needed for backend app)

2. Create a client secret
   - Under the app -> Certificates & secrets -> New client secret. Save the value.

3. API permissions
   - Under app -> API permissions -> Add a permission -> Microsoft Graph -> Application permissions
   - Add `Mail.Send`
   - Click "Grant admin consent" (requires admin)

4. Send-as mailbox
   - To send email as a user, the app needs to be allowed to send as that mailbox. You can either:
     - Use an organizational service account mailbox (e.g., helpdesk@updc.com) and configure Exchange to allow the app to send as that user.
     - Or use a shared mailbox and grant appropriate permissions.

5. Configure environment variables
   - Set `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`, and `EMAIL_FROM` in the backend environment (see `.env.example`).

6. Frontend (MSAL) app registration
   - Register a separate app for the frontend (Single-page application).
   - Redirect URI: `http://localhost:5173` (adjust for production)
   - Under "Authentication" enable "Access tokens" and "ID tokens".
   - Add `http://localhost:5173` to the allowed redirect URIs.
   - Note the frontend app's client id for `VITE_AAD_CLIENT_ID`.

7. Permissions for frontend
   - For basic sign-in, add delegated permission `User.Read` for Microsoft Graph and grant admin consent if required.

8. Consent and testing
   - Use the frontend to sign in with `msal` (login popup or redirect).
   - The backend uses the client credentials flow to call Graph and send mail.
