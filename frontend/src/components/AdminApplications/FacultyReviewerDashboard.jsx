import React, { useEffect, useState } from "react";
import "./AdminApplications.css";

const FacultyReviewerDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "facultyVerified" | "facultyNotVerified"
  const [courseFilter, setCourseFilter] = useState("All");
  const [selectedApp, setSelectedApp] = useState(null); // for modal

  
  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/applications");
        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Failed to load applications");
          return;
        }

        setApplications(data);
      } catch (err) {
        console.error(err);
        alert("Network error while loading applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

 
  const handleFacultyVerification = async (appId, checked) => {
    if (
      !window.confirm(
        `Mark this student's documents as ${
          checked ? "VERIFIED" : "NOT verified"
        }?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/applications/${appId}/faculty-verification`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verified: checked }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error(data);
        alert(data.error || "Failed to update faculty verification");
        return;
      }

      
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                faculty_verified: data.faculty_verified,
                documents_verified: data.documents_verified,
              }
            : a
        )
      );
    } catch (err) {
      console.error(err);
      alert("Network error while updating verification");
    }
  };

  // ---------- Derived values ----------
  const totalApps = applications.length;
  const facultyVerifiedCount = applications.filter(
    (a) => a.faculty_verified === 1
  ).length;
  const facultyNotVerifiedCount = applications.filter(
    (a) => a.faculty_verified === 0
  ).length;

  // Unique courses for filter dropdown
  const uniqueCourses = Array.from(
    new Set(applications.map((a) => a.course_name).filter(Boolean))
  ).sort();


  const filteredAndSortedApps = [...applications]
    .filter((app) => {
      if (activeFilter === "facultyVerified") return app.faculty_verified === 1;
      if (activeFilter === "facultyNotVerified")
        return app.faculty_verified === 0;
      return true;
    })
    .filter((app) => {
      if (courseFilter === "All") return true;
      return app.course_name === courseFilter;
    })
    .sort((a, b) => (a.id || 0) - (b.id || 0));

  
  const openModal = (app) => setSelectedApp(app);
  const closeModal = () => setSelectedApp(null);

  if (loading) {
    return (
      <div className="admin-container">
        <p>Loading faculty dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1 style={{ marginBottom: "1.5rem" }}>👨‍🏫 Faculty Reviewer Dashboard</h1>

      {/* ===== Stats row ===== */}
      <div className="stats-container">
        {/* TOTAL APPLICATIONS */}
        <div
          className={`stat-box clickable ${
            activeFilter === "all" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("all")}
        >
          <div className="stat-icon">📋</div>
          <p className="stat-label">TOTAL APPLICATIONS</p>
          <h2 className="stat-number">{totalApps}</h2>
        </div>

        {/* FACULTY VERIFIED */}
        <div
          className={`stat-box clickable ${
            activeFilter === "facultyVerified" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("facultyVerified")}
        >
          <div className="stat-icon">✅</div>
          <p className="stat-label">FACULTY VERIFIED</p>
          <h2 className="stat-number">{facultyVerifiedCount}</h2>
        </div>

        {/* FACULTY NOT VERIFIED */}
        <div
          className={`stat-box clickable ${
            activeFilter === "facultyNotVerified" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("facultyNotVerified")}
        >
          <div className="stat-icon">❌</div>
          <p className="stat-label">FACULTY NOT VERIFIED</p>
          <h2 className="stat-number">{facultyNotVerifiedCount}</h2>
        </div>
      </div>

      {/* ===== Filter bar ===== */}
      <div className="filter-bar">
        <label htmlFor="courseFilter">Filter by Course:</label>
        <select
          id="courseFilter"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="All">All Courses</option>
          {uniqueCourses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
      </div>

      {/* ===== Cards ===== */}
      {filteredAndSortedApps.length === 0 ? (
        <p style={{ marginTop: "1rem" }}>No applications match this filter.</p>
      ) : (
        <div className="admin-card-list">
          {filteredAndSortedApps.map((app) => (
            <div key={app.id} className="admin-card">
              {/* Application ID badge */}
              <div className="id-badge">ID: {app.id}</div>

              <h3>{app.student_name}</h3>
              <p className="admin-card-subtitle">{app.email}</p>

              <div className="course-pill">
                {app.course_name || "Course not specified"}
              </div>

              {/* Verification checkbox */}
              <div className="checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={app.faculty_verified === 1}
                    onChange={(e) =>
                      handleFacultyVerification(app.id, e.target.checked)
                    }
                  />{" "}
                  Document Verified
                </label>
              </div>

              {/* Profile modal trigger */}
              <button
                type="button"
                className="btn-small view-docs-btn"
                onClick={() => openModal(app)}
              >
                View Full Profile
              </button>

              <p className="small-text">
                Final document status shown to students is based on both Admin
                and Faculty verification.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ===== Modal for full student profile ===== */}
      {selectedApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px 28px",
              maxWidth: "650px",
              width: "95%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h2 style={{ margin: 0 }}>
                Application #{selectedApp.id} – {selectedApp.student_name}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✖
              </button>
            </div>

            <hr />

            <h3>Student Information</h3>
            <p>
              <strong>Email:</strong> {selectedApp.email}
            </p>
            <p>
              <strong>Phone:</strong> {selectedApp.phone || "Not provided"}
            </p>
            <p>
              <strong>Course:</strong> {selectedApp.course_name || "N/A"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`status ${selectedApp.status}`}>
                {selectedApp.status}
              </span>
            </p>
            <p>
              <strong>Documents Verified (Final):</strong>{" "}
              {selectedApp.documents_verified ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Submitted:</strong>{" "}
              {selectedApp.created_at
                ? new Date(selectedApp.created_at).toLocaleString()
                : "N/A"}
            </p>

            <h3 style={{ marginTop: "16px" }}>Uploaded Documents</h3>
            <ul>
              <li>
                Photo:{" "}
                {selectedApp.photo_path ? (
                  <a
                    href={`http://localhost:5000${selectedApp.photo_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                ) : (
                  "Not uploaded"
                )}
              </li>
              <li>
                Signature:{" "}
                {selectedApp.signature_path ? (
                  <a
                    href={`http://localhost:5000${selectedApp.signature_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                ) : (
                  "Not uploaded"
                )}
              </li>
              <li>
                10th Marksheet:{" "}
                {selectedApp.marksheet10_path ? (
                  <a
                    href={`http://localhost:5000${selectedApp.marksheet10_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                ) : (
                  "Not uploaded"
                )}
              </li>
              <li>
                12th / Graduation Marksheet:{" "}
                {selectedApp.marksheet12_path ? (
                  <a
                    href={`http://localhost:5000${selectedApp.marksheet12_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                ) : (
                  "Not uploaded"
                )}
              </li>
              <li>
                Entrance Exam Scorecard:{" "}
                {selectedApp.entranceCard_path ? (
                  <a
                    href={`http://localhost:5000${selectedApp.entranceCard_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                ) : (
                  "Not uploaded"
                )}
              </li>
              <li>
                ID Proof:{" "}
                {selectedApp.idProof_path ? (
                  <a
                    href={`http://localhost:5000${selectedApp.idProof_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                ) : (
                  "Not uploaded"
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyReviewerDashboard;
