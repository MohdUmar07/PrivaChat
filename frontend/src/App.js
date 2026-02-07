import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom"; 
import Login from "./components/Login";
import Register from "./components/Register";
import ChatApp from "./components/ChatApp";

function App() {
  return (
    <Router>
      <nav>
        <ul>
          <li>
            <Link to="/">Login</Link>
          </li>
          <li>
            <Link to="/register">Register</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<ChatApp />} />
      </Routes>
    </Router>
  );
}

export default App;
