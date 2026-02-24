const API = "http://localhost:5000/api";

// Check if employee is logged in
const employeeId = localStorage.getItem("employeeId");
const employeeName = localStorage.getItem("employeeName");
const employeeRate = localStorage.getItem("employeeRate");

if (!employeeId) {
  location.href = "employee-login.html";
}

// Set welcome message
document.getElementById("welcomeText").textContent = `Welcome, ${employeeName || "Employee"}!`;

// Set default and max date to today
const dateInput = document.getElementById("date");
const today = new Date().toISOString().split("T")[0];
dateInput.value = today;
dateInput.max = today;

// Pre-fill rate if available
if (employeeRate) {
  document.getElementById("rate").value = employeeRate;
  updateTotal();
}

/* =========================
   REAL-TIME TOTAL CALCULATION
========================= */
document.getElementById("ps").addEventListener("input", updateTotal);
document.getElementById("rate").addEventListener("input", updateTotal);

function updateTotal() {
  const ps = Number(document.getElementById("ps").value) || 0;
  const rate = Number(document.getElementById("rate").value) || 0;
  const total = ps * rate;
  document.getElementById("totalDisplay").textContent = `₹ ${total.toLocaleString("en-IN")}`;
}

/* =========================
   FORM SUBMISSION
========================= */
document.getElementById("productionForm").addEventListener("submit", async e => {
  e.preventDefault();

  const btn = document.getElementById("submitBtn");
  btn.classList.add("loading");
  btn.innerHTML = '<span>Submitting...</span>';

  const payload = {
    employee: employeeId,
    ps: Number(document.getElementById("ps").value),
    rate: Number(document.getElementById("rate").value),
    date: document.getElementById("date").value,
    designName: document.getElementById("designName") ? document.getElementById("designName").value : ""
  };

  try {
    const res = await fetch(API + "/production/employee-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Submission failed", "error");
      return;
    }

    showToast("✅ Submitted! Waiting for admin approval.", "success");
    e.target.reset();
    document.getElementById("date").valueAsDate = new Date();
    if (employeeRate) document.getElementById("rate").value = employeeRate;
    updateTotal();

    // Reload history
    loadMyProductions();

  } catch (err) {
    console.error(err);
    showToast("Server error. Please try again.", "error");
  } finally {
    btn.classList.remove("loading");
    btn.innerHTML = `
      <span>Submit Production Request</span>
      <svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    `;
  }
});

/* =========================
   LOAD MY PRODUCTIONS
========================= */
async function loadMyProductions() {
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const res = await fetch(`${API}/production/my/${employeeId}`);
    const productions = await res.json();

    if (!productions.length) {
      historyList.innerHTML = '<div class="empty-state">No submissions yet</div>';
      document.getElementById("pendingCount").textContent = "0";
      document.getElementById("approvedCount").textContent = "0";
      document.getElementById("totalEarnings").textContent = "₹0";
      return;
    }

    // Calculate stats
    let pending = 0, approved = 0, totalEarnings = 0;

    productions.forEach(p => {
      const status = p.status.toLowerCase();
      if (status === "pending") pending++;
      if (status === "approved") {
        approved++;
        totalEarnings += p.total;
      }
    });

    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("approvedCount").textContent = approved;
    document.getElementById("totalEarnings").textContent = `₹${totalEarnings.toLocaleString("en-IN")}`;

    // Render list
    historyList.innerHTML = productions.map(p => {
      const status = p.status.toLowerCase();
      const date = new Date(p.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      return `
        <div class="history-item">
          <div class="top-row">
            <span class="date">${date}</span>
            <span style="font-size: 13px; color: #64748b; font-weight: 600;">${p.designName || '-'}</span>
            <span class="status ${status}">${status}</span>
          </div>
          <div class="details">
            <span class="ps-rate">${p.ps} pcs × ₹${p.rate}</span>
            <span class="amount">₹${p.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error(err);
    historyList.innerHTML = '<div class="empty-state">Failed to load history</div>';
  }
}

/* =========================
   TOAST NOTIFICATION
========================= */
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.removeItem("employeeId");
  localStorage.removeItem("employeeName");
  localStorage.removeItem("employeeRate");
  window.location.href = "index.html";
}

// Load history on page load
loadMyProductions();
loadMyPayments();

/* =========================
   LOAD MY PAYMENTS
========================= */
async function loadMyPayments() {
  const paymentList = document.getElementById("paymentList");
  paymentList.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const res = await fetch(`${API}/payments/my/${employeeId}`);
    const payments = await res.json();

    if (!payments.length) {
      paymentList.innerHTML = '<div class="empty-state">No payments yet</div>';
      document.getElementById("totalPaid").textContent = "₹0";
      return;
    }

    // Calculate total
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    document.getElementById("totalPaid").textContent = `₹${totalPaid.toLocaleString("en-IN")}`;

    // Render list
    paymentList.innerHTML = payments.map(p => {
      const date = new Date(p.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      return `
        <div class="history-item">
          <div class="top-row">
            <span class="date">${date}</span>
            <span class="status approved">PAID</span>
          </div>
          <div class="details">
            <span class="ps-rate">${p.notes || "Payment received"}</span>
            <span class="amount">₹${p.amount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error(err);
    paymentList.innerHTML = '<div class="empty-state">Failed to load payments</div>';
  }
}

/* =========================
   TAB SWITCHING
========================= */
function switchTab(tab) {
  const submissionsCard = document.getElementById("submissionsCard");
  const paymentsCard = document.getElementById("paymentsCard");
  const navSub = document.getElementById("nav-submissions");
  const navPay = document.getElementById("nav-payments");

  if (tab === 'submissions') {
    submissionsCard.classList.remove("d-none");
    paymentsCard.classList.add("d-none");

    navSub.classList.add("active");
    navPay.classList.remove("active");
  } else {
    submissionsCard.classList.add("d-none");
    paymentsCard.classList.remove("d-none");

    navSub.classList.remove("active");
    navPay.classList.add("active");
  }
}
