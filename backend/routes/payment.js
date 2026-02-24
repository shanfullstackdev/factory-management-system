const express = require("express");
const router = express.Router();
const Payment = require("../models/payments");

/* =========================
   CREATE PAYMENT
========================= */
router.post("/", async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET ALL PAYMENTS
========================= */
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("employeeId", "name") // ✅ FIXED
      .sort({ date: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* =========================
   DELETE PAYMENT
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ message: "Payment deleted" });
  } catch (err) {
    console.error("DELETE PAYMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET MY PAYMENTS (Employee)
========================= */
router.get("/my/:employeeId", async (req, res) => {
  try {
    const data = await Payment.find({ employeeId: req.params.employeeId })
      .sort({ date: -1 });

    res.json(data);
  } catch (err) {
    console.error("GET MY PAYMENTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET SINGLE PAYMENT
   GET /api/payments/:id
========================= */
router.get("/:id", async (req, res) => {
  try {
    console.log("GET /api/payments/:id called for", req.params.id);
    const p = await Payment.findById(req.params.id).populate("employeeId", "name");
    if (!p) return res.status(404).json({ message: "Payment not found" });
    res.json(p);
  } catch (err) {
    console.error("GET PAYMENT BY ID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   UPDATE PAYMENT
   PUT /api/payments/:id
========================= */
router.put("/:id", async (req, res) => {
  try {
    const { employeeId, amount, date, status, notes, periodStart, periodEnd } = req.body;

    const update = {};
    if (employeeId) update.employeeId = employeeId;
    if (typeof amount !== 'undefined') update.amount = Number(amount);
    if (date) update.date = new Date(date);
    if (status) update.status = status;
    if (notes) update.notes = notes;
    if (periodStart) update.periodStart = periodStart;
    if (periodEnd) update.periodEnd = periodEnd;

    const updated = await Payment.findByIdAndUpdate(req.params.id, update, { new: true }).populate("employeeId", "name");
    if (!updated) return res.status(404).json({ message: "Payment not found" });
    res.json({ message: "Payment updated", payment: updated });
  } catch (err) {
    console.error("UPDATE PAYMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   DASHBOARD SUMMARY
========================= */
router.get("/summary", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const payments = await Payment.find();

    let totalPaid = 0;
    let totalPending = 0;

    payments.forEach(p => {
      if (p.status === "Paid") totalPaid += p.amount;
      else totalPending += p.amount;
    });

    const todayPending = await Payment.aggregate([
      { $match: { status: "Pending", date: { $gte: today } } },
      { $group: { _id: null, amount: { $sum: "$amount" } } }
    ]);

    const monthlyPaid = await Payment.aggregate([
      { $match: { status: "Paid", date: { $gte: monthStart } } },
      { $group: { _id: null, amount: { $sum: "$amount" } } }
    ]);

    res.json({
      totalPaid,
      totalPending,
      todayPending: todayPending[0]?.amount || 0,
      monthlyPaid: monthlyPaid[0]?.amount || 0,
      totalRecords: payments.length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
