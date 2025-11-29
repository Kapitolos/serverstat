# Adding Database Support to ShiftStats

To enable cloud storage so your data syncs across all devices, you need to add Firebase. Here's what you need to do:

## Quick Summary

The app currently uses **localStorage** (data stays on your device). To enable cloud sync:

1. **Set up Firebase** (15 minutes)
2. **Add your Firebase config** to the app
3. **The app will automatically use Firebase** when configured

## Step-by-Step Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Name: `ShiftStats`
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### 2. Enable Firestore Database

1. Click **"Firestore Database"** in left menu
2. Click **"Create database"**
3. Select **"Start in test mode"**
4. Choose location (closest to you)
5. Click **"Enable"**

### 3. Enable Authentication

1. Click **"Authentication"** in left menu
2. Click **"Get started"**
3. Click **"Email/Password"**
4. Toggle **"Enable"** (first option)
5. Click **"Save"**

### 4. Get Your Firebase Config

1. Click ⚙️ gear icon → **"Project settings"**
2. Scroll to **"Your apps"** section
3. Click the **Web icon** `</>`
4. Register app: **"ShiftStats"**
5. **Copy the config object** that looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 5. Create Config File

Create a file named `firebase-config.js` in your project folder:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Replace all the values** with your actual Firebase config.

### 6. Security Rules (IMPORTANT!)

1. Go to **Firestore Database** → **Rules**
2. Replace the rules with:

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

3. Click **"Publish"**

This ensures only YOU can access your data.

### 7. Deploy

1. Upload all files to GitHub
2. **IMPORTANT**: Add `firebase-config.js` to `.gitignore` to keep your keys private
3. Your site will work with Firebase!

## How It Works

- **With Firebase**: Data syncs to cloud, works across all devices
- **Without Firebase**: Falls back to localStorage (current behavior)

The app automatically detects if Firebase is configured and uses it.

## First Time Use

1. Open your app
2. You'll see a sign-in form
3. Click **"Need to sign up?"**
4. Create account with email/password
5. Your data will now sync to the cloud! 🎉

## Troubleshooting

- **"Firebase not initialized"**: Make sure `firebase-config.js` exists and has correct values
- **"Permission denied"**: Check your Firestore security rules
- **Can't sign in**: Make sure Email/Password auth is enabled in Firebase

## Free Tier

Firebase free tier includes:
- 50K reads/day
- 20K writes/day  
- 20K deletes/day

This is plenty for personal use!

---

**Need detailed help?** See `FIREBASE_SETUP.md` for more information.

