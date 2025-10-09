# 🎤 Debate App

A real-time video debate platform with live voting, turn-based discussions, and moderator controls.

## ✨ Features

- **📹 Live Video Debates** - Face-to-face debates using Agora WebRTC
- **⏱️ Turn-Based System** - Structured debates with automatic turn switching
- **🗳️ Live Voting** - Real-time audience voting with percentage displays
- **💬 Live Chat** - Interactive chat for viewers
- **👨‍⚖️ Moderator Controls** - Pause/resume, add time, skip turns, end debate
- **🎨 Modern UI** - Dark theme with glassmorphism effects
- **🔊 Speaking Detection** - Visual indicators when debaters speak
- **⛶ Fullscreen Mode** - Immersive viewing experience

## 🚀 Tech Stack

- **Frontend**: React, React Router
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **Video**: Agora WebRTC SDK
- **Styling**: Inline CSS with Inter font

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Agora account (for video functionality)

## 🔧 Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/debate-app.git
   cd debate-app
   ```

2. **Install dependencies**

   ```bash
   cd client
   npm install
   ```

3. **Configure Firebase**

   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Copy your Firebase config

4. **Configure Agora**

   - Create an account at [agora.io](https://www.agora.io)
   - Create a new project
   - Get your App ID

5. **Environment Variables**
   Create a `.env` file in the `client` folder:

   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_AGORA_APP_ID=your_agora_app_id
   ```

6. **Deploy Firestore Rules**

   ```bash
   firebase deploy --only firestore:rules
   ```

7. **Run locally**
   ```bash
   cd client
   npm start
   ```

## 🌐 Deployment

The app is deployed using Firebase Hosting:

```bash
cd client
npm run build
firebase deploy --only hosting
```

## 📝 Firestore Collections

- `users` - User profiles and stats
- `debates` - Debate information and settings
- `debates/{id}/participants` - Debate participants
- `debates/{id}/messages` - Chat messages
- `debates/{id}/votes` - Voting data
- `debateStates` - Real-time debate state (timer, turns, pause status)

## 🎮 Usage

1. **Create a Debate** - Set topic, category, and turn settings
2. **Join as Debater** - Choose Pro or Con side with your stance
3. **Join as Moderator** - Control the debate flow
4. **Watch & Vote** - Viewers can chat and vote for their favorite side

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Built with ❤️ by darn

---

**Note**: This is a demonstration project. For production use, implement additional security measures and rate limiting.

still in testing -11
