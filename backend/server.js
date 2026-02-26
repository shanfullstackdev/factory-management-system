const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");  // ✅ ADD THIS LINE
require("dotenv").config();

/* =========================
   INITIALIZE APP
========================= */
const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   STATIC FILE SERVING (ADD THIS)
========================= */
app.use(express.static(path.join(__dirname, '../frontend')));

/* =========================
   ROUTES (KEEP SAME)
========================= */
const authRoutes = require("./routes/auth");
const employeeAuthRoutes = require("./routes/employeeAuth");
const dashboardRoutes = require("./routes/dashboard");
const employeeRoutes = require("./routes/employees");
const productionRoutes = require("./routes/production");
const paymentRoutes = require("./routes/payment");

/* =========================
   ROUTE MOUNTING (KEEP SAME)
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/employee-auth", employeeAuthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/payments", paymentRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ Ronak Jari Art Factory Backend Running");
});

/* =========================
   DATABASE CONNECTION
========================= */
mongoose
  .connect("mongodb+srv://factoryDB:admin123@cluster0.fwlzng.mongodb.net/factoryDB?retryWrites=true&w=majority")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection failed");
    console.error(err);
    process.exit(1);
  });
/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});