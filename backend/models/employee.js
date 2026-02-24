const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String
  },
  rate: {
    type: Number,
    required: false,
    default: 0
  }
});

module.exports = mongoose.model("Employee", employeeSchema);
