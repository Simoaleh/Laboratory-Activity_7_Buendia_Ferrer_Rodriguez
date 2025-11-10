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
        
        window.location.href = targetPage; 
    };


    if (systemconfigButton) {
        systemconfigButton.addEventListener('click', function() {
            navigate('System Config', 'systemconfig.html');
        });
    }

    if (maintenanceButton) {
        maintenanceButton.addEventListener('click', function() {
            navigate('Maintenance', 'maintenance.html');
        });
    }

    if (salesButton) {
        salesButton.addEventListener('click', function() {
            navigate('Sales', 'sales.html');
        });
    }

    if (reportButton) {
        reportButton.addEventListener('click', function() {
            navigate('Report', 'report.html');
        });
    }

    if (helpButton) {
        helpButton.addEventListener('click', function() {
            navigate('Help', 'help.html');
        });
    }

    if (aboutButton) {
        aboutButton.addEventListener('click', function() {
            navigate('About', 'about.html');
        });
    }
});