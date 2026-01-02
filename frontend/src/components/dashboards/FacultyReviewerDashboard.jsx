import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { users, defaultProgress } from "./data";

export default function FacultyReviewerDashboard() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState({});

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("allStudentProgress")) || {};
    const data = { ...saved };

    // Initialize missing students
    users
      .filter((u) => u.role === "student")
      .forEach((s) => {
        if (!data[s.id]) data[s.id] = { ...defaultProgress };
      });

    setStudentData(data);
    localStorage.setItem("allStudentProgress", JSON.stringify(data));
  }, []);

  const updateStudent = (id, key, value) => {
    const updated = {
      ...studentData,
      [id]: { ...studentData[id], [key]: value },
    };
    setStudentData(updated);
    localStorage.setItem("allStudentProgress", JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard">
      <h2>👨‍🏫 Faculty Reviewer Dashboard</h2>

      {Object.entries(studentData).map(([id, progress]) => {
        const student = users.find((u) => u.id === id);

        return (
          <div key={id} className="admin-student-card">
            <h3>
              {student.name} ({id})
            </h3>

            {/* ONLY field visible: Document Verification */}
            <label>
              <input
                type="checkbox"
                checked={progress.documentVerified}
                onChange={(e) =>
                  updateStudent(id, "documentVerified", e.target.checked)
                }
              />
              Document Verified
            </label>
          </div>
        );
      })}

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
