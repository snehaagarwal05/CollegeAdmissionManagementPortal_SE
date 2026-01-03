import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdmissionPage.css";

const AdmissionForm = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);

  const [formData, setFormData] = useState({
    
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    category: "",

    // Address Information
    address: "",
    city: "",
    state: "",
    pincode: "",

    // Academic Information
    course: "", // will store selected course_id
    qualification: "",
    percentage: "",
    examName: "",
    examRank: "",

    // Documents (File objects)
    photo: null,
    signature: null,
    marksheet10: null,
    marksheet12: null,
    entranceCard: null,
    idProof: null,

    // Guardian Information
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/courses");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        alert("Could not load courses from server. Please try again later.");
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
      setUploadedFiles((prev) => ({
        ...prev,
        [name]: file.name,
      }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.course) {
      alert("Please select a course.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fd = new FormData();

      // Map your frontend fields to backend fields
      fd.append("student_name", formData.fullName);
      fd.append("email", formData.email);
      fd.append("phone", formData.phone);
      fd.append("course_id", formData.course); // this is the selected course id

      // Files (only append if they exist)
      if (formData.photo) fd.append("photo", formData.photo);
      if (formData.signature) fd.append("signature", formData.signature);
      if (formData.marksheet10) fd.append("marksheet10", formData.marksheet10);
      if (formData.marksheet12) fd.append("marksheet12", formData.marksheet12);
      if (formData.entranceCard)
        fd.append("entranceCard", formData.entranceCard);
      if (formData.idProof) fd.append("idProof", formData.idProof);

      const res = await fetch("http://localhost:5000/api/applications", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Submit error:", data);
        alert(
          "❌ Failed to submit application: " + (data.error || "Unknown error")
        );
        setIsSubmitting(false);
        return;
      }

      alert(
        "✅ Application submitted successfully! Your Application ID is: " +
          data.applicationId
      );

      // after successful submission
      navigate(`/application-fee/${data.applicationId}`);
      
      setIsSubmitting(false);
      //navigate("/"); // go back to home
    } catch (err) {
      console.error("Network/other error:", err);
      alert("❌ Something went wrong while submitting. Please try again.");
      setIsSubmitting(false);
    }
  };

  
  return (
    <div className="application-form-container">
      <div className="form-header">
        <h1>🎓 Admission Application Form</h1>
        <p>Fill in all the required details carefully</p>
      </div>

      <form onSubmit={handleSubmit} className="application-form">
        {/* Personal Information */}
        <section className="form-section">
          <h2>👤 Personal Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                placeholder="10-digit mobile number"
              />
            </div>

            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
          </div>
        </section>

        {/* Address Information */}
        <section className="form-section">
          <h2>🏠 Address Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Complete Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows="3"
                placeholder="House No., Street, Locality"
              />
            </div>

            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="City"
              />
            </div>

            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                placeholder="State"
              />
            </div>

            <div className="form-group">
              <label>Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                pattern="[0-9]{6}"
                placeholder="6-digit pincode"
              />
            </div>
          </div>
        </section>

        {/* Academic Information */}
        <section className="form-section">
          <h2>📚 Academic Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Course Applied For *</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                disabled={isLoadingCourses}
              >
                <option value="">
                  {isLoadingCourses ? "Loading courses..." : "Select Course"}
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Highest Qualification *</label>
              <select
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                required
              >
                <option value="">Select Qualification</option>
                <option value="10+2">10+2 / Intermediate</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
              </select>
            </div>

            <div className="form-group">
              <label>Percentage/CGPA *</label>
              <input
                type="text"
                name="percentage"
                value={formData.percentage}
                onChange={handleChange}
                required
                placeholder="e.g., 85% or 8.5 CGPA"
              />
            </div>

            <div className="form-group">
              <label>Entrance Exam Name *</label>
              <input
                type="text"
                name="examName"
                value={formData.examName}
                onChange={handleChange}
                required
                placeholder="e.g., JEE Main, WBJEE, CAT"
              />
            </div>

            <div className="form-group">
              <label>Entrance Exam Rank *</label>
              <input
                type="text"
                name="examRank"
                value={formData.examRank}
                onChange={handleChange}
                required
                placeholder="Your rank in entrance exam"
              />
            </div>
          </div>
        </section>

        {/* Document Upload */}
        <section className="form-section">
          <h2>📄 Document Upload</h2>
          <p className="document-note">
            Please upload clear scanned copies (PDF/JPG, Max 2MB each)
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label>Passport Size Photo *</label>
              <input
                type="file"
                name="photo"
                onChange={handleFileChange}
                accept="image/*"
                required
              />
              {uploadedFiles.photo && (
                <span className="file-name">✓ {uploadedFiles.photo}</span>
              )}
            </div>

            <div className="form-group">
              <label>Signature *</label>
              <input
                type="file"
                name="signature"
                onChange={handleFileChange}
                accept="image/*"
                required
              />
              {uploadedFiles.signature && (
                <span className="file-name">✓ {uploadedFiles.signature}</span>
              )}
            </div>

            <div className="form-group">
              <label>10th Marksheet *</label>
              <input
                type="file"
                name="marksheet10"
                onChange={handleFileChange}
                accept=".pdf,image/*"
                required
              />
              {uploadedFiles.marksheet10 && (
                <span className="file-name">✓ {uploadedFiles.marksheet10}</span>
              )}
            </div>

            <div className="form-group">
              <label>12th/Graduation Marksheet *</label>
              <input
                type="file"
                name="marksheet12"
                onChange={handleFileChange}
                accept=".pdf,image/*"
                required
              />
              {uploadedFiles.marksheet12 && (
                <span className="file-name">✓ {uploadedFiles.marksheet12}</span>
              )}
            </div>

            <div className="form-group">
              <label>Entrance Exam Scorecard *</label>
              <input
                type="file"
                name="entranceCard"
                onChange={handleFileChange}
                accept=".pdf,image/*"
                required
              />
              {uploadedFiles.entranceCard && (
                <span className="file-name">
                  ✓ {uploadedFiles.entranceCard}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>ID Proof (Aadhar/PAN) *</label>
              <input
                type="file"
                name="idProof"
                onChange={handleFileChange}
                accept=".pdf,image/*"
                required
              />
              {uploadedFiles.idProof && (
                <span className="file-name">✓ {uploadedFiles.idProof}</span>
              )}
            </div>
          </div>
        </section>

        {/* Guardian Information */}
        <section className="form-section">
          <h2>👨‍👩‍👧 Guardian Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Guardian Name *</label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
                required
                placeholder="Parent/Guardian name"
              />
            </div>

            <div className="form-group">
              <label>Guardian Phone *</label>
              <input
                type="tel"
                name="guardianPhone"
                value={formData.guardianPhone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                placeholder="10-digit mobile number"
              />
            </div>

            <div className="form-group">
              <label>Relationship *</label>
              <select
                name="guardianRelation"
                value={formData.guardianRelation}
                onChange={handleChange}
                required
              >
                <option value="">Select Relationship</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Legal Guardian</option>
              </select>
            </div>
          </div>
        </section>

        {/* Declaration */}
        <section className="form-section">
          <div className="declaration">
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span>
                I hereby declare that all the information provided above is true
                and correct to the best of my knowledge. I understand that any
                false information may lead to rejection of my application.
              </span>
            </label>
          </div>
        </section>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate("/admission")}
          >
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? "⏳ Submitting..." : "✅ Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdmissionForm;

