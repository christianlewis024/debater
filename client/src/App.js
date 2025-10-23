import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/layout/Header";
import HomePage from "./pages/HomePage";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";
import CreateDebatePage from "./pages/CreateDebatePage";
import BrowseDebatesPage from "./pages/BrowseDebatesPage";
import ProfilePage from "./pages/ProfilePage";
import DebatePage from "./pages/DebatePage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div
          className="App"
          style={{ position: "relative", minHeight: "100vh" }}
        >
          {/* Fixed background image layer */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "url(https://i.ibb.co/1fHyNJ68/altlogo-Photoroom.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.15,
              pointerEvents: "none",
              zIndex: 0,
              filter: "brightness(0) contrast(1.2)",
            }}
          ></div>

          {/* Content layer */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/create" element={<CreateDebatePage />} />
              <Route path="/browse" element={<BrowseDebatesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/debate/:debateId" element={<DebatePage />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
