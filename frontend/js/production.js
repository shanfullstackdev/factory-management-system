const API = "http://localhost:5000/api";

const modal = document.getElementById("productionModal");
let editingId = null;
const employeeSelect = document.getElementById("employeeSelect");
const psInput = document.getElementById("ps");
const rateInput = document.getElementById("rate");
const dateInput = document.getElementById("date");
const designNameInput = document.getElementById("designName");
const totalAmount = document.getElementById("totalAmount");

const emptyBox = document.querySelector(".empty-box");
const accordionList = document.getElementById("accordionList");

/* LOGOUT */
function logout() {
  localStorage.removeItem("admin");
  window.location.href = "index.html";
}

/* MODAL */
function openModal() {
  editingId = null;
  // reset modal title / button
  const hdr = document.querySelector("#productionModal .modal-header h4");
  const saveBtn = document.querySelector("#productionModal .modal-actions .btn-primary");
  if (hdr) hdr.innerText = "Add Production Entry";
  if (saveBtn) saveBtn.innerText = "Save Entry";
  modal.style.display = "flex";
}
function closeModal() {
  modal.style.display = "none";
  employeeSelect.value = "";
  psInput.value = 0;
  rateInput.value = 0;
  dateInput.value = "";
  if (designNameInput) designNameInput.value = "";
  totalAmount.innerText = 0;
  editingId = null;
}

async function openEditModal(id) {
  try {
    const res = await fetch(API + "/production/" + id);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("openEditModal fetch failed:", res.status, txt);
      return alert("Failed to load record for editing (status: " + res.status + ")");
    }

    const data = await res.json();

    if (!data) return alert("Record not found");

    // populate fields
    const empId = data.employee?._id || data.employee || "";
    // if employee option not present (employees may not have loaded yet), add it
    if (empId && !employeeSelect.querySelector(`option[value="${empId}"]`)) {
      const empName = data.employee?.name || "Employee";
      const opt = document.createElement("option");
      opt.value = empId;
      opt.dataset.rate = data.rate || "0";
      opt.textContent = empName;
      employeeSelect.appendChild(opt);
    }
    employeeSelect.value = empId;
    psInput.value = data.ps || 0;
    rateInput.value = data.rate || 0;
    if (dateInput && data.date) {
      const d = new Date(data.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
    const designNameField = document.getElementById("designName");
    if (designNameField) {
      designNameField.value = data.designName || "";
      console.log("Populated designNameField with:", data.designName);
    }
    calculate();

    // set editing state
    editingId = id;
    const hdr = document.querySelector("#productionModal .modal-header h4");
    const saveBtn = document.querySelector("#productionModal .modal-actions .btn-primary");
    if (hdr) hdr.innerText = "Edit Production Entry";
    if (saveBtn) saveBtn.innerText = "Update Entry";

    modal.style.display = "flex";
  } catch (err) {
    console.error("Open edit failed", err);
    alert("Failed to load record for editing");
  }
}

/* LOAD EMPLOYEES */
fetch(API + "/employees")
  .then(res => res.json())
  .then(data => {
    employeeSelect.innerHTML = `<option value="">Select Employee</option>`;
    data.forEach(emp => {
      employeeSelect.innerHTML += `
        <option value="${emp._id}" data-rate="${emp.rate}">
          ${emp.name}
        </option>`;
    });
  });

/* AUTO CALCULATE */
function calculate() {
  const ps = Number(psInput.value);
  const rate = Number(rateInput.value);
  totalAmount.innerText = ps * rate;
}
// Set max date to today to prevent selecting future dates
if (dateInput) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.max = `${yyyy}-${mm}-${dd}`;
}
psInput.addEventListener("input", calculate);
rateInput.addEventListener("input", calculate);
employeeSelect.addEventListener("change", e => {
  rateInput.value = e.target.selectedOptions[0]?.dataset.rate || 0;
  calculate();
});

/* SAVE */
function saveProduction() {
  if (!employeeSelect.value) {
    alert("Select employee");
    return;
  }

  // Validate date: required and not in the future
  if (dateInput) {
    if (!dateInput.value) {
      alert("Please select a date.");
      return;
    }
    const selected = new Date(dateInput.value);
    const today = new Date();
    // clear time portion for comparison
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (selected > today) {
      alert("Future dates are not allowed.");
      return;
    }
  }

  const designNameField = document.getElementById("designName");
  const payload = {
    employee: employeeSelect.value,
    date: dateInput ? dateInput.value : undefined,
    ps: Number(psInput.value),
    rate: Number(rateInput.value),
    designName: designNameField ? designNameField.value : ""
  };

  console.log("About to save payload:", JSON.stringify(payload, null, 2));

  console.log("Saving Production Payload:", payload);

  const url = editingId ? API + "/production/" + editingId : API + "/production";
  const method = editingId ? "PUT" : "POST";

  console.log(`Sending ${method} request to ${url} with payload:`, payload);

  fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(async res => {
      const respData = await res.json();
      console.log("Save Response Status:", res.status, respData);

      if (!res.ok) {
        throw new Error(respData.message || "Failed to save production");
      }

      alert(respData.message || "Saved successfully!");
      closeModal();
      loadProductions();
    })
    .catch(err => {
      console.error("Error saving production:", err);
      alert("Error saving production: " + err.message);
    });
}

/* DELETE */
function deleteProduction(id) {
  if (!confirm("Delete this entry?")) return;
  fetch(API + "/production/" + id, { method: "DELETE" })
    .then(() => loadProductions());
}

/* LOAD GROUPED ACCORDION */
function loadProductions() {
  fetch(API + "/production/approved")
    .then(res => res.json())
    .then(data => {
      accordionList.innerHTML = "";

      if (!data.length) {
        emptyBox.style.display = "block";
        accordionList.style.display = "none";
        return;
      }

      emptyBox.style.display = "none";
      accordionList.style.display = "flex";

      // GROUP BY EMPLOYEE
      const grouped = {};
      data.forEach(p => {
        const empId = p.employee?._id || "unknown";
        if (!grouped[empId]) {
          grouped[empId] = {
            name: p.employee?.name || "Unknown Employee",
            entries: [],
            totalPS: 0,
            totalAmount: 0
          };
        }
        grouped[empId].entries.push(p);
        grouped[empId].totalPS += (p.ps || 0);
        grouped[empId].totalAmount += (p.total || 0);
      });

      // RENDER ACCORDIONS
      Object.keys(grouped).forEach(empId => {
        const group = grouped[empId];

        // Sort entries by date desc
        group.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        const item = document.createElement("div");
        item.className = "accordion-item";
        item.id = `accordion-${empId}`;

        item.innerHTML = `
          <div class="accordion-header" onclick="toggleAccordion('${empId}')">
            <div class="emp-info">
              <span class="emp-name">${group.name}</span>
              <div class="emp-stats">
                <span><i class="bi bi-layers"></i> ${group.totalPS} PS</span>
                <span>₹ ${group.totalAmount.toLocaleString()}</span>
                <span class="badge" style="background:#e2e8f0; color:#475569; padding:2px 8px; border-radius:10px; font-size:11px;">${group.entries.length} Entries</span>
              </div>
            </div>
            <div class="btn-toggle">
              <i class="bi bi-chevron-down"></i>
            </div>
          </div>
          <div class="accordion-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Design</th>
                  <th>PS</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${group.entries.map(p => `
                  <tr>
                    <td>${new Date(p.date).toLocaleDateString()}</td>
                    <td style="color:#64748b;">${p.designName || '-'}</td>
                    <td>${p.ps}</td>
                    <td>₹${p.rate}</td>
                    <td><strong>₹${p.total}</strong></td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn-secondary" style="padding:6px 12px; font-size:12px;" onclick="openEditModal('${p._id}')">Edit</button>
                        <button class="btn-danger" style="padding:6px 12px; font-size:12px;" onclick="deleteProduction('${p._id}')">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        accordionList.appendChild(item);
      });
    });
}

function toggleAccordion(empId) {
  const item = document.getElementById(`accordion-${empId}`);
  if (!item) return;

  const isActive = item.classList.contains("active");

  if (isActive) {
    item.classList.remove("active");
  } else {
    item.classList.add("active");
  }
}

// Global functions for inline handlers
window.toggleAccordion = toggleAccordion;
window.openEditModal = openEditModal;
window.deleteProduction = deleteProduction;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveProduction = saveProduction;
window.logout = logout;

loadProductions();
