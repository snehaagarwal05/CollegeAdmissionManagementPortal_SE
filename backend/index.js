const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const PDFDocument = require("pdfkit");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const generateReceipt = require("./utils/receiptGenerator");

dotenv.config();
const app = express();

app.use("/receipts", express.static(path.join(__dirname, "receipts")));
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const admitCardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/admitcards/");
  },
  filename: (req, file, cb) => {
    cb(null, `admit_${Date.now()}.pdf`);
  },
});

const uploadAdmitCard = multer({ storage: admitCardStorage });

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

/* ==================== COURSES MANAGEMENT ==================== */

app.get("/api/courses", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM courses ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

app.post("/api/courses", async (req, res) => {
  try {
    const { name, department, level, total_seats, eligibility_criteria, course_fees } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO courses (name, department, level, total_seats, available_seats, eligibility_criteria, course_fees)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, department, level, total_seats, total_seats, eligibility_criteria, course_fees]
    );

    res.json({ success: true, courseId: result.insertId });
  } catch (err) {
    console.error("Create course error:", err);
    res.status(500).json({ error: "Failed to create course" });
  }
});

app.put("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, level, total_seats, available_seats, eligibility_criteria, course_fees } = req.body;
    
    await pool.query(
      `UPDATE courses 
       SET name=?, department=?, level=?, total_seats=?, available_seats=?, eligibility_criteria=?, course_fees=?
       WHERE id=?`,
      [name, department, level, total_seats, available_seats, eligibility_criteria, course_fees, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update course error:", err);
    res.status(500).json({ error: "Failed to update course" });
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM courses WHERE id=?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete course error:", err);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

/* ==================== DRAFT APPLICATIONS ==================== */

app.post("/api/applications/draft", upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "marksheet10", maxCount: 1 },
  { name: "marksheet12", maxCount: 1 },
  { name: "entranceCard", maxCount: 1 },
  { name: "idProof", maxCount: 1 },
]), async (req, res) => {
  try {
    const {
      student_name, email, phone, dob, gender, category,
      address, city, state, pincode,
      course_preference_1, course_preference_2, course_preference_3,
      qualification, percentage, examName, examRank,
      guardianName, guardianPhone, guardianRelation,
    } = req.body;

    const files = req.files || {};
    const getPath = (f) => (files[f] && files[f][0]) ? "/uploads/" + files[f][0].filename : null;

    const [result] = await pool.query(
      `INSERT INTO applications 
       (student_name, email, phone, dob, gender, category,
        address, city, state, pincode,
        course_preference_1, course_preference_2, course_preference_3,
        qualification, percentage, examName, examRank,
        guardianName, guardianPhone, guardianRelation,
        photo_path, signature_path, marksheet10_path, marksheet12_path,
        entranceCard_path, idProof_path, is_draft, selection_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'none')`,
      [
        student_name || null, email || null, phone || null, dob || null,
        gender || null, category || null, address || null, city || null,
        state || null, pincode || null,
        course_preference_1 || null, course_preference_2 || null, course_preference_3 || null,
        qualification || null, percentage || null, examName || null, examRank || null,
        guardianName || null, guardianPhone || null, guardianRelation || null,
        getPath("photo"), getPath("signature"), getPath("marksheet10"),
        getPath("marksheet12"), getPath("entranceCard"), getPath("idProof"),
      ]
    );

    res.json({ success: true, draftId: result.insertId });
  } catch (err) {
    console.error("Save draft error:", err);
    res.status(500).json({ error: "Failed to save draft: " + err.message });
  }
});

app.get("/api/applications/drafts/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM applications WHERE email = ? AND is_draft = 1 ORDER BY created_at DESC",
      [email]
    );
    res.json(rows);
  } catch (err) {
    console.error("Get drafts error:", err);
    res.status(500).json({ error: "Failed to fetch drafts" });
  }
});

/* ==================== REGULAR APPLICATIONS ==================== */

app.post("/api/applications", upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "marksheet10", maxCount: 1 },
  { name: "marksheet12", maxCount: 1 },
  { name: "entranceCard", maxCount: 1 },
  { name: "idProof", maxCount: 1 },
]), async (req, res) => {
  try {
    const {
      student_name, email, phone, dob, gender, category,
      address, city, state, pincode,
      course_preference_1, course_preference_2, course_preference_3,
      qualification, percentage, examName, examRank,
      guardianName, guardianPhone, guardianRelation,
    } = req.body;

    const files = req.files || {};
    const getPath = (f) => (files[f] && files[f][0]) ? "/uploads/" + files[f][0].filename : null;

    const primaryCourseId = course_preference_1 || null;

    const [result] = await pool.query(
      `INSERT INTO applications 
       (student_name, email, phone, dob, gender, category,
        address, city, state, pincode,
        course_id, course_preference_1, course_preference_2, course_preference_3,
        qualification, percentage, examName, examRank,
        guardianName, guardianPhone, guardianRelation,
        photo_path, signature_path, marksheet10_path, marksheet12_path,
        entranceCard_path, idProof_path, is_draft, selection_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'none')`,
      [
        student_name || null, email || null, phone || null, dob || null,
        gender || null, category || null, address || null, city || null,
        state || null, pincode || null, primaryCourseId,
        course_preference_1 || null, course_preference_2 || null, course_preference_3 || null,
        qualification || null, percentage || null, examName || null, examRank || null,
        guardianName || null, guardianPhone || null, guardianRelation || null,
        getPath("photo"), getPath("signature"), getPath("marksheet10"),
        getPath("marksheet12"), getPath("entranceCard"), getPath("idProof"),
      ]
    );

    res.json({ success: true, applicationId: result.insertId });
  } catch (err) {
    console.error("Application submission error:", err);
    res.status(500).json({ error: "Submit failed: " + err.message });
  }
});

app.get("/api/applications", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS course_name 
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.is_draft = 0
       ORDER BY a.id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch applications error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

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

app.patch("/api/applications/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    await pool.query("UPDATE applications SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

app.post("/api/applications/lookup", async (req, res) => {
  const { id, email } = req.body;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS course_name
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.id = ? AND a.email = ? AND a.is_draft = 0`,
      [id, email]
    );
    if (!rows.length) return res.status(404).json({ error: "No match" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Lookup error:", err);
    res.status(500).json({ error: "Network error" });
  }
});

/* ==================== DOCUMENT VERIFICATION (FIXED) ==================== */

// Admin verification endpoint (matches frontend call)
app.patch("/api/applications/:id/verification", async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body;
  
  try {
    await pool.query("UPDATE applications SET admin_verified = ? WHERE id = ?", [verified ? 1 : 0, id]);
    
    // Check if both admin and faculty have verified
    const [rows] = await pool.query(
      "SELECT admin_verified, faculty_verified FROM applications WHERE id = ?",
      [id]
    );
    
    const app = rows[0];
    const documents_verified = (app.admin_verified === 1 && app.faculty_verified === 1) ? 1 : 0;
    
    await pool.query("UPDATE applications SET documents_verified = ? WHERE id = ?", [documents_verified, id]);
    
    res.json({ success: true, documents_verified });
  } catch (err) {
    console.error("Admin verification error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Faculty verification endpoint (matches frontend call)
app.patch("/api/applications/:id/faculty-verification", async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body;
  
  try {
    await pool.query("UPDATE applications SET faculty_verified = ? WHERE id = ?", [verified ? 1 : 0, id]);
    
    // Check if both admin and faculty have verified
    const [rows] = await pool.query(
      "SELECT admin_verified, faculty_verified FROM applications WHERE id = ?",
      [id]
    );
    
    const app = rows[0];
    const documents_verified = (app.admin_verified === 1 && app.faculty_verified === 1) ? 1 : 0;
    
    await pool.query("UPDATE applications SET documents_verified = ? WHERE id = ?", [documents_verified, id]);
    
    res.json({ success: true, faculty_verified: verified ? 1 : 0, documents_verified });
  } catch (err) {
    console.error("Faculty verification error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Interview date
app.patch("/api/applications/:id/interview-date", async (req, res) => {
  const { id } = req.params;
  const { interview_date } = req.body;
  
  try {
    await pool.query("UPDATE applications SET interview_date = ? WHERE id = ?", [interview_date, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Interview date update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* ==================== OFFICER ROUTES ==================== */

app.put("/api/officer/selection/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE applications SET selection_status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Selection update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

app.get("/api/officer/stats", async (req, res) => {
  try {
    const [[total]] = await pool.query("SELECT COUNT(*) AS total FROM applications WHERE is_draft=0");
    const [[verified]] = await pool.query("SELECT COUNT(*) AS verified FROM applications WHERE documents_verified = 1 AND is_draft=0");
    const [[selected]] = await pool.query("SELECT COUNT(*) AS selected FROM applications WHERE selection_status = 'selected' AND is_draft=0");
    res.json({ 
      totalApplications: total.total, 
      verifiedDocuments: verified.verified, 
      selectedStudents: selected.selected 
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Stats failed" });
  }
});

// NEW: Notification endpoint
app.post("/api/officer/notify", async (req, res) => {
  const { studentIds, message } = req.body;
  
  try {
    // In a real app, you'd send emails here
    // For now, we'll just log and return success
    console.log(`Sending notification to ${studentIds.length} students:`);
    console.log(`Message: ${message}`);
    
    // You could store notifications in DB:
    // for (const id of studentIds) {
    //   await pool.query(
    //     "INSERT INTO notifications (application_id, message, sent_at) VALUES (?, ?, NOW())",
    //     [id, message]
    //   );
    // }
    
    res.json({ success: true, count: studentIds.length });
  } catch (err) {
    console.error("Notification error:", err);
    res.status(500).json({ error: "Notification failed" });
  }
});

app.get("/api/officer/admission-letter/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT a.student_name, a.email, c.name AS course_name 
       FROM applications a LEFT JOIN courses c ON a.course_id = c.id WHERE a.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    
    const s = rows[0];
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=admission-letter-${id}.pdf`);
    
    // Header with background
    doc.rect(0, 0, doc.page.width, 100).fill("#0a1f44");
    doc.fillColor("white").fontSize(24).text("TIE COLLEGE", 50, 35);
    doc.fontSize(12).text("Excellence in Education", 50, 70);
    
    doc.moveDown(3);
    
    // Title
    doc.fillColor("#0a1f44").fontSize(18).text("ADMISSION LETTER", { align: "center" });
    doc.moveDown(2);
    
    // Content
    doc.fontSize(12).fillColor("black");
    doc.text(`Dear ${s.student_name},`, { align: "left" });
    doc.moveDown();
    doc.text("Congratulations! We are pleased to inform you that you have been granted admission to:");
    doc.moveDown();
    doc.fontSize(14).fillColor("#0a1f44").text(`Course: ${s.course_name}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).fillColor("black").text("Please report to the college office with all original documents for final verification and fee payment.");
    doc.moveDown(2);
    doc.text("Best Regards,");
    doc.text("Admission Office");
    doc.text("TIE College");
    
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("Letter generation error:", err);
    res.status(500).json({ error: "Failed to generate letter" });
  }
});

/* ==================== REPORTS ==================== */

app.get("/api/reports/admission", async (req, res) => {
  try {
    const [[total]] = await pool.query("SELECT COUNT(*) as total FROM applications WHERE is_draft=0");
    const [[approved]] = await pool.query("SELECT COUNT(*) as approved FROM applications WHERE status='approved' AND is_draft=0");
    const [[selected]] = await pool.query("SELECT COUNT(*) as selected FROM applications WHERE selection_status='selected' AND is_draft=0");
    const [[waitlisted]] = await pool.query("SELECT COUNT(*) as waitlisted FROM applications WHERE selection_status='waitlisted' AND is_draft=0");
    const [[rejected]] = await pool.query("SELECT COUNT(*) as rejected FROM applications WHERE selection_status='rejected' AND is_draft=0");
    const [[paid]] = await pool.query("SELECT COUNT(*) as paid FROM applications WHERE payment_status='paid' AND is_draft=0");

    res.json({
      totalApplications: total.total,
      approvedApplications: approved.approved,
      selectedStudents: selected.selected,
      waitlistedStudents: waitlisted.waitlisted,
      rejectedStudents: rejected.rejected,
      paidApplications: paid.paid,
    });
  } catch (err) {
    console.error("Admission report error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

app.get("/api/reports/course-wise", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.name, c.total_seats, c.available_seats,
       COUNT(a.id) as applications,
       SUM(CASE WHEN a.selection_status='selected' THEN 1 ELSE 0 END) as selected
       FROM courses c
       LEFT JOIN applications a ON c.id = a.course_id AND a.is_draft=0
       GROUP BY c.id, c.name, c.total_seats, c.available_seats`
    );
    res.json(rows);
  } catch (err) {
    console.error("Course report error:", err);
    res.status(500).json({ error: "Failed to generate course report" });
  }
});

app.get("/api/reports/payment", async (req, res) => {
  try {
    const [[totals]] = await pool.query(
      `SELECT 
       COUNT(*) as total_payments,
       SUM(payment_amount) as total_collected,
       SUM(CASE WHEN payment_status='paid' THEN payment_amount ELSE 0 END) as paid_amount,
       SUM(CASE WHEN payment_status='pending' THEN payment_amount ELSE 0 END) as pending_amount
       FROM applications WHERE is_draft=0`
    );

    const [byDate] = await pool.query(
      `SELECT DATE(payment_date) as date, COUNT(*) as count, SUM(payment_amount) as amount
       FROM applications 
       WHERE payment_status='paid' AND is_draft=0
       GROUP BY DATE(payment_date)
       ORDER BY date DESC
       LIMIT 30`
    );

    res.json({ totals: totals, byDate });
  } catch (err) {
    console.error("Payment report error:", err);
    res.status(500).json({ error: "Failed to generate payment report" });
  }
});

/* ==================== PAYMENT ==================== */

app.post("/api/payment/create-order", async (req, res) => {
  try {
    const instance = new Razorpay({ 
      key_id: process.env.RZP_KEY, 
      key_secret: process.env.RZP_SECRET 
    });
    
    const order = await instance.orders.create({ 
      amount: 100 * 100, 
      currency: "INR", 
      receipt: "receipt_" + Date.now() 
    });
    
    res.json(order);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

app.post("/api/payment/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RZP_SECRET)
      .update(sign.toString())
      .digest("hex");
    
    if (expectedSign === razorpay_signature) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

app.post("/api/payment/pay", async (req, res) => {
  try {
    const { applicationId, amount } = req.body;
    
    // Get student info
    const [rows] = await pool.query(
      `SELECT a.student_name, c.name as course_name 
       FROM applications a 
       LEFT JOIN courses c ON a.course_id = c.id 
       WHERE a.id = ?`,
      [applicationId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: "Application not found" });
    }
    
    const student = rows[0];
    
    const receiptData = {
      receiptNo: "REC" + Date.now(),
      studentName: student.student_name,
      applicationId: applicationId,
      course: student.course_name,
      amount: amount || 100,
    };

    const receiptFile = generateReceipt(receiptData);
    
    // Update payment status
    await pool.query(
      "UPDATE applications SET payment_status='paid', payment_date=NOW(), payment_amount=? WHERE id=?",
      [amount || 100, applicationId]
    );

    res.json({
      success: true,
      receiptFile,
    });
  } catch (err) {
    console.error("Payment processing error:", err);
    res.status(500).json({ error: "Payment processing failed" });
  }
});

/* ==================== ADDITIONAL DOCUMENTS ==================== */

app.post("/api/applications/:id/request-document", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    await pool.query(
      "INSERT INTO additional_documents (application_id, reason, status) VALUES (?, ?, 'requested')",
      [id, reason]
    );
    res.json({ message: "Document requested" });
  } catch (err) {
    console.error("Document request error:", err);
    res.status(500).json({ error: "Failed to request document" });
  }
});

app.get("/api/applications/:id/additional-documents", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM additional_documents WHERE application_id = ? ORDER BY created_at DESC",
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch additional docs error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

app.post("/api/additional-documents/:docId/upload", upload.single("file"), async (req, res) => {
  const { docId } = req.params;
  if (!req.file) return res.status(400).json({ error: "No file" });
  
  const filePath = `/uploads/${req.file.filename}`;
  try {
    await pool.query(
      "UPDATE additional_documents SET file_path=?, status='uploaded', uploaded_at=NOW() WHERE id=?",
      [filePath, docId]
    );
    res.json({ message: "Document uploaded" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

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


// ---------------------------------------------------------
// SELECTION STATUS UPDATE
// ---------------------------------------------------------
app.put("/api/officer/selection/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["selected", "waitlisted", "rejected", "none"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    await pool.query("UPDATE applications SET selection_status = ? WHERE id = ?", [
      status,
      id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("Selection update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ---------------------------------------------------------
// MERIT LIST
// ---------------------------------------------------------
app.get("/api/officer/merit-list", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, student_name, examRank, percentage, course_id, selection_status
     FROM applications
     ORDER BY examRank ASC`
  );

  res.json(rows);
});

// ---------------------------------------------------------
// ADMISSION LETTER PDF
// ---------------------------------------------------------
app.get("/api/officer/admission-letter/:id", async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    `SELECT student_name, email, course_id FROM applications WHERE id = ?`,
    [id]
  );

  if (!rows.length) return res.status(404).json({ error: "Not found" });

  const s = rows[0];

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");

  doc.text("TIE COLLEGE", { align: "center" });
  doc.text("------------------------------");
  doc.moveDown();
  doc.text(`Dear ${s.student_name},`);
  doc.moveDown();
  doc.text("You are selected for:");
  doc.text(`Course ID: ${s.course_id}`);
  doc.moveDown();
  doc.text("Please report with your documents.");
  doc.text("Regards,");
  doc.text("Admission Office");

  doc.pipe(res);
  doc.end();
});

// ---------------------------------------------------------
// OFFICER DASHBOARD STATS
// ---------------------------------------------------------
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

/* ==================== PORTAL REGISTRATION ==================== */

app.post("/api/portal-register", async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: "All fields required" });
  }
  
  try {
    const [existing] = await pool.query("SELECT student_id FROM portal_students WHERE email=?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Already registered" });
    }
    
    const [[{ count }]] = await pool.query("SELECT COUNT(*) as count FROM portal_students");
    const studentId = `S${String(count + 1).padStart(4, "0")}`;
    const password = Math.random().toString(36).slice(-8);
    
    await pool.query(
      "INSERT INTO portal_students (student_id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)",
      [studentId, name, email, phone, password]
    );
    
    res.json({ success: true, studentId, password });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/get-student-id", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email required" });
  }
  
  try {
    const [rows] = await pool.query(
      "SELECT student_id FROM portal_students WHERE name=? AND email=?",
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


// ---------------------------------------------------------
// INTERVIEW DATE
// ---------------------------------------------------------
app.patch("/api/applications/:id/interview-date", async (req, res) => {
  const { id } = req.params;
  const { interview_date } = req.body;

  if (!interview_date) {
    return res.status(400).json({ error: "Date is required" });
  }

  try {
    await pool.query(
      "UPDATE applications SET interview_date = ? WHERE id = ?",
      [interview_date, id]
    );

    // 👉 AUTO GENERATE ADMIT CARD
    await fetch(`http://localhost:5000/api/applications/${id}/generate-admit-card`, {
      method: "POST",
    });

    res.json({ success: true, message: "Interview date saved & admit card generated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------
// UPLOAD ADMIT CARD
// ---------------------------------------------------------
app.post(
  "/api/applications/:id/upload-admit-card",
  uploadAdmitCard.single("admit_card"),
  async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = "/uploads/admitcards/" + req.file.filename;

    try {
      await pool.query(
        "UPDATE applications SET admit_card_path = ? WHERE id = ?",
        [filePath, id]
      );

      res.json({ success: true, path: filePath });
    } catch (err) {
      console.error("Admit card upload error:", err);
      res.status(500).json({ error: "Database update failed" });
    }
  }
);

app.patch("/api/applications/:id/interview-date", async (req, res) => {
  const { id } = req.params;
  const { interview_date } = req.body;

  if (!interview_date) {
    return res.status(400).json({ error: "Date is required" });
  }

  try {
    // Fetch applicant info for PDF
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS course_name
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: "Not found" });

    const s = rows[0];

    // Generate filename
    const fileName = `admit_${id}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "uploads/admitcards", fileName);

    // Create PDF
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(filePath));

    /* ------------ HEADER -------------- */
    doc
      .rect(0, 0, 600, 110)
      .fill("#0b2d57");

    doc
      .fill("#fff")
      .fontSize(28)
      .text("TIE COLLEGE", 50, 30);

    doc
      .fontSize(14)
      .text("College Admission Management System", 50, 65);

    doc.moveDown(3);

    /* ------------ TITLE -------------- */
    doc
      .fill("#000")
      .fontSize(20)
      .text("ADMIT CARD", { align: "center" });

    doc.moveDown(1);

    /* ------------ DETAILS BOX -------------- */
    doc
      .lineWidth(1)
      .roundedRect(50, 180, 500, 260, 10)
      .stroke();

    doc.fontSize(14);

    doc.text(`Name: ${s.student_name}`, 70, 200);
    doc.text(`Application ID: ${s.id}`, 70, 230);
    doc.text(`Course: ${s.course_name}`, 70, 260);
    doc.text(`Interview Date: ${interview_date}`, 70, 290);
    doc.text(`Venue: TIE College Main Campus, Room 208`, 70, 320);

    /* ------------ FOOTER -------------- */
    doc
      .fontSize(12)
      .fillColor("gray")
      .text("Please carry all original documents.", 70, 380);

    doc.end();

    // Update DB path
    await pool.query(
      "UPDATE applications SET interview_date = ?, admit_card_path = ? WHERE id = ?",
      [interview_date, `/uploads/admitcards/${fileName}`, id]
    );

    res.json({
      success: true,
      message: "Interview date saved & admit card generated",
      admit_card: `/uploads/admitcards/${fileName}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



// ==================== ADVANCED ADMIT CARD PDF GENERATION ====================
app.post("/api/applications/:id/generate-admit-card", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS course_name 
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: "Application not found" });

    const s = rows[0];

    if (!s.interview_date)
      return res.status(400).json({ error: "Interview date not set" });

    const admitFolder = path.join(__dirname, "uploads/admitcards");
    if (!fs.existsSync(admitFolder)) fs.mkdirSync(admitFolder, { recursive: true });

    const filePath = `/uploads/admitcards/admit_${id}.pdf`;
    const absolutePath = path.join(__dirname, filePath);

    // Generate PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(absolutePath);
    doc.pipe(stream);

    // ---------------- HEADER ----------------
    doc
      .rect(0, 0, doc.page.width, 90)
      .fill("#0a3d62");

    doc
      .fillColor("white")
      .fontSize(28)
      .text("TIE COLLEGE", 50, 25);

    doc
      .fontSize(12)
      .text("OFFICIAL ADMIT CARD", 50, 60);

    // ---------------- BOX CONTAINER ----------------
    doc
      .rect(40, 120, doc.page.width - 80, 500)
      .strokeColor("#0a3d62")
      .lineWidth(2)
      .stroke();

    doc
      .fontSize(20)
      .fillColor("#0a3d62")
      .text("ADMIT CARD", 0, 135, { align: "center" });

    // ---------------- STUDENT DETAILS LEFT ----------------
    const leftX = 60;
    let y = 180;

    const label = (t) => doc.fillColor("#0a3d62").fontSize(12).text(t, leftX, y);
    const value = (t) => doc.fillColor("black").fontSize(12).text(t, leftX + 150, y);

    label("Student Name:");
    value(s.student_name); y += 30;

    label("Application ID:");
    value(`#${s.id}`); y += 30;

    label("Course:");
    value(s.course_name); y += 30;

    label("Interview Date:");
    value(new Date(s.interview_date).toLocaleString()); y += 30;

    label("Venue:");
    value("TIE College Main Campus"); y += 30;

    label("Reporting Time:");
    value("10:00 AM - 12:00 PM"); y += 30;

    // ---------------- PHOTO ON RIGHT ----------------
    if (s.photo_path) {
      try {
        const photoPath = path.join(__dirname, s.photo_path);
        doc.image(photoPath, doc.page.width - 180, 160, {
          fit: [120, 140],
          align: "center",
          valign: "center",
        });
      } catch (e) {
        console.log("Photo not found");
      }
    }

    // ---------------- INSTRUCTIONS ----------------
    doc
      .fontSize(14)
      .fillColor("#0a3d62")
      .text("Instructions:", 60, 380);

    doc
      .fontSize(11)
      .fillColor("black")
      .list(
        [
          "Bring this admit card & original ID proof.",
          "Reach venue at least 30 minutes before time.",
          "Electronic gadgets are not allowed inside.",
          "Follow COVID guidelines & safety protocols.",
        ],
        70,
        410
      );

    // ---------------- SIGNATURE AREA ----------------
    doc
      .moveTo(60, 520)
      .lineTo(240, 520)
      .stroke();

    doc
      .fontSize(12)
      .fillColor("#0a3d62")
      .text("Admission Officer Signature", 60, 525);

    // ---------------- FOOTER ----------------
    doc
      .fontSize(10)
      .fillColor("gray")
      .text("This is a system-generated admit card. No signature required.", 0, 780, {
        align: "center",
      });

    doc.end();

    stream.on("finish", async () => {
      await pool.query(
        "UPDATE applications SET admit_card_path = ? WHERE id = ?",
        [filePath, id]
      );

      res.json({
        success: true,
        message: "Admit card generated",
        path: filePath,
      });
    });

  } catch (err) {
    console.error("Admit card generation error:", err);
    res.status(500).json({ error: "Failed to generate admit card" });
  }
});

/* ===================== NOTIFICATIONS ===================== */

// Officer sends notification
app.post("/api/officer/send-notification", async (req, res) => {
  const { application_id, message } = req.body;

  if (!application_id || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    await pool.query(
      "INSERT INTO notifications (application_id, message) VALUES (?, ?)",
      [application_id, message]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Notification error:", err);
    return res.status(500).json({ error: "Failed to send notification" });
  }
});

// Student reads notifications
app.get("/api/student/notifications", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});


// Officer sends notification to all students
app.post("/api/officer/notify", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // store global notification for all students
    await pool.query(
      "INSERT INTO notifications (application_id, message) VALUES (NULL, ?)",
      [message]
    );

    res.json({ success: true, message: "Notification saved" });
  } catch (err) {
    console.error("Notify error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/student/notifications", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

app.post("/api/officer/notify", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Insert a global notification (application_id is NULL)
    await pool.query(
      "INSERT INTO notifications (application_id, message, created_at) VALUES (NULL, ?, NOW())",
      [message]
    );

    res.json({ success: true, message: "Notification sent" });
  } catch (err) {
    console.error("Notify error:", err);
    res.status(500).json({ error: "Server error while sending notification" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} ✓`));
