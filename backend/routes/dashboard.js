const express = require("express");
const router = express.Router();
const Production = require("../models/production");
const Payment = require("../models/payments");
const Employee = require("../models/employee");

/* =========================
   GET DASHBOARD SUMMARY
   GET /api/dashboard
========================= */
router.get("/", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total Employees
    const totalEmployees = await Employee.countDocuments();

    // 2. Production Stats (Today & Month)
    const todayProduction = await Production.aggregate([
      { $match: { date: { $gte: today } } },
      { $group: { _id: null, totalPS: { $sum: "$ps" }, totalAmount: { $sum: "$total" } } }
    ]);

    const monthlyProduction = await Production.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: null, totalPS: { $sum: "$ps" }, totalAmount: { $sum: "$total" } } }
    ]);

    // 3. Pending Payments (Total Amount)
    const pendingPayments = await Payment.aggregate([
      { $match: { status: "Pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 4. Recent Production (Limit 5)
    // Populate employee to get name
    const recentProduction = await Production
      .find()
      .populate("employee", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Recent Pending Payments (Limit 5)
    const recentPendingPayments = await Payment
      .find({ status: "Pending" })
      .populate("employeeId", "name")
      .sort({ date: -1 })
      .limit(5);

    res.json({
      totalEmployees,
      todayProduction: todayProduction[0] || { totalPS: 0, totalAmount: 0 },
      monthlyProduction: monthlyProduction[0] || { totalPS: 0, totalAmount: 0 },
      pendingPayments: pendingPayments[0]?.total || 0,
      recentProduction,
      recentPendingPayments
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
