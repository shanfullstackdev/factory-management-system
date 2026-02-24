const express = require("express");
const router = express.Router();
const Employee = require("../models/employee");

/* =========================
   TEMP OTP STORE (IN-MEMORY)
========================= */
const otpStore = {}; // { mobile: otp }

/* =========================
   SEND OTP
   POST /api/employee-auth/send-otp
========================= */
router.post("/send-otp", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number required" });
    }

    // check employee exists
    const employee = await Employee.findOne({ mobile });

    if (!employee) {
      console.log(`❌ Employee not found for mobile: ${mobile}`);
      return res.status(404).json({ message: "Employee not found" });
    }

    // generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    otpStore[mobile] = otp;

    // ❗ For development (OTP shown in terminal)
    console.log(`📲 OTP for ${mobile}: ${otp}`);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* =========================
   VERIFY OTP
   POST /api/employee-auth/verify-otp
========================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile and OTP required" });
    }

    if (otpStore[mobile] != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const employee = await Employee.findOne({ mobile });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // OTP verified → remove it
    delete otpStore[mobile];

    res.json({
      message: "Login successful",
      employeeId: employee._id,
      name: employee.name
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP verification failed" });
  }
});


module.exports = router;
