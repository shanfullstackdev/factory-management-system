const express = require("express");
const Employee = require("../models/employee");

const router = express.Router();

// ADD employee
router.post("/", async (req, res) => {
  try {
    const { name, mobile, address, rate } = req.body;

    const employee = new Employee({
      name,
      mobile,
      address,
      rate
    });

    await employee.save();
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all employees
router.get("/", async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
});

// DELETE employee
router.delete("/:id", async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.json({ message: "Employee deleted" });
});

module.exports = router;
