import React, { useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import Footer from "../footer/footer";
import NewsEvents from "./NewsEvents";
import CampusInfoSection from "./CampusInfoSection";

const Home = () => {
  const navigate = useNavigate();

  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="home">
      {/* TOP BANNER */}
      <div className="top-banner">
        <div className="banner-overlay">
          <h1 className="banner-title">
            Technology Institute of Engineering
          </h1>
          <p className="banner-subtitle">
            Earns <span>A Grade Accreditation</span> from the National
            Accreditation Council (NAC), Government of India
          </p>
        </div>
      </div>

      {/* INFO BOXES */}
      <div className="banner-info-section floating-cards">
        <div className="info-box">
          <h2>UG & PG Courses</h2>
          <p>
            Explore 16+ industry-oriented programs built for future-ready
            engineers & managers.
          </p>
        </div>

        <div className="info-box dark">
          <h2>Beyond Education</h2>
          <p>
            200+ extracurricular activities, modern labs, mentoring and
            innovative ecosystem.
          </p>
        </div>

        <div className="info-box">
          <h2>Have a Question?</h2>
          <p>E: admissions@tie.edu.in</p>
          <p>P: +91 33 2357 XXXX</p>
        </div>
      </div>

      <NewsEvents />
      <CampusInfoSection />

      {/* REGISTER BUTTON */}
      <button
        style={{
          position: "fixed",
          bottom: "90px",
          right: "30px",
          padding: "14px 22px",
          borderRadius: "30px",
          background: "#198754",
          color: "white",
          border: "none",
          fontSize: "15px",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          zIndex: 1000,
        }}
        onClick={() => {
          setStudentId("");
          setPassword("");
          setForm({ name: "", email: "", phone: "" });
          setShowRegister(true);
        }}
      >
        Register on Portal
      </button>

      {/* REGISTER MODAL */}
      {showRegister && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "30px",
              width: "360px",
              borderRadius: "14px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: "20px" }}>
              Student Portal Registration
            </h3>

            <input
              placeholder="Full Name"
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              placeholder="Email"
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <input
              placeholder="Phone Number"
              style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />

            <button
              style={{
                width: "100%",
                padding: "10px",
                background: "#0b5ed7",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={() => {
                fetch("http://localhost:5000/api/portal-register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(form),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    setStudentId(data.studentId);
                    setPassword(data.password);
                  });
              }}
            >
              Submit
            </button>

            <button
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "10px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={() => {
                setShowRegister(false);
                setStudentId("");
                setPassword("");
                setForm({ name: "", email: "", phone: "" });
              }}
            >
              Close
            </button>

            {studentId && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "12px",
                  background: "#e9f5ff",
                  borderRadius: "6px",
                }}
              >
                <strong>Your Login Details</strong>
                <p>
                  Student ID: <b>{studentId}</b>
                </p>
                <p>
                  Password: <b>{password}</b>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGIN BUTTON */}
      <button
        className="sticky-login-btn"
        onClick={() => navigate("/login")}
      >
        Login
      </button>

      <Footer />
    </div>
  );
};

export default Home;
