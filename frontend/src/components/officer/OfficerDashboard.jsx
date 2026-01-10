import React, { useEffect, useState } from "react";
import "./OfficerDashboard.css";
import { useNavigate } from "react-router-dom";

const OfficerDashboard = () => {
  const navigate = useNavigate();

  // --- STATS STATE ---
  const [stats, setStats] = useState({
    totalApplications: 0,
    verifiedDocuments: 0,
    selectedStudents: 0,
  });

  const [loading, setLoading] = useState(true);

  // --- FETCH STATS FROM BACKEND ---
  useEffect(() => {
    fetch("http://localhost:5000/api/officer/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading stats:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="officer-layout">
      
      {/* ---------- HEADER ---------- */}
      <main className="officer-main">
        <header className="officer-header">
          <h1>Dashboard</h1>
          <p className="welcome-text">Welcome back, Officer 👋</p>
        </header>

        {/* ---------- STATS CARDS (REPLACED DUMMY VALUES) ---------- */}
        <section className="stats-grid">
          <div className="stats-card gradient-blue">
            <h3>📥 Total Applications</h3>
            <p className="stats-number">
              {loading ? "Loading..." : stats.totalApplications}
            </p>
          </div>

          <div className="stats-card gradient-green">
            <h3>✔ Verified Documents</h3>
            <p className="stats-number">
              {loading ? "Loading..." : stats.verifiedDocuments}
            </p>
          </div>

          <div className="stats-card gradient-orange">
            <h3>🎯 Selected Students</h3>
            <p className="stats-number">
              {loading ? "Loading..." : stats.selectedStudents}
            </p>
          </div>
        </section>

        {/* ---------- ACTION BUTTONS ---------- */}
        <section className="actions-grid">
          <div
            className="action-card"
            onClick={() => navigate("/officer/merit-list")}
          >
            <div className="action-icon">📜</div>
            <h2>Generate Merit List</h2>
            <p>Create ranked list of applicants</p>
          </div>

          <div
            className="action-card"
            onClick={() => navigate("/officer/notify")}
          >
            <div className="action-icon">📣</div>
            <h2>Notify Applicants</h2>
            <p>Send messages to selected/waitlisted students</p>
          </div>

          <div
            className="action-card"
            onClick={() => navigate("/officer/admission-letter")}
          >
            <div className="action-icon">📄</div>
            <h2>Issue Admission Letter</h2>
            <p>Generate admission letter PDFs</p>
          </div>
        </section>

      </main>
    </div>
  );
};

export default OfficerDashboard;
