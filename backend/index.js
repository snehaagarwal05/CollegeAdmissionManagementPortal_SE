
const Razorpay = require("razorpay");
const crypto = require("crypto");


const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");

dotenv.config();
const app = express();

/* -------------------- File upload (multer) -------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + unique + ext);
  },
});
const upload = multer({ storage });

/* -------------------- Middlewares -------------------- */
app.use(
  cors({
    origin: "http://localhost:5173", // your React dev server
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve uploaded files

/* -------------------- MySQL pool -------------------- */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "college_admission",
  port: process.env.DB_PORT || 3308,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


/* -------------------- Basic test routes -------------------- */
app.get("/", (req, res) => {
  res.send("Backend is running 🎉");
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");
    res.json({ success: true, rows });
  } catch (err) {
    console.error("DB test error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -------------------- Courses -------------------- */
app.get("/api/courses", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM courses");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

/* -------------------- Submit application (with files) -------------------- */
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
    const { student_name, email, phone, course_id } = req.body;

    if (!student_name || !email || !course_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const files = req.files || {};
    const photoPath =
      files.photo && files.photo[0] ? `/uploads/${files.photo[0].filename}` : null;
    const signaturePath =
      files.signature && files.signature[0]
        ? `/uploads/${files.signature[0].filename}`
        : null;
    const marksheet10Path =
      files.marksheet10 && files.marksheet10[0]
        ? `/uploads/${files.marksheet10[0].filename}`
        : null;
    const marksheet12Path =
      files.marksheet12 && files.marksheet12[0]
        ? `/uploads/${files.marksheet12[0].filename}`
        : null;
    const entranceCardPath =
      files.entranceCard && files.entranceCard[0]
        ? `/uploads/${files.entranceCard[0].filename}`
        : null;
    const idProofPath =
      files.idProof && files.idProof[0]
        ? `/uploads/${files.idProof[0].filename}`
        : null;

    try {
      const [result] = await pool.query(
        `INSERT INTO applications 
         (student_name, email, phone, course_id,
          photo_path, signature_path, marksheet10_path, marksheet12_path,
          entranceCard_path, idProof_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student_name,
          email,
          phone || null,
          course_id,
          photoPath,
          signaturePath,
          marksheet10Path,
          marksheet12Path,
          entranceCardPath,
          idProofPath,
        ]
      );

      res.status(201).json({
        message: "Application submitted successfully",
        applicationId: result.insertId,
      });
    } catch (err) {
      console.error("Error saving application:", err);
      res.status(500).json({ error: "Failed to submit application" });
    }
  }
);

/* -------------------- Get all applications (admin/faculty) -------------------- */
app.get("/api/applications", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          a.id,
          a.student_name,
          a.email,
          a.phone,
          a.status,
          a.admin_verified,
          a.faculty_verified,
          a.documents_verified,
          a.interview_date,
          a.created_at,
          a.photo_path,
          a.signature_path,
          a.marksheet10_path,
          a.marksheet12_path,
          a.entranceCard_path,
          a.idProof_path,
          c.name AS course_name
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       ORDER BY c.name ASC, a.student_name ASC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/* -------------------- Update status (approve / reject) -------------------- */
app.patch("/api/applications/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["approved", "rejected"]; // no "pending" here
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE applications SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/* -------------------- Admin: document verification toggle -------------------- */
app.patch("/api/applications/:id/verification", async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body; // true / false

  if (typeof verified !== "boolean") {
    return res.status(400).json({ error: "verified must be boolean" });
  }

  try {
    // 1) Update admin_verified field
    const [updateResult] = await pool.query(
      "UPDATE applications SET admin_verified = ? WHERE id = ?",
      [verified ? 1 : 0, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    // 2) Get admin & faculty flags
    const [rows] = await pool.query(
      "SELECT admin_verified, faculty_verified FROM applications WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Application not found after update" });
    }

    const adminVerified = rows[0].admin_verified === 1;
    const facultyVerified = rows[0].faculty_verified === 1;

    // 3) documents_verified = both true
    const docVerified = adminVerified && facultyVerified ? 1 : 0;

    await pool.query(
      "UPDATE applications SET documents_verified = ? WHERE id = ?",
      [docVerified, id]
    );

    res.json({
      message: "Admin verification updated successfully",
      admin_verified: adminVerified ? 1 : 0,
      documents_verified: docVerified,
    });
  } catch (err) {
    console.error("Error updating document verification:", err);
    res.status(500).json({ error: "Failed to update document verification" });
  }
});

/* -------------------- Faculty: document verification toggle -------------------- */
app.patch("/api/applications/:id/faculty-verification", async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body; // true / false

  if (typeof verified !== "boolean") {
    return res.status(400).json({ error: "verified must be boolean" });
  }

  try {
    const [updateResult] = await pool.query(
      "UPDATE applications SET faculty_verified = ? WHERE id = ?",
      [verified ? 1 : 0, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const [rows] = await pool.query(
      "SELECT admin_verified, faculty_verified FROM applications WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Application not found after update" });
    }

    const adminVerified = rows[0].admin_verified === 1;
    const facultyVerified = rows[0].faculty_verified === 1;

    const docVerified = adminVerified && facultyVerified ? 1 : 0;

    await pool.query(
      "UPDATE applications SET documents_verified = ? WHERE id = ?",
      [docVerified, id]
    );

    res.json({
      message: "Faculty verification updated successfully",
      faculty_verified: facultyVerified ? 1 : 0,
      documents_verified: docVerified,
    });
  } catch (err) {
    console.error("Error updating faculty verification:", err);
    res.status(500).json({ error: "Failed to update faculty verification" });
  }
});

/* -------------------- Admin: set interview date -------------------- */
app.patch("/api/applications/:id/interview-date", async (req, res) => {
  const { id } = req.params;
  const { interview_date } = req.body; // ISO string from frontend

  try {
    const [result] = await pool.query(
      "UPDATE applications SET interview_date = ? WHERE id = ?",
      [interview_date || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ message: "Interview date updated successfully" });
  } catch (err) {
    console.error("Error updating interview date:", err);
    res.status(500).json({ error: "Failed to update interview date" });
  }
});

/* -------------------- Student lookup by ID + email -------------------- */
app.post("/api/applications/lookup", async (req, res) => {
  const { id, email } = req.body;

  if (!id || !email) {
    return res
      .status(400)
      .json({ error: "Application ID and email are required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT 
          a.id,
          a.student_name,
          a.email,
          a.phone,
          a.status,
          a.documents_verified,
          a.interview_date,
          a.created_at,
          a.photo_path,
          a.signature_path,
          a.marksheet10_path,
          a.marksheet12_path,
          a.entranceCard_path,
          a.idProof_path,
          c.name AS course_name
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.id = ? AND a.email = ?`,
      [id, email]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No application found for this ID + email" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching application by lookup:", err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});

/* -------------------- Single application by ID (admin detail) -------------------- */
app.get("/api/applications/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT 
          a.id,
          a.student_name,
          a.email,
          a.phone,
          a.status,
          a.admin_verified,
          a.faculty_verified,
          a.documents_verified,
          a.interview_date,
          a.created_at,
          a.photo_path,
          a.signature_path,
          a.marksheet10_path,
          a.marksheet12_path,
          a.entranceCard_path,
          a.idProof_path,
          c.name AS course_name
       FROM applications a
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching application:", err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});


app.post("/api/payment/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 100 * 100, // ₹100 in paise
      currency: "INR",
      receipt: "admission_fee_" + Date.now(),
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create order" });
  }
});


app.post("/api/payment/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});



/* -------------------- Start server -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
