import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { users, defaultProgress } from "./data";

export default function AdminDashboard() {
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
      <h2>🛠 Admin Dashboard</h2>

      {Object.entries(studentData).map(([id, progress]) => {
        const student = users.find((u) => u.id === id);
        return (
          <div key={id} className="admin-student-card">
            <h3>{student.name} ({id})</h3>

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

            <label>
              Interview Date:
              <input
                type="date"
                value={progress.interviewDate}
                onChange={(e) =>
                  updateStudent(id, "interviewDate", e.target.value)
                }
              />
            </label>

            <label>
              <input
                type="checkbox"
                checked={progress.entranceExamGiven}
                onChange={(e) =>
                  updateStudent(id, "entranceExamGiven", e.target.checked)
                }
              />
              Entrance Exam Given
            </label>

            <label>
              <input
                type="checkbox"
                checked={progress.selected}
                onChange={(e) =>
                  updateStudent(id, "selected", e.target.checked)
                }
              />
              Selected
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
