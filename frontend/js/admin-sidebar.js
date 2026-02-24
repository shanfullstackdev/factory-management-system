(function () {
    const API = "http://localhost:5000/api";

    async function updatePendingBadge() {
        try {
            const res = await fetch(`${API}/production/pending`);
            const data = await res.json();
            const badge = document.getElementById("pendingBadge");
            if (badge) {
                if (data.length > 0) {
                    badge.textContent = data.length;
                    badge.style.display = "inline-block";
                } else {
                    badge.textContent = "0";
                    badge.style.display = "none";
                }
            }
        } catch (err) {
            console.error("Failed to update pending badge:", err);
        }
    }

    // Initial update
    updatePendingBadge();

    // Update every 10 seconds for better responsiveness
    setInterval(updatePendingBadge, 10000);

    // Expose to window so other scripts can trigger an update
    window.updatePendingBadge = updatePendingBadge;
})();
