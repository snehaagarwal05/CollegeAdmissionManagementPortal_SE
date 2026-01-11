const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const PDFDocument = require("pdfkit");
const Razorpay = require("razorpay");
const crypto = require("crypto");

dotenv.config();
const app = express();

app.use(
  "/receipts",
  express.static(path.join(__dirname, "receipts"))
);


app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB CONNECTION
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
});

// FILE UPLOADS
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "")),
});
const upload = multer({ storage });

// BASIC ROUTE
app.get("/", (req, res) => res.send("Backend running ✓"));

// COURSES
app.get("/api/courses", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM courses");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

/* -------------------- APPLY (SAVES ALL FIELDS) -------------------- */
app.post(
  "/api/applications",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "marksheet10", maxCount: 1 },
    { name: "marksheet12", maxCount: 1 },
    { name: "entranceCard", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        student_name,
        email,
        phone,
        dob,
        gender,
        category,
        address,
        city,
        state,
        pincode,
        course_id,
        qualification,
        percentage,
        examName,
        examRank,
        guardianName,
        guardianPhone,
        guardianRelation,
      } = req.body;

      const files = req.files;
      const getPath = (f) =>
        files[f] ? "/uploads/" + files[f][0].filename : null;

      const [result] = await pool.query(
        `INSERT INTO applications 
         (student_name, email, phone, dob, gender, category,
          address, city, state, pincode,
          course_id, qualification, percentage, examName, examRank,
          guardianName, guardianPhone, guardianRelation,
          photo_path, signature_path, marksheet10_path, marksheet12_path,
          entranceCard_path, idProof_path, selection_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'none')`,
        [
          student_name,
          email,
          phone,
          dob,
          gender,
          category,
          address,
          city,
          state,
          pincode,
          course_id,
          qualification,
          percentage,
          examName,
          examRank,
          guardianName,
          guardianPhone,
          guardianRelation,
          getPath("photo"),
          getPath("signature"),
          getPath("marksheet10"),
          getPath("marksheet12"),
          getPath("entranceCard"),
          getPath("idProof"),
        ]
      );

      res.json({ success: true, applicationId: result.insertId });
    } catch (err) {
      console.error("Application submission error:", err);
      res.status(500).json({ error: "Submit failed: " + err.message });
    }
  }
);

// GET ALL APPLICATIONS (ADMIN)
app.get("/api/applications", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS course_name 
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       ORDER BY a.id ASC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch applications error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// GET SINGLE APPLICATION (ADMIN PAGE)
app.get("/api/applications/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS course_name 
       FROM applications a 
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: "Not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Single fetch error:", err);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

/* -------------------- UPDATE APPLICATION STATUS (MISSING ROUTE) -------------------- */
app.put("/api/applications/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log("Status update →", id, status);

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE applications SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* -------------------- UPDATE DOCUMENT VERIFICATION STATUS -------------------- */
app.put("/api/applications/:id/verify-documents", async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE applications SET documents_verified = ? WHERE id = ?",
      [verified ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ success: true, message: "Document verification updated" });
  } catch (err) {
    console.error("Document verification error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* -------------------- UPDATE ADMIN VERIFICATION -------------------- */
app.put("/api/applications/:id/admin-verify", async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE applications SET admin_verified = ? WHERE id = ?",
      [verified ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ success: true, message: "Admin verification updated" });
  } catch (err) {
    console.error("Admin verification error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* -------------------- UPDATE FACULTY VERIFICATION -------------------- */
app.put("/api/applications/:id/faculty-verify", async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE applications SET faculty_verified = ? WHERE id = ?",
      [verified ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ success: true, message: "Faculty verification updated" });
  } catch (err) {
    console.error("Faculty verification error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// LOOKUP FOR STUDENTS
app.post("/api/applications/lookup", async (req, res) => {
  const { id, email } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS course_name
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.id = ? AND a.email = ?`,
      [id, email]
    );

    if (!rows.length) return res.status(404).json({ error: "No match" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Lookup error:", err);
    res.status(500).json({ error: "Network error" });
  }
});

// SELECTION UPDATE ROUTE
app.put("/api/officer/selection/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log("Selection update →", id, status);

  if (!["selected", "waitlisted", "rejected", "none"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE applications SET selection_status = ? WHERE id = ?",
      [status, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Selection update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// MERIT LIST
app.get("/api/officer/merit-list", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, student_name, examRank, percentage, course_id, selection_status
       FROM applications
       ORDER BY CAST(examRank AS UNSIGNED) ASC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Merit list error:", err);
    res.status(500).json({ error: "Failed to fetch merit list" });
  }
});

// ADMISSION LETTER PDF
app.get("/api/officer/admission-letter/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT a.student_name, a.email, c.name AS course_name 
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: "Not found" });

    const s = rows[0];

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=admission-letter-${id}.pdf`
    );

    doc.fontSize(20).text("TIE COLLEGE", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text("ADMISSION LETTER", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text("-------------------------------------------------------------");
    doc.moveDown();
    doc.text(`Dear ${s.student_name},`);
    doc.moveDown();
    doc.text(
      "Congratulations! You have been selected for admission to the following course:"
    );
    doc.moveDown();
    doc.fontSize(14).text(`Course: ${s.course_name}`, { bold: true });
    doc.fontSize(12);
    doc.moveDown();
    doc.text("Please report to the admission office with all original documents:");
    doc.moveDown();
    doc.text("• 10th and 12th Marksheets");
    doc.text("• Entrance Exam Scorecard");
    doc.text("• ID Proof (Aadhar/PAN)");
    doc.text("• Passport Size Photographs");
    doc.moveDown();
    doc.text("Regards,");
    doc.text("Admission Office");
    doc.text("TIE College");

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("Admission letter error:", err);
    res.status(500).json({ error: "Failed to generate letter" });
  }
});

// OFFICER DASHBOARD STATS
app.get("/api/officer/stats", async (req, res) => {
  try {
    const [[total]] = await pool.query(
      "SELECT COUNT(*) AS total FROM applications"
    );
    const [[verified]] = await pool.query(
      "SELECT COUNT(*) AS verified FROM applications WHERE documents_verified = 1"
    );
    const [[selected]] = await pool.query(
      "SELECT COUNT(*) AS selected FROM applications WHERE selection_status = 'selected'"
    );

    res.json({
      totalApplications: total.total,
      verifiedDocuments: verified.verified,
      selectedStudents: selected.selected,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Stats failed" });
  }
});

/* ------------------ RAZORPAY ORDER API ------------------ */
app.post("/api/payment/create-order", async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RZP_KEY,
      key_secret: process.env.RZP_SECRET,
    });

    const options = {
      amount: 100 * 100, // 100 INR in paise
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    };

    const order = await instance.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

/* ------------------ RAZORPAY PAYMENT VERIFY (UPDATES DB) ------------------ */
app.post("/api/payment/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } =
      req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RZP_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign === razorpay_signature) {
      // Update payment status in database
      await pool.query(
        `UPDATE applications 
         SET payment_status = 'paid', 
             payment_id = ?, 
             payment_date = NOW()
         WHERE id = ?`,
        [razorpay_payment_id, applicationId]
      );

      return res.json({ success: true });
    }

    res.json({ success: false, error: "Invalid signature" });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

/* -------------------- ADMIN REQUESTS EXTRA DOCUMENT -------------------- */
app.post("/api/applications/:id/request-document", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "Reason is required" });
  }

  try {
    await pool.query(
      `INSERT INTO additional_documents (application_id, reason, status)
       VALUES (?, ?, 'requested')`,
      [id, reason]
    );

    res.json({ message: "Additional document requested successfully" });
  } catch (err) {
    console.error("Request document error:", err);
    res.status(500).json({ error: "Failed to request document" });
  }
});

/* -------------------- GET REQUESTED EXTRA DOCUMENTS -------------------- */
app.get("/api/applications/:id/additional-documents", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT id, reason, status, file_path, created_at, uploaded_at
       FROM additional_documents
       WHERE application_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch additional docs error:", err);
    res.status(500).json({ error: "Failed to fetch additional documents" });
  }
});

/* -------------------- STUDENT UPLOADS REQUESTED DOCUMENT -------------------- */
app.post(
  "/api/additional-documents/:docId/upload",
  upload.single("file"),
  async (req, res) => {
    const { docId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = `/uploads/${req.file.filename}`;

    try {
      const [result] = await pool.query(
        `UPDATE additional_documents
         SET file_path = ?, status = 'uploaded', uploaded_at = NOW()
         WHERE id = ?`,
        [filePath, docId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Document request not found" });
      }

      res.json({ message: "Document uploaded successfully" });
    } catch (err) {
      console.error("Upload extra doc error:", err);
      res.status(500).json({ error: "Failed to upload document" });
    }
  }
);

/* -------------------- ADMIN APPROVES EXTRA DOCUMENT -------------------- */
app.patch("/api/additional-documents/:docId/approve", async (req, res) => {
  const { docId } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE additional_documents SET status = 'approved' WHERE id = ?",
      [docId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Document request not found" });
    }

    res.json({ message: "Additional document approved" });
  } catch (err) {
    console.error("Approve extra doc error:", err);
    res.status(500).json({ error: "Failed to approve document" });
  }
});

/* -------------------- PORTAL REGISTRATION -------------------- */
app.post("/api/portal-register", async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    // Check if student already exists
    const [existing] = await pool.query(
      "SELECT student_id FROM portal_students WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Student already registered" });
    }

    // Generate unique student ID
    const [[{ count }]] = await pool.query(
      "SELECT COUNT(*) as count FROM portal_students"
    );
    const studentId = `S${String(count + 1).padStart(4, "0")}`;

    // Generate random password (8 characters)
    const password = Math.random().toString(36).slice(-8);

    await pool.query(
      "INSERT INTO portal_students (student_id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)",
      [studentId, name, email, phone, password]
    );

    res.json({
      success: true,
      studentId,
      password,
      message: "Please save these credentials securely",
    });
  } catch (err) {
    console.error("Portal registration error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------ GET STUDENT ID USING NAME + EMAIL ------------------ */
app.post("/api/get-student-id", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT student_id FROM portal_students WHERE name = ? AND email = ?",
      [name, email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ studentId: rows[0].student_id });
  } catch (err) {
    console.error("Get student ID error:", err);
    res.status(500).json({ error: err.message });
  }
});

// START SERVER
app.listen(5000, () => console.log("Server running on port 5000 ✓"));
