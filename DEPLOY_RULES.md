# Deploy Firebase Rules

Your app needs the security rules deployed to Firebase!

## Run this command:

Open a NEW terminal (keep npm start running in the other one)

Navigate to the main debate folder:
```bash
cd C:\Users\chris\OneDrive\Desktop\PROGRAMMING\debate
```

Deploy the Firestore rules:
```bash
firebase deploy --only firestore:rules
```

Deploy the Realtime Database rules:
```bash
firebase deploy --only database
```

Or deploy both at once:
```bash
firebase deploy --only firestore:rules,database
```

This will allow your app to save and read debates from Firebase!
