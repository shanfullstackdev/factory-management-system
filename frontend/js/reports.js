const API = "http://localhost:5000/api";

const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const employeeFilter = document.getElementById("employeeFilter");
const reportTable = document.getElementById("reportTable");
const noData = document.getElementById("noData");

let growthChart = null; // Global reference for the chart
let allApprovedData = []; // Store data globally for toggling

// Set max attribute for both date inputs to today to prevent future selection
function setMaxDatesToToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const iso = `${yyyy}-${mm}-${dd}`;
  if (startDate) startDate.max = iso;
  if (endDate) endDate.max = iso;
}

setMaxDatesToToday();

// Load list of employees into filter dropdown
fetch(API + "/employees")
  .then(res => res.json())
  .then(data => {
    if (!employeeFilter) return;
    employeeFilter.innerHTML = `<option value="">All Employees</option>`;
    data.forEach(emp => {
      employeeFilter.innerHTML += `<option value="${emp._id}">${emp.name}</option>`;
    });
  });

// Validate date inputs and load report data
function loadReports() {
  const start = startDate ? startDate.value : "";
  const end = endDate ? endDate.value : "";
  const employee = employeeFilter ? employeeFilter.value : "";

  // If either date is provided, validate not in future
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start) {
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    if (s > today) { alert('Start date cannot be in the future.'); return; }
  }
  if (end) {
    const e = new Date(end);
    e.setHours(0, 0, 0, 0);
    if (e > today) { alert('End date cannot be in the future.'); return; }
  }
  if (start && end) {
    const s = new Date(start); s.setHours(0, 0, 0, 0);
    const e = new Date(end); e.setHours(0, 0, 0, 0);
    if (s > e) { alert('Start date cannot be after end date.'); return; }
  }

  // Fetch approved productions and filter client-side
  fetch(API + "/production/approved")
    .then(res => res.json())
    .then(all => {
      allApprovedData = all || [];
      let entries = [...allApprovedData];

      // Filter for the table and stats
      if (employee) {
        entries = entries.filter(en => String(en.employee?._id || en.employee) === String(employee));
      }

      if (start) {
        const s = new Date(start); s.setHours(0, 0, 0, 0);
        entries = entries.filter(en => {
          const d = new Date(en.date); d.setHours(0, 0, 0, 0);
          return d >= s;
        });
      }
      if (end) {
        const e = new Date(end); e.setHours(0, 0, 0, 0);
        entries = entries.filter(en => {
          const d = new Date(en.date); d.setHours(0, 0, 0, 0);
          return d <= e;
        });
      }

      // Compute totals
      const totalPS = entries.reduce((sum, r) => sum + (r.ps || 0), 0);
      const totalAmountVal = entries.reduce((sum, r) => sum + (r.total || 0), 0);

      document.getElementById('totalPS').innerText = totalPS + ' PS';
      document.getElementById('totalAmount').innerText = totalAmountVal.toLocaleString("en-IN");
      document.getElementById('totalEntries').innerText = entries.length || 0;

      reportTable.innerHTML = '';
      if (!entries.length) {
        noData.style.display = 'block';
        return;
      }
      noData.style.display = 'none';

      // Ensure entries are sorted by date descending
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));

      // LIMIT TO TOP 5 ENTRIES
      const recentEntries = entries.slice(0, 5);

      recentEntries.forEach(r => {
        reportTable.innerHTML += `
          <tr>
            <td>${r.employee?.name || 'N/A'}</td>
            <td style="color:#64748b;">${r.designName || '-'}</td>
            <td>${new Date(r.date).toLocaleDateString()}</td>
            <td>${r.ps}</td>
            <td>₹${r.rate}</td>
            <td>₹${r.total}</td>
          </tr>`;
      });

      // If graph is already visible, update it
      const container = document.getElementById("graphContainer");
      if (container && container.style.display !== "none") {
        updateGrowthChart(allApprovedData);
      }
    })
    .catch((err) => {
      console.error(err);
      alert('Error loading reports');
    });
}

/**
 * TOGGLE GRAPH VISIBILITY
 */
function toggleGraph() {
  const container = document.getElementById("graphContainer");
  const btn = document.getElementById("toggleBtn");

  if (container.style.display === "none") {
    container.style.display = "block";
    btn.innerHTML = `<i class="bi bi-x-circle"></i> Close Graph Report`;
    // Scroll to the graph container with smooth animation
    container.scrollIntoView({ behavior: 'smooth' });
    // Render/Update the chart when shown
    updateGrowthChart(allApprovedData);
  } else {
    container.style.display = "none";
    btn.innerHTML = `<i class="bi bi-bar-chart"></i> Open Graph Report`;
  }
}
window.toggleGraph = toggleGraph;

/**
 * AGGREGATE MONTHLY GROWTH AND UPDATE CHART
 */
function updateGrowthChart(allApproved) {
  const canvas = document.getElementById('growthChart');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  const monthlyData = {};
  allApproved.forEach(entry => {
    const d = new Date(entry.date);
    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[sortKey]) {
      monthlyData[sortKey] = { label: key, totalPS: 0 };
    }
    monthlyData[sortKey].totalPS += entry.ps || 0;
  });

  const sortedKeys = Object.keys(monthlyData).sort();
  const labels = sortedKeys.map(k => monthlyData[k].label);
  const dataValues = sortedKeys.map(k => monthlyData[k].totalPS);

  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

  if (growthChart) {
    growthChart.destroy();
  }

  growthChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Production (PS)',
        data: dataValues,
        backgroundColor: gradient,
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 40,
        maxBarThickness: 60
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9', drawBorder: false },
          ticks: {
            font: { family: 'Inter', size: 11, weight: 500 },
            color: '#64748b',
            callback: (val) => val + ' PS'
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 11, weight: 500 },
            color: '#64748b'
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          cornerRadius: 8,
          bodyFont: { family: 'Inter', size: 13 },
          titleFont: { family: 'Inter', size: 13, weight: 700 },
          displayColors: false,
          callbacks: {
            label: (context) => `Production: ${context.raw} PS`
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      }
    }
  });
}

// Quick range helpers
function setToday() {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  if (startDate) startDate.value = iso;
  if (endDate) endDate.value = iso;
  loadReports();
}

function setWeek() {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const sIso = start.toISOString().slice(0, 10);
  const eIso = end.toISOString().slice(0, 10);
  if (startDate) startDate.value = sIso;
  if (endDate) endDate.value = eIso;
  loadReports();
}

function setMonth() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const sIso = start.toISOString().slice(0, 10);
  const eIso = today.toISOString().slice(0, 10);
  if (startDate) startDate.value = sIso;
  if (endDate) endDate.value = eIso;
  loadReports();
}

function logout() {
  localStorage.removeItem("admin");
  window.location.href = "index.html";
}
window.logout = logout;

// INITIAL LOAD
document.addEventListener("DOMContentLoaded", () => {
  loadReports();
});
