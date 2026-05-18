import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Register from "./components/Register";
import ChatApp from "./components/ChatApp";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="w-full max-w-6xl">
                <Login />
              </div>
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="w-full max-w-6xl">
                <Register />
              </div>
            </div>
          }
        />
        <Route path="/chat" element={<ChatApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
