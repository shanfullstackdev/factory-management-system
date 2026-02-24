/* =========================
   CONFIG
========================= */
const API = "http://localhost:5000/api";

/* =========================
   ELEMENTS
========================= */
const employeeSelect = document.getElementById("employee");
const paymentTable = document.getElementById("paymentTable");
let editingPaymentId = null;
let paymentsCache = {};

const totalPaidEl = document.getElementById("totalPaid");
const totalPendingEl = document.getElementById("totalPending");
const totalRecordsEl = document.getElementById("totalRecords");

/* Form inputs */
const amountInput = document.getElementById("amount");
const paymentDateInput = document.getElementById("paymentDate");
const statusInput = document.getElementById("status");
const periodStartInput = document.getElementById("periodStart");
const periodEndInput = document.getElementById("periodEnd");
const notesInput = document.getElementById("notes");

// Prevent selecting future dates
if (paymentDateInput || periodStartInput || periodEndInput) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const maxDate = `${yyyy}-${mm}-${dd}`;
  if (paymentDateInput) paymentDateInput.max = maxDate;
  if (periodStartInput) periodStartInput.max = maxDate;
  if (periodEndInput) periodEndInput.max = maxDate;
}

/* =========================
   PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadEmployees();
  loadPayments();

  // Wire up inline form toggles
  document.getElementById("openPaymentForm")?.addEventListener("click", openForm);
  document.getElementById("cancelPaymentForm")?.addEventListener("click", closeForm);
});

// expose functions for inline onclick handlers
window.openEditPayment = openEditPayment;
window.deletePayment = deletePayment;
window.openForm = openForm;
window.closeForm = closeForm;
window.savePayment = savePayment;

/* =========================
   MODAL CONTROLS
========================= */
const paymentModal = document.getElementById("paymentModal");

function openForm() {
  paymentModal.style.display = "flex";
  paymentDateInput.valueAsDate = new Date();
  statusInput.value = "Pending";
}

function closeForm() {
  paymentModal.style.display = "none";
  employeeSelect.value = "";
  amountInput.value = "";
  periodStartInput.value = "";
  periodEndInput.value = "";
  notesInput.value = "";
  editingPaymentId = null;
}

async function openEditPayment(id) {
  try {
    // prefer local cache (loaded in loadPayments) to avoid an extra fetch
    let p = paymentsCache[id];
    if (!p) {
      const res = await fetch(`${API}/payments/${id}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("openEditPayment fetch failed:", res.status, txt);
        return alert("Failed to load payment for editing (status: " + res.status + ")");
      }
      p = await res.json();
    }

    // ensure employee option exists
    const empId = p.employeeId?._id || p.employeeId;
    if (empId && !employeeSelect.querySelector(`option[value="${empId}"]`)) {
      const opt = document.createElement('option');
      opt.value = empId;
      opt.textContent = p.employeeId?.name || 'Employee';
      employeeSelect.appendChild(opt);
    }

    employeeSelect.value = empId || "";
    amountInput.value = p.amount || "";
    if (paymentDateInput && p.date) paymentDateInput.value = new Date(p.date).toISOString().slice(0, 10);
    statusInput.value = p.status || 'Pending';
    periodStartInput.value = p.periodStart ? new Date(p.periodStart).toISOString().slice(0, 10) : '';
    periodEndInput.value = p.periodEnd ? new Date(p.periodEnd).toISOString().slice(0, 10) : '';
    notesInput.value = p.notes || '';

    editingPaymentId = id;
    paymentModal.style.display = 'flex';
  } catch (err) {
    console.error('Open edit payment failed', err);
    alert('Failed to load payment for editing');
  }
}

/* =========================
   SEARCH FILTER
========================= */
function filterPayments() {
  const input = document.getElementById("searchInput");
  const filter = input.value.toLowerCase();
  const table = document.getElementById("paymentTable");
  const tr = table.getElementsByTagName("tr");

  for (let i = 0; i < tr.length; i++) {
    const tdName = tr[i].getElementsByTagName("td")[0];
    const tdStatus = tr[i].getElementsByTagName("td")[4];

    if (tdName || tdStatus) {
      const txtName = tdName.textContent || tdName.innerText;
      const txtStatus = tdStatus.textContent || tdStatus.innerText;

      if (
        txtName.toLowerCase().indexOf(filter) > -1 ||
        txtStatus.toLowerCase().indexOf(filter) > -1
      ) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

/* =========================
   LOAD EMPLOYEES
========================= */
async function loadEmployees() {
  try {
    const res = await fetch(`${API}/employees`);
    const employees = await res.json();

    employeeSelect.innerHTML = `<option value="">Select Employee</option>`;

    employees.forEach(emp => {
      employeeSelect.innerHTML += `
        <option value="${emp._id}">${emp.name}</option>
      `;
    });
  } catch (err) {
    console.error("Employee load failed", err);
  }
}

/* =========================
   SAVE PAYMENT
========================= */
async function savePayment() {
  if (!employeeSelect.value || !amountInput.value) {
    alert("Employee and Amount are required");
    return;
  }

  // Validate dates: not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (paymentDateInput.value) {
    const d = new Date(paymentDateInput.value);
    d.setHours(0, 0, 0, 0);
    if (d > today) { alert("Payment date cannot be in the future"); return; }
  }
  if (periodStartInput.value) {
    const d = new Date(periodStartInput.value);
    d.setHours(0, 0, 0, 0);
    if (d > today) { alert("Period start cannot be in the future"); return; }
  }
  if (periodEndInput.value) {
    const d = new Date(periodEndInput.value);
    d.setHours(0, 0, 0, 0);
    if (d > today) { alert("Period end cannot be in the future"); return; }
  }

  const payload = {
    employeeId: employeeSelect.value,
    amount: Number(amountInput.value),
    date: paymentDateInput.value,
    status: statusInput.value,
    periodStart: periodStartInput.value || null,
    periodEnd: periodEndInput.value || null,
    notes: notesInput.value
  };

  try {
    const url = editingPaymentId ? `${API}/payments/${editingPaymentId}` : `${API}/payments`;
    const method = editingPaymentId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    closeForm();
    loadPayments();
  } catch (err) {
    console.error("Payment save failed", err);
  }
}

/* =========================
   LOAD PAYMENTS TABLE + SUMMARY
========================= */
async function loadPayments() {
  try {
    const res = await fetch(`${API}/payments`);
    const payments = await res.json();

    // populate local cache for quick editing without a round-trip
    paymentsCache = {};
    payments.forEach(p => paymentsCache[p._id] = p);

    paymentTable.innerHTML = "";

    if (!payments.length) {
      paymentTable.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:20px;">
            No payments found
          </td>
        </tr>
      `;

      totalPaidEl.innerText = "₹0";
      totalPendingEl.innerText = "₹0";
      totalRecordsEl.innerText = "0";
      return;
    }

    let totalPaid = 0;
    let totalPending = 0;

    payments.forEach(p => {
      const amt = Number(p.amount) || 0;

      if ((p.status || "").toLowerCase() === "paid") totalPaid += amt;
      else totalPending += amt;

      paymentTable.innerHTML += `
        <tr>
          <td>${p.employeeId?.name || "N/A"}</td>
          <td>${formatDate(p.date)}</td>
          <td>${formatPeriod(p.periodStart, p.periodEnd)}</td>
          <td>₹${amt}</td>
          <td>
            <span class="status-badge ${(p.status || "").toLowerCase() === "paid" ? "paid" : "pending"
        }">
              ${p.status}
            </span>
          </td>
          <td>${p.notes || "-"}</td>
            <td>
            <button class="btn-secondary" onclick="openEditPayment('${p._id}')">Edit</button>
            <button class="btn-danger" onclick="deletePayment('${p._id}')">Delete</button>
          </td>
        </tr>
      `;
    });

    totalPaidEl.innerText = `₹${totalPaid}`;
    totalPendingEl.innerText = `₹${totalPending}`;
    totalRecordsEl.innerText = payments.length;

  } catch (err) {
    console.error("Payments load failed", err);
  }
}

/* =========================
   HELPERS
========================= */
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN");
}

function formatPeriod(start, end) {
  if (!start && !end) return "-";

  const s = start ? formatDate(start) : "-";
  const e = end ? formatDate(end) : "-";

  return `${s} → ${e}`;
}

/* =========================
   AUTH
========================= */
function logout() {
  localStorage.removeItem("admin");
  window.location.href = "index.html";
}

/* =========================
   DELETE
========================= */
window.savePayment = savePayment;

async function deletePayment(id) {
  if (!confirm("Are you sure you want to delete this payment?")) return;

  try {
    await fetch(`${API}/payments/${id}`, {
      method: "DELETE"
    });

    loadPayments();
  } catch (err) {
    alert("Failed to delete payment");
  }
}

window.logout = logout;
