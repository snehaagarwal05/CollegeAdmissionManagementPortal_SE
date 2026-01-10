
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
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// DB CONNECTION 

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "college_admission",
  port: process.env.DB_PORT || 3308,
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

app.get("/", (req, res) => res.send("Backend running ✔"));


// COURSES

app.get("/api/courses", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM courses");
  res.json(rows);
});


/* -------------------- APPLY -------------------- */
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
      const { student_name, email, phone, course_id } = req.body;

      const files = req.files;
      const getPath = (f) => (files[f] ? "/uploads/" + files[f][0].filename : null);

      const [result] = await pool.query(
        `INSERT INTO applications 
         (student_name, email, phone, course_id,
          photo_path, signature_path, marksheet10_path, marksheet12_path,
          entranceCard_path, idProof_path, selection_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'none')`,
        [
          student_name,
          email,
          phone,
          course_id,
          getPath("photo"),
          getPath("signature"),
          getPath("marksheet10"),
          getPath("marksheet12"),
          getPath("entranceCard"),
          getPath("idProof"),
        ]
      );

      res.json({ success: true, applicationId: result.insertId });  // <-- FIXED
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Submit failed" });
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


// FINAL — ONLY ONE SELECTION UPDATE ROUTE

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
  const [rows] = await pool.query(
    `SELECT id, student_name, examRank, percentage, course_id, selection_status
     FROM applications
     ORDER BY examRank ASC`
  );

  res.json(rows);
});


// ADMISSION LETTER PDF

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
  doc.text("Please report with all original documents.");
  doc.text("Regards,");
  doc.text("Admission Office");

  doc.pipe(res);
  doc.end();
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
  const Razorpay = require("razorpay");

  const instance = new Razorpay({
    key_id: process.env.RZP_KEY,
    key_secret: process.env.RZP_SECRET,
  });

  const options = {
    amount: 100 * 100,
    currency: "INR",
    receipt: "receipt_order_" + Date.now(),
  };

  try {
    const order = await instance.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

/* ------------------ RAZORPAY PAYMENT VERIFY ------------------ */
app.post("/api/payment/verify", (req, res) => {
  const crypto = require("crypto");

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSign = crypto
    .createHmac("sha256", process.env.RZP_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (expectedSign === razorpay_signature) {
    return res.json({ success: true });
  }

  res.json({ success: false });
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



// START SERVER

app.listen(5000, () => console.log("Server running on port 5000 ✔"));

