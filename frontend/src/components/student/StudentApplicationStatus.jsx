import React, { useState, useEffect } from "react";
import "./StudentApplicationStatus.css";

const StudentApplicationStatus = () => {
  const [form, setForm] = useState({
    id: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [application, setApplication] = useState(null);

  // existing
  const [extraDocs, setExtraDocs] = useState([]);

  // NEW — Notifications
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/student/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const formatDateTime = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setApplication(null);
    setExtraDocs([]);

    if (!form.id.trim() || !form.email.trim()) {
      setError("Please enter both Application ID and Email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/applications/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(form.id),
          email: form.email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setApplication(data);

      const docsRes = await fetch(
        `http://localhost:5000/api/applications/${data.id}/additional-documents`
      );
      const docsData = await docsRes.json();

      if (docsRes.ok) setExtraDocs(docsData);
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-page">
      <div className="status-container">
        {/* Search Card */}
        <div className="status-card">
          <h1 className="status-title">Check Application Status</h1>
          <p className="status-subtitle">
            Enter your <strong>Application ID</strong> and{" "}
            <strong>Email</strong> to view your application details.
          </p>

          <form className="status-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="id">Application ID</label>
                <input
                  id="id"
                  name="id"
                  type="number"
                  value={form.id}
                  onChange={handleChange}
                  placeholder="e.g., 6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email used during application</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Checking..." : "View Application"}
            </button>
          </form>
        </div>

        {/* ================= STUDENT APPLICATION RESULT ================= */}

        
        {application && (
          <div className="status-result-card">
            <div className="result-header">
              <div>
                <p className="result-label">Application ID</p>
                <h2 className="result-app-id">#{application.id}</h2>
              </div>

              <div className="result-status-block">
                <p className="result-label">Current Status</p>
                <span
                  className={`status-pill status-${application.status}`}
                >
                  {application.status}
                </span>
              </div>
            </div>

            <div className="result-grid">
              <div className="result-section">
                <h3 className="section-title">Applicant Details</h3>
                <p>
                  <span className="field-label">Name:</span>{" "}
                  {application.student_name}
                </p>
                <p>
                  <span className="field-label">Email:</span>{" "}
                  {application.email}
                </p>
                <p>
                  <span className="field-label">Phone:</span>{" "}
                  {application.phone || "Not provided"}
                </p>
                <p>
                  <span className="field-label">Course:</span>{" "}
                  {application.course_name}
                </p>
              </div>

              <div className="result-section">
                <h3 className="section-title">Application Summary</h3>
                <p>
                  <span className="field-label">Documents Verified:</span>{" "}
                  {application.documents_verified ? "✅ Yes" : "❌ No"}
                </p>
                <p>
                  <span className="field-label">Submitted On:</span>{" "}
                  {formatDateTime(application.created_at)}
                </p>
                <p>
                  <span className="field-label">Interview Date:</span>{" "}
                  {application.interview_date
                    ? formatDateTime(application.interview_date)
                    : "Not scheduled yet"}
                </p>
              </div>
            </div>

           
           

            <div className="divider" />

            {/* DOCUMENTS LIST */}

            <div className="pretty-card admit-wrapper">

            <div className="result-section">
              <h3 className="section-title">Documents (for your reference)</h3>

              <ul className="doc-list">
                {[
                  ["Photo", application.photo_path],
                  ["Signature", application.signature_path],
                  ["10th Marksheet", application.marksheet10_path],
                  ["12th Marksheet", application.marksheet12_path],
                  ["Entrance Scorecard", application.entranceCard_path],
                  ["ID Proof", application.idProof_path],
                ].map(([label, path]) => (
                  <li key={label}>
                    <span>{label}:</span>{" "}
                    {path ? (
                      <a
                        href={`http://localhost:5000${path}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </li>
                ))}
              </ul>
            </div>

            </div>

            <div className="divider" />

            {/* ================= ADMIT CARD ================= */}
            <div className="pretty-card admit-wrapper">
              <h3 className="section-heading" style={{ textAlign: "center" }}>
                ADMIT CARD
              </h3>

              <div className="admit-box">
                <div className="admit-row">
                  <span className="admit-label">Student Name</span>
                  <span className="admit-value">
                    {application.student_name}
                  </span>
                </div>

                <div className="admit-row">
                  <span className="admit-label">Application ID</span>
                  <span className="admit-value">#{application.id}</span>
                </div>

                <div className="admit-row">
                  <span className="admit-label">Course</span>
                  <span className="admit-value">{application.course_name}</span>
                </div>

                <div className="admit-row">
                  <span className="admit-label">Interview Date</span>
                  <span className="admit-value">
                    {application.interview_date
                      ? formatDateTime(application.interview_date)
                      : "Not Scheduled"}
                  </span>
                </div>

                <div className="admit-row">
                  <span className="admit-label">Venue</span>
                  <span className="admit-value">
                    TIE College Main Campus
                  </span>
                </div>
              </div>

              {application.admit_card_path ? (
                <a
                  href={`http://localhost:5000${application.admit_card_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="download-btn-pretty"
                >
                  📄 Download Admit Card
                </a>
              ) : (
                <p style={{ color: "gray" }}>
                  Admit card is not available yet.
                </p>
              )}
            </div>

            {/* ================= NOTIFICATIONS ================= */}
            <div className="pretty-card admit-wrapper">
            <div className="detail-card">
              <h2>📢 Notifications</h2>

              {notifications.length === 0 ? (
                <p style={{ color: "gray" }}>
                  No notifications available.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      background: "#eef5ff",
                      padding: "12px",
                      marginBottom: "10px",
                      borderRadius: "6px",
                      borderLeft: "4px solid #0b5ed7",
                    }}
                  >
                    <p>{n.message}</p>
                    <small style={{ color: "gray" }}>
                      {new Date(n.created_at).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>
            </div>

            {/* ================= DECISION ================= */}
            <div className="pretty-card admit-wrapper">
              <div className="result-section">
                <h6 className="section-title">Admission Decision</h6>

                {application.selection_status ? (
                  <p className="selection-status-box">
                    <strong>Final Decision:</strong>{" "}
                    {application.selection_status === "selected" &&
                      "🎉 Selected — Congratulations!"}
                    {application.selection_status === "waitlisted" &&
                      "⏳ Waitlisted — Please wait for updates."}
                    {application.selection_status === "rejected" &&
                      "❌ Not Selected — Try again next year."}
                  </p>
                ) : (
                  <p className="selection-status-box">
                    Decision Pending — Merit list not released yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Extra document request */}
        {extraDocs.length > 0 && (
          <div className="alert-box">
            <h3>⚠️ Additional Documents Required</h3>
            {extraDocs.map((doc) => (
              <div key={doc.id} className="extra-doc-card">
                <p>
                  <strong>Reason:</strong> {doc.reason}
                </p>
                <p>
                  <strong>Status:</strong> {doc.status}
                </p>

                {doc.status === "requested" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const file = e.target.file.files[0];
                      const formData = new FormData();
                      formData.append("file", file);

                      fetch(
                        `http://localhost:5000/api/additional-documents/${doc.id}/upload`,
                        {
                          method: "POST",
                          body: formData,
                        }
                      )
                        .then((res) => res.json())
                        .then(() =>
                          alert("Document uploaded successfully")
                        );
                    }}
                  >
                    <input type="file" name="file" required />
                    <button type="submit">Upload Document</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentApplicationStatus;
