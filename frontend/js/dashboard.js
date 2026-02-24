const API = "http://localhost:5000/api";

/* CHECK AUTH */
if (!localStorage.getItem("admin")) {
  window.location.href = "admin.html";
}

/* LOGOUT */
function logout() {
  localStorage.removeItem("admin");
  window.location.href = "index.html";
}

/* =========================
   LOAD DASHBOARD DATA
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();

  // Refresh every 30 seconds
  setInterval(loadDashboardData, 30000);
});

async function loadDashboardData() {
  try {
    const res = await fetch(`${API}/dashboard`);
    const data = await res.json();

    // 1. Stats
    updateStat("totalEmployees", data.totalEmployees || 0);
    updateStat("todayPS", `${data.todayProduction?.totalPS || 0} PS`);
    updateStat("todayAmount", `₹${(data.todayProduction?.totalAmount || 0).toLocaleString("en-IN")}`);
    updateStat("monthPS", `${data.monthlyProduction?.totalPS || 0} PS`);
    updateStat("monthAmount", `₹${(data.monthlyProduction?.totalAmount || 0).toLocaleString("en-IN")}`);
    updateStat("pendingPaymentsAmount", `₹${(data.pendingPayments || 0).toLocaleString("en-IN")}`);

    // Helper for date
    const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });

    // 2. Recent Production
    const recentProd = document.getElementById("recentProduction");
    const emptyRecentProd = document.getElementById("emptyRecentProduction");

    if (!data.recentProduction || !data.recentProduction.length) {
      recentProd.innerHTML = "";
      emptyRecentProd.style.display = "block";
    } else {
      emptyRecentProd.style.display = "none";
      // Show up to at least 5 entries, or all if less than 5
      const entries = data.recentProduction.slice(0, 5);
      recentProd.innerHTML = entries.map(item => `
        <tr>
          <td style="padding: 16px;">${item.employee?.name || "Unknown"}</td>
          <td style="padding: 16px;">${formatDate(item.date)}</td>
          <td style="padding: 16px;">${item.ps}</td>
          <td style="padding: 16px;">₹${item.rate}</td>
          <td style="padding: 16px;"><strong>₹${item.total}</strong></td>
        </tr>
      `).join("");
    }

    // 3. Recent Pending Payments
    renderList("recentPendingPayments", data.recentPendingPayments, (item) => `
      <div class="list-item" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
        <div class="info">
          <strong style="text-transform: capitalize; display: block; margin-bottom: 4px;">${item.employeeId?.name || "Unknown"}</strong>
          <span style="color: #64748b; font-size: 12px;">${formatDate(item.date)}</span>
        </div>
        <div class="values">
          <span class="badge pending" style="background: #fef08a; color: #78350f; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Pending</span>
          <span class="amount" style="font-weight: 600; color: #1e293b; margin-left: 8px;">₹${item.amount}</span>
        </div>
      </div>
    `);

  } catch (err) {
    console.error("Failed to load dashboard:", err);
  }
}

function updateStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function renderList(id, items, templateFn) {
  const container = document.getElementById(id);
  if (!container) return;

  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">No recent activity</div>';
    return;
  }

  container.innerHTML = items.map(templateFn).join("");
}
