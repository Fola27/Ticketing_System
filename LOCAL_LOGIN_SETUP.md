# Local Login Implementation Guide

## Overview
The Microsoft Azure AD (MSAL) authentication has been replaced with a local username/password authentication system using JWT tokens.

## What Changed

### Backend Changes
1. **New Dependencies Added:**
   - `bcryptjs`: For password hashing
   - `jsonwebtoken`: For JWT token generation and verification
   - TypeScript types for both libraries

2. **New Files Created:**
   - `src/routes/auth.ts`: Authentication endpoints (register, login, verify)
   - `src/middleware/auth.ts`: JWT authentication middleware
   - `src/store/users.json`: User database file

3. **Modified Files:**
   - `src/index.ts`: Added auth routes and authentication middleware for protected routes
   - `package.json`: Added new dependencies

### Frontend Changes
1. **Removed Dependencies:**
   - `@azure/msal-browser`: No longer needed for Azure AD

2. **Modified Components:**
   - `src/components/Login.tsx`: Replaced MSAL popup with form-based login (register/login)
   - `src/components/TicketForm.tsx`: Updated to use axios instead of fetch
   - `src/components/TicketTable.tsx`: Updated to use axios instead of fetch
   - `src/App.tsx`: Added JWT token management and axios interceptor

3. **Updated Styles:**
   - `src/styles.css`: Added styles for login form inputs, error messages, and loading states

4. **Modified Files:**
   - `package.json`: Removed MSAL dependency

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register`: Create a new user account
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```
  Response: `{ token, user: { id, email, name } }`

- `POST /api/auth/login`: Login with email and password
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  Response: `{ token, user: { id, email, name } }`

- `POST /api/auth/verify`: Verify if a token is valid
  Header: `Authorization: Bearer <token>`
  Response: `{ valid: true, user: { id, email } }`

### Protected Routes (`/api/tickets`)
All ticket endpoints now require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Setup Instructions

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Environment Variables (Optional)
Create a `.env` file in the backend directory to customize:
```
JWT_SECRET=your-secret-key-change-in-production
PORT=4000
```

## Running the Application

### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```
This will start the server on `http://localhost:4000`

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```
This will start the frontend on `http://localhost:5173`

## Testing the Local Login

1. **Open** `http://localhost:5173` in your browser
2. **Sign Up**: 
   - Click "Sign up" tab
   - Enter full name, email, and password
   - Click "Create Account"
3. **Sign In**: 
   - Use the registered email and password
   - Click "Sign in"
4. **Use the Application**:
   - Once logged in, you'll see the ticket form and table
   - Submit tickets and manage them as before

## User Data Storage

### Users Database
Users are stored in `backend/src/store/users.json` with the following structure:
```json
[
  {
    "id": "1234567890",
    "email": "user@example.com",
    "password": "$2a$10...",  // Hashed with bcryptjs
    "name": "John Doe"
  }
]
```

### Tickets Database
Tickets continue to be stored in `backend/src/store/tickets.json` with all their original properties.

## Security Notes

1. **JWT Secret**: Change the `JWT_SECRET` environment variable in production
2. **Password Hashing**: All passwords are hashed using bcryptjs (salt rounds: 10)
3. **Token Expiration**: JWT tokens expire after 7 days
4. **CORS**: Backend has CORS enabled for development (update for production)

## Migration from Microsoft Login

The old Microsoft login functionality has been completely removed:
- `src/msal.ts` file is no longer used (can be deleted if desired)
- All MSAL-related imports have been removed
- No Azure AD configuration is required anymore

## Troubleshooting

### "Invalid email or password" error
- Verify the email and password are correct
- Check that the user was registered in the signup form

### "No token provided" error
- Ensure you're logged in
- Clear localStorage and log in again: Open browser DevTools > Application > Local Storage > Clear

### Backend Connection Issues
- Verify backend is running on `http://localhost:4000`
- Check CORS settings if requests are blocked

### Token Expired
- Log out and log in again
- Tokens are valid for 7 days by default

## Next Steps (Optional)

1. **Database Migration**: Consider migrating to SQLite or another database for production
2. **Password Reset**: Implement a password reset/forgot password feature
3. **User Roles**: Add different user roles (admin, user, etc.) for fine-grained access control
4. **Rate Limiting**: Add rate limiting to prevent brute force attacks
5. **Email Verification**: Add email verification during signup
