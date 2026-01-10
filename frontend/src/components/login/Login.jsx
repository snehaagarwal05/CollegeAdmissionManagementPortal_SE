import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { users } from "../dashboards/data";
import "./Login.css";

export default function Login() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
  console.log("Login clicked, navigating...");
  navigate("/student");
    const user = users.find(
      (u) => u.id === loginId && u.password === password
    );

    if (!user) {
      alert("Invalid ID or Password!");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));

    if (user.role === "student") navigate("/application-status");
    else if (user.role === "admin") navigate("/admin/applications"); 
    else if (user.role === "facultyReviewer") navigate("/facultyReviewer");
    else if (user.role === "admissionOfficer") navigate("/Officer");
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-box">
        <h2>Role-Based Login</h2>
        <label>Login ID</label>
        <input
          type="text"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="Enter your ID"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your Password"
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
