import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import CreateDebatePage from './pages/CreateDebatePage';
import BrowseDebatesPage from './pages/BrowseDebatesPage';
import ProfilePage from './pages/ProfilePage';
import DebatePage from './pages/DebatePage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
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
      </AuthProvider>
    </Router>
  );
}

export default App;
