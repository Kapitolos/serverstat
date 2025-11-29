# Quick Start: Add Database to ShiftStats

To enable cloud storage so your data syncs across devices, you have **two options**:

## Option 1: Firebase (Recommended - Free & Easy)

**Time: 15 minutes**

1. **Create Firebase Account**
   - Go to https://console.firebase.google.com/
   - Click "Add project" → Name it "ShiftStats"
   - Click through setup (disable analytics if you want)

2. **Enable Firestore Database**
   - Click "Firestore Database" → "Create database"
   - Choose "Start in test mode"
   - Pick a location → "Enable"

3. **Enable Authentication**
   - Click "Authentication" → "Get started"
   - Click "Email/Password" → Enable it → "Save"

4. **Get Your Config**
   - Click ⚙️ (gear) → "Project settings"
   - Scroll to "Your apps" → Click Web icon `</>`
   - Register app: "ShiftStats"
   - **Copy the config object**

5. **Add Config File**
   - Create `firebase-config.js` in your project folder
   - Paste this template and fill in your values:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

6. **Deploy**
   - Upload all files to GitHub
   - **Important**: Add `firebase-config.js` to `.gitignore` to keep your keys private
   - Or use environment variables if you prefer

7. **First Use**
   - Open your app
   - Sign up with email/password
   - Your data now syncs to the cloud! 🎉

## Option 2: Keep Using localStorage (Current)

If you don't want to set up Firebase right now:
- The app will continue working with localStorage
- Data stays on your device only
- No setup needed

## Security Rules (Do This After Setup!)

1. Go to Firestore Database → Rules
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

This ensures only you can access your data.

---

**Need help?** See `FIREBASE_SETUP.md` for detailed instructions.

