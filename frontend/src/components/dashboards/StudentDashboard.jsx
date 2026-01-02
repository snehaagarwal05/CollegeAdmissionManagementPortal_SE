import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { defaultProgress } from "./data";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [progress, setProgress] = useState(defaultProgress);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem("allStudentProgress")) || {};
    if (all[user.id]) setProgress(all[user.id]);
    else setProgress(defaultProgress);
  }, [user.id]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handlePay = () => navigate("/payment");

  return (
    <div className="dashboard">
      <h2>🎓 Welcome, {user.name}</h2>
      <h4>Your Admission Progress</h4>

      <div className="progress-container">
        <Step label="Register" checked={true} />
        <Step label="Form Fill-Up" checked={true} />
        <Step label="Upload Documents" checked={true} />
        <Step label="Payment" checked={true} />
        <Step label="Document Verified" checked={progress.documentVerified} />
        <Step
          label="Interview Scheduled"
          checked={progress.interviewDate !== ""}
          extra={
            progress.interviewDate && (
              <span className="interview-date">
                Date: {progress.interviewDate}
              </span>
            )
          }
        />
        <Step label="Entrance Exam Given" checked={progress.entranceExamGiven} />
        <Step label="Selected" checked={progress.selected} />

        {progress.selected && (
          <button onClick={handlePay} className="pay-btn">
            💳 Pay Admission Fees
          </button>
        )}
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

function Step({ label, checked, extra }) {
  return (
    <div className={`step ${checked ? "done" : ""}`}>
      <input type="checkbox" checked={checked} readOnly />
      <span>{label}</span>
      {extra && extra}
    </div>
  );
}
