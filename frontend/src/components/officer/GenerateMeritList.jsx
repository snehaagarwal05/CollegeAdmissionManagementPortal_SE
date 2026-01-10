import React, { useEffect, useState } from "react";
import "./GenerateMeritList.css";

const GenerateMeritList = () => {
  const [students, setStudents] = useState([]);
  const [courseFilter, setCourseFilter] = useState("all");
  const [sortedList, setSortedList] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/applications")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        setSortedList(data);
      });
  }, []);

  // Sorting logic
  const generateList = () => {
    const filtered =
      courseFilter === "all"
        ? students
        : students.filter((s) => s.course_name === courseFilter);

    const sorted = [...filtered].sort((a, b) => {
      const rankA = parseInt(a.examRank || 99999);
      const rankB = parseInt(b.examRank || 99999);
      return rankA - rankB;
    });

    setSortedList(sorted);
  };

  // ⭐ NEW — function to update UI instantly in BOTH lists
  const updateLocalStatus = (id, status) => {
    // update sorted list
    setSortedList((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, selection_status: status } : s
      )
    );

    // update master students list
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, selection_status: status } : s
      )
    );
  };

  // ⭐ NEW — Update selection status (backend + frontend sync)
  const updateStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/officer/selection/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    alert(`Status updated to: ${status}`);

    // update UI instantly ✔
    updateLocalStatus(id, status);
  };

  // Download PDF (simple text file)
  const downloadPDF = () => {
    const text = sortedList
      .map(
        (s, i) =>
          `${i + 1}. ${s.student_name} - ${s.course_name} - Rank: ${
            s.examRank || "NA"
          }`
      )
      .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Merit_List.txt";
    a.click();
  };

  return (
    <div className="merit-container">
      <h1 className="merit-title">📜 Generate Merit List</h1>
      <p className="merit-subtitle">Generate ranked list of applicants</p>

      {/* Filter Section */}
      <div className="merit-filters">
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
          <option value="all">All Courses</option>
          {[...new Set(students.map((s) => s.course_name))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <button className="merit-generate-btn" onClick={generateList}>
          🔍 Generate Merit List
        </button>

        <button className="merit-download-btn" onClick={downloadPDF}>
          📩 Download List
        </button>
      </div>

      {/* Results */}
      <div className="merit-list">
        {sortedList.map((s, i) => (
          <div key={s.id} className="merit-card">
            <span className="rank">{i + 1}</span>

            <div>
              <h3>{s.student_name}</h3>
              <p>Course: {s.course_name}</p>
              <p>Entrance Rank: {s.examRank || "NA"}</p>

              {/* Display current selection status */}
              <p>
                <strong>Status:</strong>{" "}
                {s.selection_status ? s.selection_status : "Not set"}
              </p>

              {/* Action buttons */}
              <div className="selection-buttons">
                <button
                  className="select-btn"
                  onClick={() => updateStatus(s.id, "selected")}
                >
                  Select
                </button>

                <button
                  className="waitlist-btn"
                  onClick={() => updateStatus(s.id, "waitlisted")}
                >
                  Waitlist
                </button>

                <button
                  className="reject-btn"
                  onClick={() => updateStatus(s.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}

        {sortedList.length === 0 && <p>No students found.</p>}
      </div>
    </div>
  );
};

export default GenerateMeritList;
