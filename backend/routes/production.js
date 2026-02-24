const express = require("express");
const router = express.Router();
const Production = require("../models/production");

/* =================================================
   EMPLOYEE SUBMIT → ALWAYS PENDING
   POST /api/production/employee-submit
================================================= */
router.post("/employee-submit", async (req, res) => {
  try {
    const { employee, ps, rate, date, designName } = req.body;

    if (!employee || !ps || !rate) {
      return res.status(400).json({ message: "All fields required" });
    }

    const production = new Production({
      employee,
      ps: Number(ps),
      rate: Number(rate),
      designName,
      total: Number(ps) * Number(rate),
      date: date ? new Date(date) : new Date(),
      status: "pending",
      submittedBy: "employee"
    });

    await production.save();

    res.status(201).json({
      message: "Production submitted for admin approval",
      production
    });
  } catch (err) {
    console.error("EMPLOYEE SUBMIT ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


/* =================================================
   ADMIN ADD → AUTO APPROVED
   POST /api/production
================================================= */
router.post("/", async (req, res) => {
  try {
    const { employee, ps, rate, date, designName } = req.body;

    if (!employee || !ps || !rate) {
      return res.status(400).json({ message: "All fields required" });
    }

    const production = await Production.create({
      employee,
      ps: Number(ps),
      rate: Number(rate),
      designName,
      total: Number(ps) * Number(rate),
      date: date ? new Date(date) : new Date(),
      status: "approved",     // ✅ auto-approved
      submittedBy: "admin"
    });

    res.status(201).json({
      message: "Production added successfully",
      production
    });
  } catch (err) {
    console.error("ADMIN ADD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   GET APPROVED PRODUCTIONS (ADMIN PRODUCTION PAGE)
   GET /api/production/approved
================================================= */
router.get("/approved", async (req, res) => {
  try {
    const data = await Production.find({ status: "approved" })
      .populate("employee", "name")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    console.error("GET APPROVED ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   GET PENDING PRODUCTIONS (ADMIN PENDING PAGE)
   GET /api/production/pending
================================================= */
router.get("/pending", async (req, res) => {
  try {
    const data = await Production.find({ status: "pending" })
      .populate("employee", "name")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    console.error("GET PENDING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   GET PRODUCTIONS BY EMPLOYEE (EMPLOYEE DASHBOARD)
   GET /api/production/my/:employeeId
================================================= */
router.get("/my/:employeeId", async (req, res) => {
  try {
    const data = await Production.find({ employee: req.params.employeeId })
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    console.error("GET MY PRODUCTIONS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   GET SINGLE PRODUCTION
   GET /api/production/:id
================================================= */
router.get("/:id", async (req, res) => {
  try {
    console.log("GET /api/production/:id called for", req.params.id);
    const prod = await Production.findById(req.params.id).populate("employee", "name");

    if (!prod) return res.status(404).json({ message: "Not found" });

    res.json(prod);
  } catch (err) {
    console.error("GET BY ID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   UPDATE PRODUCTION
   PUT /api/production/:id
================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { employee, ps, rate, date, designName } = req.body;
    console.log("PUT /api/production/:id called", { id: req.params.id, body: req.body });

    const prod = await Production.findById(req.params.id);
    if (!prod) return res.status(404).json({ message: "Production not found" });

    if (employee) prod.employee = employee;
    if (typeof ps !== 'undefined') prod.ps = Number(ps);
    if (typeof rate !== 'undefined') prod.rate = Number(rate);
    if (typeof designName !== 'undefined') prod.designName = designName;
    if (date) prod.date = new Date(date);

    // Total will be recalculated in the pre-save hook of the model
    await prod.save();

    // Populate for response
    await prod.populate("employee", "name");

    console.log("Production updated successfully:", prod);
    res.json({ message: "Production updated [V2]", prod });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   APPROVE → MOVE TO APPROVED
   PUT /api/production/:id/approve
================================================= */
router.put("/:id/approve", async (req, res) => {
  try {
    const prod = await Production.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!prod) {
      return res.status(404).json({ message: "Production not found" });
    }

    res.json({ message: "Production approved", prod });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   REJECT → DELETE ENTRY
   DELETE /api/production/:id/reject
================================================= */
router.delete("/:id/reject", async (req, res) => {
  try {
    const prod = await Production.findByIdAndDelete(req.params.id);

    if (!prod) {
      return res.status(404).json({ message: "Production not found" });
    }

    res.json({ message: "Production rejected and deleted" });
  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   DELETE (generic) → DELETE ENTRY
   DELETE /api/production/:id
   Frontend calls this when user clicks Delete on admin page
================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const prod = await Production.findByIdAndDelete(req.params.id);

    if (!prod) {
      return res.status(404).json({ message: "Production not found" });
    }

    res.json({ message: "Production deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
