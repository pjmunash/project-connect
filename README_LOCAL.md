DEPRECATED: emulator instructions removed

You've chosen to keep the project simple and run the real backend locally.
This file previously contained instructions for using the Firebase Emulators. Those instructions are no longer recommended for your current workflow and have been removed.

To run locally (basic):

1. Start MongoDB (if needed), for example with Docker:

```powershell
docker run -d --name project-mongo -p 27017:27017 mongo:6
```

2. Start the backend (this initializes Firebase Admin using `backend/serviceAccount.json` if present):

```powershell
cd backend
npm install
npm run dev   # recommended (nodemon) or `npm start` for plain node
```

When the backend starts it will print `API: online` to indicate the HTTP API is available.

3. Start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

The frontend has a small health check that pings `/api/internships` and displays `API: online` / `API: offline` in the UI.

Environment files
 - Copy `backend/.env.example` to `backend/.env` and update `JWT_SECRET` and `MONGO_URI` as needed.
 - Copy `frontend/.env.example` to `frontend/.env` and fill your Firebase web config values if using Firebase auth.
 - If you prefer not to place a plain `serviceAccount.json` file on disk, set `FIREBASE_SERVICE_ACCOUNT_BASE64` in `backend/.env` to the base64-encoded service account JSON. The server will still run without Firebase credentials but admin/Firebase-backed endpoints will be disabled until credentials are provided.
