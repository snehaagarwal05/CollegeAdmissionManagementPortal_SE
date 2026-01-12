import React, { useState, useEffect } from "react";
import "./ReportsPage.css";

const ReportsPage = () => {
  const [admissionStats, setAdmissionStats] = useState(null);
  const [courseWiseData, setCourseWiseData] = useState([]);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("admission");

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      // Fetch admission report
      const admissionRes = await fetch("http://localhost:5000/api/reports/admission");
      const admissionData = await admissionRes.json();
      setAdmissionStats(admissionData);

      // Fetch course-wise report
      const courseRes = await fetch("http://localhost:5000/api/reports/course-wise");
      const courseData = await courseRes.json();
      setCourseWiseData(courseData);

      // Fetch payment report
      const paymentRes = await fetch("http://localhost:5000/api/reports/payment");
      const paymentDataResult = await paymentRes.json();
      setPaymentData(paymentDataResult);
    } catch (err) {
      console.error("Error fetching reports:", err);
      alert("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) {
    return (
      <div className="reports-container">
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>📊 Reports & Analytics</h1>
        <p>Comprehensive admission and payment insights</p>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        <button
          className={`tab ${activeTab === "admission" ? "active" : ""}`}
          onClick={() => setActiveTab("admission")}
        >
          📋 Admission Report
        </button>
        <button
          className={`tab ${activeTab === "course" ? "active" : ""}`}
          onClick={() => setActiveTab("course")}
        >
          🎓 Course-wise Report
        </button>
        <button
          className={`tab ${activeTab === "payment" ? "active" : ""}`}
          onClick={() => setActiveTab("payment")}
        >
          💰 Payment Report
        </button>
      </div>

      {/* Admission Report */}
      {activeTab === "admission" && admissionStats && (
        <div className="report-section">
          <div className="report-header-row">
            <h2>Admission Statistics</h2>
            <button
              className="btn-export"
              onClick={() =>
                exportToCSV(
                  [admissionStats],
                  "admission_report.csv"
                )
              }
            >
              📥 Export CSV
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <p className="stat-label">Total Applications</p>
                <h3 className="stat-value">{admissionStats.totalApplications}</h3>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <p className="stat-label">Approved Applications</p>
                <h3 className="stat-value">{admissionStats.approvedApplications}</h3>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">🎉</div>
              <div className="stat-info">
                <p className="stat-label">Selected Students</p>
                <h3 className="stat-value">{admissionStats.selectedStudents}</h3>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <p className="stat-label">Waitlisted Students</p>
                <h3 className="stat-value">{admissionStats.waitlistedStudents}</h3>
              </div>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <p className="stat-label">Rejected Students</p>
                <h3 className="stat-value">{admissionStats.rejectedStudents}</h3>
              </div>
            </div>

            <div className="stat-card teal">
              <div className="stat-icon">💳</div>
              <div className="stat-info">
                <p className="stat-label">Paid Applications</p>
                <h3 className="stat-value">{admissionStats.paidApplications}</h3>
              </div>
            </div>
          </div>

          {/* Visual Chart */}
          <div className="chart-container">
            <h3>Application Status Distribution</h3>
            <div className="bar-chart">
              <div className="bar-item">
                <div className="bar-label">Selected</div>
                <div className="bar-wrapper">
                  <div
                    className="bar selected"
                    style={{
                      width: `${
                        (admissionStats.selectedStudents /
                          admissionStats.totalApplications) *
                        100
                      }%`,
                    }}
                  >
                    {admissionStats.selectedStudents}
                  </div>
                </div>
              </div>

              <div className="bar-item">
                <div className="bar-label">Waitlisted</div>
                <div className="bar-wrapper">
                  <div
                    className="bar waitlisted"
                    style={{
                      width: `${
                        (admissionStats.waitlistedStudents /
                          admissionStats.totalApplications) *
                        100
                      }%`,
                    }}
                  >
                    {admissionStats.waitlistedStudents}
                  </div>
                </div>
              </div>

              <div className="bar-item">
                <div className="bar-label">Rejected</div>
                <div className="bar-wrapper">
                  <div
                    className="bar rejected"
                    style={{
                      width: `${
                        (admissionStats.rejectedStudents /
                          admissionStats.totalApplications) *
                        100
                      }%`,
                    }}
                  >
                    {admissionStats.rejectedStudents}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course-wise Report */}
      {activeTab === "course" && (
        <div className="report-section">
          <div className="report-header-row">
            <h2>Course-wise Statistics</h2>
            <button
              className="btn-export"
              onClick={() => exportToCSV(courseWiseData, "course_wise_report.csv")}
            >
              📥 Export CSV
            </button>
          </div>

          <div className="table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Total Seats</th>
                  <th>Available Seats</th>
                  <th>Applications</th>
                  <th>Selected</th>
                  <th>Occupancy Rate</th>
                </tr>
              </thead>
              <tbody>
                {courseWiseData.map((course, index) => {
                  const occupancyRate =
                    ((course.total_seats - course.available_seats) /
                      course.total_seats) *
                    100;

                  return (
                    <tr key={index}>
                      <td className="course-name">{course.name}</td>
                      <td>{course.total_seats}</td>
                      <td>
                        <span
                          className={
                            course.available_seats > 0
                              ? "seats-available"
                              : "seats-full"
                          }
                        >
                          {course.available_seats}
                        </span>
                      </td>
                      <td>{course.applications}</td>
                      <td>{course.selected}</td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${occupancyRate}%` }}
                          ></div>
                          <span className="progress-text">
                            {occupancyRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Report */}
      {activeTab === "payment" && paymentData && (
        <div className="report-section">
          <div className="report-header-row">
            <h2>Payment Statistics</h2>
            <button
              className="btn-export"
              onClick={() =>
                exportToCSV(
                  [paymentData.totals],
                  "payment_report.csv"
                )
              }
            >
              📥 Export CSV
            </button>
          </div>

          <div className="payment-stats-grid">
            <div className="payment-card total">
              <div className="payment-icon">💰</div>
              <div className="payment-info">
                <p className="payment-label">Total Payments</p>
                <h3 className="payment-value">
                  {paymentData.totals.total_payments}
                </h3>
              </div>
            </div>

            <div className="payment-card collected">
              <div className="payment-icon">✅</div>
              <div className="payment-info">
                <p className="payment-label">Amount Collected</p>
                <h3 className="payment-value">
                  ₹{Number(paymentData.totals.paid_amount).toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="payment-card pending">
              <div className="payment-icon">⏳</div>
              <div className="payment-info">
                <p className="payment-label">Pending Amount</p>
                <h3 className="payment-value">
                  ₹{Number(paymentData.totals.pending_amount).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="payment-timeline">
            <h3>Recent Payment Activity</h3>
            <div className="timeline-list">
              {paymentData.byDate.map((entry, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-date">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                  <div className="timeline-details">
                    <p className="timeline-count">{entry.count} payments</p>
                    <p className="timeline-amount">
                      ₹{Number(entry.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;