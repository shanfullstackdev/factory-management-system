const mongoose = require("mongoose");

const productionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    ps: {
      type: Number,
      required: true
    },
    designName: {
      type: String
    },
    rate: {
      type: Number,
      required: true
    },
    total: {
      type: Number
    },
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"], // ✅ lowercase
      default: "pending"
    },
    submittedBy: {
      type: String,
      enum: ["employee", "admin"], // ✅ lowercase
      default: "employee"
    }
  },
  { timestamps: true }
);

// Auto-calculate total before saving
productionSchema.pre("save", function () {
  this.total = this.ps * this.rate;
});

module.exports = mongoose.model("Production", productionSchema);
