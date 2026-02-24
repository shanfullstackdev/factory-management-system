const API = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  loadPendingProductions();
});

function logout() {
  localStorage.removeItem("admin");
  window.location.href = "index.html";
}

async function loadPendingProductions() {
  try {
    const res = await fetch(`${API}/production/pending`);
    const pending = await res.json();

    const table = document.getElementById("pendingTable");
    table.innerHTML = "";

    if (!pending.length) {
      table.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;">
            No pending production requests
          </td>
        </tr>`;
      return;
    }

    pending.forEach(p => {
      table.innerHTML += `
        <tr>
          <td>${p.employee?.name || "N/A"}</td>
          <td style="color:#64748b;">${p.designName || '-'}</td>
          <td>${new Date(p.date).toLocaleDateString()}</td>
          <td>${p.ps}</td>
          <td>₹${p.rate}</td>
          <td><strong>₹${p.total}</strong></td>
          <td>
            <button class="btn-success" onclick="approve('${p._id}')">Approve</button>
            <button class="btn-danger" onclick="reject('${p._id}')">Reject</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("❌ Failed to load pending productions:", err);
  }
}

/* =========================
   APPROVE
========================= */
async function approve(id) {
  if (!confirm("Approve this production request?")) return;

  await fetch(`${API}/production/${id}/approve`, { method: "PUT" });
  loadPendingProductions();
  if (window.updatePendingBadge) window.updatePendingBadge();
}

/* =========================
   REJECT
========================= */
async function reject(id) {
  if (!confirm("Reject this production request?")) return;

  await fetch(`${API}/production/${id}/reject`, { method: "DELETE" });
  loadPendingProductions();
  if (window.updatePendingBadge) window.updatePendingBadge();
}
