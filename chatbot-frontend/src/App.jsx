// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
// import { useAuth } from './hooks/useAuth'; // Changed import path
import { useAuth } from './hooks/useAuth'; 
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import SignupPage from './pages/SignupPage';
import VerifyPage from './pages/VerifyPage';

// The rest of the file remains the same...

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={token ? <Navigate to="/chat" /> : <LoginPage />} 
      />
      <Route 
        path="/signup" 
        element={token ? <Navigate to="/chat" /> : <SignupPage />} 
      />
      <Route path="/verify" element={<VerifyPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/" 
        element={<Navigate to={token ? "/chat" : "/login"} />} 
      />
    </Routes>
  );
}

export default App;
