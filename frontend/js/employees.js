const API = "http://localhost:5000/api";

// Prevent digits in the name input as the user types
const _nameInput = document.getElementById("name");
if (_nameInput) {
  _nameInput.addEventListener("input", () => {
    const cleaned = _nameInput.value.replace(/[0-9]/g, "");
    if (_nameInput.value !== cleaned) _nameInput.value = cleaned;
  });
}

// Allow only digits in mobile input as the user types and enforce maxlength
const _mobileInput = document.getElementById("mobile");
if (_mobileInput) {
  _mobileInput.maxLength = 10;
  _mobileInput.addEventListener("input", () => {
    const cleaned = _mobileInput.value.replace(/\D/g, "");
    _mobileInput.value = cleaned.slice(0, 10);
  });
}

// Address input: allow numbers and trim leading whitespace
const _addressInput = document.getElementById("address");
if (_addressInput) {
  _addressInput.addEventListener("input", () => {
    _addressInput.value = _addressInput.value.replace(/^[ \t\n\r]+/, '');
  });
}

// Inline form message element (shown inside modal)
const _formMsg = document.getElementById('employeeFormMsg');
function showFormMessage(msg, type = 'error') {
  if (!_formMsg) return alert(msg);
  _formMsg.style.display = 'block';
  _formMsg.innerText = msg;
  _formMsg.style.color = type === 'error' ? '#dc2626' : '#16a34a';
}
function clearFormMessage() {
  if (!_formMsg) return;
  _formMsg.style.display = 'none';
  _formMsg.innerText = '';
}

function openModal() {
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function logout() {
  localStorage.removeItem("admin");
  window.location.href = "index.html";
}

// ADD EMPLOYEE
function addEmployee() {
  const nameEl = document.getElementById("name");
  const mobileEl = document.getElementById("mobile");
  const addressEl = document.getElementById("address");

  const name = nameEl ? nameEl.value.trim() : "";
  const mobile = mobileEl ? mobileEl.value.trim() : "";
  const address = addressEl ? addressEl.value.trim() : "";

  // Clear inline message when user starts typing
  if (nameEl) nameEl.addEventListener('input', clearFormMessage, { once: true });
  if (mobileEl) mobileEl.addEventListener('input', clearFormMessage, { once: true });
  if (addressEl) addressEl.addEventListener('input', clearFormMessage, { once: true });

  clearFormMessage();

  // Validation: name must be non-empty and contain no digits
  if (!name) {
    showFormMessage("Please enter the employee's full name.");
    return;
  }

  if (/\d/.test(name)) {
    showFormMessage("Name cannot contain numbers. Please use letters only.");
    return;
  }

  // Validation: mobile must be non-empty and be exactly 10 digits
  if (!mobile) {
    showFormMessage("Please enter the employee's mobile number.");
    return;
  }

  if (!/^\d{10}$/.test(mobile)) {
    showFormMessage("Mobile number must be exactly 10 digits.");
    return;
  }

  // First digit must not be 0-5
  if (/^[0-5]/.test(mobile)) {
    showFormMessage("Not valid. Please enter a valid no.");
    return;
  }


  // Validation: address should be non-empty
  if (!address) {
    showFormMessage("Please enter the employee's address.");
    return;
  }

  // Title-case the name and address
  const titleCaseName = name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const titleCaseAddress = address
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  fetch(API + "/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: titleCaseName,
      mobile,
      address: titleCaseAddress,
      rate: 0
    })
  })
    .then(res => {
      if (!res.ok) return res.text().then(t => Promise.reject(t || res.status));
      return res.json();
    })
    .then(() => {
      closeModal();
      loadEmployees();
    })
    .catch(err => {
      console.error('Add employee failed:', err);
      showFormMessage('Failed to add employee. Please try again.');
    });
}

// LOAD EMPLOYEES
function loadEmployees() {
  fetch(API + "/employees")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("employeeTable");
      const emptyBox = document.getElementById("emptyBox");

      table.innerHTML = `
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Address</th>
            <th>Action</th>
          </tr>
        `;

      if (data.length === 0) {
        emptyBox.style.display = "block";
        return;
      }

      emptyBox.style.display = "none";

      data.forEach(emp => {
        table.innerHTML += `
          <tr>
            <td>${emp.name}</td>
            <td>${emp.mobile}</td>
            <td>${emp.address || '-'}</td>
            <td>
              <button class="btn-danger" onclick="initiateDelete('${emp._id}', '${(emp.name || '').replace(/'/g, "\\'")}')">Delete</button>
            </td>
          </tr>
        `;
      });
    });
}

// DELETE LOGIC
// Simple delete flow: ask for a browser confirmation warning, then delete
function initiateDelete(id, name) {
  const confirmMsg = `Warning: delete employee "${name}"? click on ok button to permanently delete.`;
  if (!confirm(confirmMsg)) return;

  fetch(API + "/employees/" + id, { method: "DELETE" })
    .then(res => {
      if (!res.ok) throw new Error('Delete failed');
      loadEmployees();
    })
    .catch(err => {
      console.error('Failed to delete employee', err);
      showFormMessage('Failed to delete employee');
    });
}

loadEmployees();

// Expose functions to window for inline onclick handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.addEmployee = addEmployee;
window.initiateDelete = initiateDelete;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.logout = logout;
