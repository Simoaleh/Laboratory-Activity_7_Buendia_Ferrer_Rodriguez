document.addEventListener('DOMContentLoaded', function() {
    const systemconfigButton = document.getElementById('systemconfigButton');
    const maintenanceutton = document.getElementById(' maintenanceButton');
    const salesButton = document.getElementById('salesButton');
    const reportButton = document.getElementById('reportButton');
    const helpButton = document.getElementById('helpButton');
    const aboutButton = document.getElementById('aboutButton');

    const statusMessage = document.getElementById('status-message');

    /**
     * @param {string} buttonName
     * @param {string} targetPage
     */
    const navigate = (buttonName, targetPage) => {
        if (statusMessage) {
            statusMessage.textContent = `Status: Navigating from ${buttonName} to ${targetPage}...`;
        }
        
        // --- CORE NAVIGATION LOGIC ---
        // This command reloads the browser to the specified new file path.
        window.location.href = targetPage; 
    };


    if (systemconfigButton) {
        systemconfigButton.addEventListener('click', function() {
            navigate('System Config', 'systemconfig.html');
        });
    }

    // Branches Button -> branches.html (Supporting Form Page)
    if (maintenanceButton) {
        maintenanceButton.addEventListener('click', function() {
            navigate('Maintenance', 'maintenance.html');
        });
    }

    // Sales Button -> sales.html
    if (salesButton) {
        salesButton.addEventListener('click', function() {
            navigate('Sales', 'sales.html');
        });
    }

    // Report Button -> report.html
    if (reportButton) {
        reportButton.addEventListener('click', function() {
            navigate('Report', 'report.html');
        });
    }

    // Help Button -> help.html
    if (helpButton) {
        helpButton.addEventListener('click', function() {
            navigate('Help', 'help.html');
        });
    }

    // About Button -> about.html
    if (aboutButton) {
        aboutButton.addEventListener('click', function() {
            navigate('About', 'about.html');
        });
    }
});