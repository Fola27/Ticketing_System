UPDC IT Helpdesk — Starter Full-Stack (Node.js / TypeScript)

This repository is a starter scaffold for the UPDC Plc. IT Helpdesk e-ticketing system.

Features included in this scaffold:
- Backend: Express + TypeScript API with ticket endpoints and simple JSON persistence
- Frontend: Vite + React + TypeScript UI with login placeholder (MSAL configured), ticket form, ticket table, dark/light toggle, and logo placement
- Azure AD / M365 integration placeholders (MSAL config and Graph send-mail stub)

Quick start

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Notes:
- This is a starter scaffold. Replace placeholders in `.env` files with your Azure AD / Microsoft Graph credentials when ready.
