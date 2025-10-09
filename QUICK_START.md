# Quick Start Checklist (Free Tier - No Storage)

Copy and paste these commands one by one!

## 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

## 2. Login to Firebase

```bash
firebase login
```

## 3. Navigate to project folder

```bash
cd C:\Users\chris\OneDrive\Desktop\PROGRAMMING\debate
```

## 4. Create React App

```bash
npx create-react-app client
```

## 5. Navigate to client folder

```bash
cd client
```

## 6. Install dependencies

```bash
npm install firebase react-router-dom
```

## 7. Install Tailwind

```bash
npm install -D tailwindcss postcss autoprefixer
```

## 8. Initialize Tailwind

```bash
npx tailwindcss init -p
```

## 9. Go back to main folder

```bash
cd ..
```

## 10. Initialize Firebase

```bash
firebase init
```

**What to select (use spacebar to select/deselect):**

- [x] Firestore
- [x] Realtime Database
- [x] Hosting
- [ ] Storage (LEAVE THIS UNCHECKED - we're staying on free tier!)

**Then answer:**

- Use an existing project: Select your project
- Firestore rules: Press Enter (default)
- Firestore indexes: Press Enter (default)
- Realtime Database rules: Press Enter (default)
- Public directory: Type `client/build` and press Enter
- Single-page app: Type `y` and press Enter
- GitHub: Type `n` and press Enter

---

## After Running These Commands:

Tell me "setup complete" and I'll create all the starter files for you!

## Note on Free Tier:

We're using:

- ✅ Firestore (1GB storage, plenty for debates and messages)
- ✅ Realtime Database (1GB, perfect for viewer tracking)
- ✅ Authentication (unlimited users)
- ✅ Hosting (10GB bandwidth)

This is MORE than enough to get started and get users!
