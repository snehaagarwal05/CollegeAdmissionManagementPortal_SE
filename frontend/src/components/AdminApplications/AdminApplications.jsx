import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminApplications.css";

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("All"); // for filtering by course
  const navigate = useNavigate();

  // Fetch all applications once
  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("http://localhost:5000/api/applications");
        const data = await res.json();

        if (!res.ok) {
          console.error(data);
          setError(data.error || "Failed to load applications");
          setApplications([]);
          return;
        }

        // sort by ID ascending (1,2,3,4…)
        const sorted = [...data].sort((a, b) => a.id - b.id);
        setApplications(sorted);
      } catch (err) {
        console.error(err);
        setError("Network error while loading applications");
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

  // Approve / Reject
  const updateStatus = async (id, status) => {
    if (
      !window.confirm(
        `Are you sure you want to mark this application as ${status.toUpperCase()}?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/applications/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert(data.error || "Failed to update status");
        return;
      }

      // update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status } : app
        )
      );
    } catch (err) {
      console.error(err);
      alert("Network error while updating status");
    }
  };

  // Go to detail page when clicking on student name
  const handleRowClick = (id) => {
    navigate(`/admin/applications/${id}`);
  };

  // Build list of unique courses for dropdown
  const uniqueCourses = Array.from(
    new Set(applications.map((a) => a.course_name).filter(Boolean))
  ).sort();

  // Apply course filter + keep ID ascending
  const filteredApps = applications
    .filter((app) => {
      if (courseFilter === "All") return true;
      return app.course_name === courseFilter;
    })
    .sort((a, b) => a.id - b.id);

  return (
    <div className="admin-container">
      <h1 className="admin-title">
        <span role="img" aria-label="file">
          📄
        </span>{" "}
        All Submitted Applications
      </h1>

      {loading && <p>Loading applications...</p>}
      {error && <p className="error-text">{error}</p>}

      {/* Course filter row */}
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

      {!loading && filteredApps.length === 0 && (
        <p>No applications found for this filter.</p>
      )}

      {filteredApps.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Course</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id}>
                  <td>{app.id}</td>
                  <td
                    className="clickable-name"
                    onClick={() => handleRowClick(app.id)}
                  >
                    {app.student_name}
                  </td>
                  <td>{app.email}</td>
                  <td>{app.phone || "-"}</td>
                  <td>{app.course_name || "-"}</td>
                  <td>
                    <span className={`status-pill status-${app.status}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    {app.created_at
                      ? new Date(app.created_at).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    <button
                      className="btn-small approve"
                      onClick={() => updateStatus(app.id, "approved")}
                    >
                      ✅ Approve
                    </button>
                    <button
                      className="btn-small reject"
                      onClick={() => updateStatus(app.id, "rejected")}
                    >
                      ❌ Reject
                    </button>
                    {/* 🔴 Pending button removed as requested */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;


