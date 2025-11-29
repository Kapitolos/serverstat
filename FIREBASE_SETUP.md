# Firebase Setup Guide for ShiftStats

This guide will help you set up Firebase to store your shift data in the cloud, so it works across all your devices.

## Step 1: Create Firebase Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** or **Create a project**
3. Name it `ShiftStats` (or any name you prefer)
4. Disable Google Analytics (optional, not needed)
5. Click **Create project**

## Step 2: Create Firestore Database

1. In your Firebase project, click **Firestore Database** in the left menu
2. Click **Create database**
3. Select **Start in test mode** (we'll secure it later)
4. Choose a location (pick the closest to you)
5. Click **Enable**

## Step 3: Enable Authentication

1. Click **Authentication** in the left menu
2. Click **Get started**
3. Click on **Email/Password**
4. Toggle **Enable** (first option)
5. Click **Save**

## Step 4: Get Your Firebase Config

1. Click the gear icon ⚙️ next to **Project Overview**
2. Click **Project settings**
3. Scroll down to **Your apps** section
4. Click the **Web** icon `</>`
5. Register app with nickname: `ShiftStats`
6. **Copy the `firebaseConfig` object** - you'll need this!

It looks like this:
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

## Step 5: Add Config to Your App

1. Create a file called `firebase-config.js` in your project folder
2. Paste your config into it like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. **IMPORTANT**: Add `firebase-config.js` to your `.gitignore` file (if you have one) to keep your keys private

## Step 6: Update Your HTML

The `index.html` file has been updated to include Firebase. Make sure you have:
- Firebase SDK scripts loaded
- Your `firebase-config.js` file included

## Step 7: Deploy to GitHub Pages

1. Upload all your files to GitHub (including `firebase-config.js`)
2. **BUT**: Make sure `firebase-config.js` is in `.gitignore` so your keys stay private
3. Instead, create `firebase-config.example.js` with placeholder values
4. Users will need to create their own `firebase-config.js` file

## Step 8: First Time Login

1. Open your app
2. Click "Sign In" or "Sign Up"
3. Create an account with your email and password
4. Your data will now sync to the cloud!

## Security Rules (Important - Do This!)

After setup, secure your database:

1. Go to **Firestore Database** → **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

## Troubleshooting

- **"Firebase not initialized"**: Make sure `firebase-config.js` is loaded before `script.js`
- **"Permission denied"**: Check your Firestore security rules
- **Data not syncing**: Check browser console for errors
- **Can't sign in**: Make sure Email/Password auth is enabled

## Free Tier Limits

Firebase free tier includes:
- 50K reads/day
- 20K writes/day
- 20K deletes/day

This is plenty for personal use! You'd need to log 20,000 shifts per day to hit the limit.

---

**Need Help?** Check the [Firebase Documentation](https://firebase.google.com/docs)

