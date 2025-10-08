# Frontend (React + Vite + Tailwind)

Quick start:

1. Install deps

```
cd frontend
npm install
```

2. Run dev server

```
npm run dev
```

Env notes: The frontend expects a backend API at `http://localhost:4000` by default. Configure your API base URL in code or via env when adding auth.

Mock auth mode
---------------
If you'd like to work on frontend features without the backend, enable mock auth by creating a `.env` file in `frontend/` with:

```
VITE_MOCK_AUTH=true
VITE_API_BASE=http://localhost:4000/api
```

When mock auth is enabled the Landing page will display mock credentials and the login/signup flows will use local mock accounts.

Firebase Auth (optional)
------------------------
If you want to use Firebase Authentication instead of mock auth or JWT, follow these steps:

1. Install the Firebase SDK:

```
cd frontend
npm install firebase
```

2. Update `src/firebase.js` with your Firebase config (a starter file is included).

3. Replace the login/signup handlers in `src/contexts/AuthContext.jsx` to call Firebase Auth (or add a new provider) and issue/forward tokens to the backend as needed.

Switching to Firebase in this scaffold
-------------------------------------
1. Create `frontend/.env` (or edit it) and set:

```
VITE_USE_FIREBASE=true
VITE_API_BASE=http://localhost:4000/api
```

2. Install firebase and restart dev server:

```
npm install firebase
npm run dev
```

The app will then use Firebase for auth; roles are stored locally in `localStorage` until you wire them to your backend.

