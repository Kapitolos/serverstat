// Data storage keys
const STORAGE_KEYS = {
    SHIFTS: 'shiftStats_shifts',
    EMPLOYEES: 'shiftStats_employees',
    MIN_WAGE: 'shiftStats_minWage'
};

// Default employees list
const DEFAULT_EMPLOYEES = [
    { id: 'irena', name: 'Irena' },
    { id: 'erica', name: 'Erica' },
    { id: 'waldek', name: 'Waldek' },
    { id: 'jason', name: 'Jason' },
    { id: 'julia', name: 'Julia' },
    { id: 'patricia', name: 'Patricia' },
    { id: 'patrick', name: 'Patrick' },
    { id: 'tayler', name: 'Tayler' },
    { id: 'kevin', name: 'Kevin' },
    { id: 'casey', name: 'Casey' },
    { id: 'flor', name: 'Flor' },
    { id: 'scott', name: 'Scott' },
    { id: 'mario', name: 'Mario' },
    { id: 'chad', name: 'Chad' },
    { id: 'ben', name: 'Ben' }
];

// Fixed venues
const VENUES = ['Hole', 'Bothams'];

// Helper function to generate ID from name
function generateEmployeeId(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Initialize default data
function initializeData() {
    // Set default minimum wage if not set
    if (!localStorage.getItem(STORAGE_KEYS.MIN_WAGE)) {
        localStorage.setItem(STORAGE_KEYS.MIN_WAGE, '16.55');
    }

    // Always ensure default employees exist - merge with existing
    const existingEmployees = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!existingEmployees) {
        // First time - set defaults
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    } else {
        // Merge defaults with existing (add any missing defaults)
        const existing = JSON.parse(existingEmployees);
        const existingIds = existing.map(e => e.id);
        const missingDefaults = DEFAULT_EMPLOYEES.filter(e => !existingIds.includes(e.id));
        if (missingDefaults.length > 0) {
            const merged = [...existing, ...missingDefaults];
            localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(merged));
        }
    }

    // Initialize shifts if empty
    if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify([]));
    }
}

// Get data from localStorage
function getShifts() {
    const data = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    return data ? JSON.parse(data) : [];
}

function getEmployees() {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : DEFAULT_EMPLOYEES;
}

function getVenues() {
    return VENUES;
}

function getMinWage() {
    return parseFloat(localStorage.getItem(STORAGE_KEYS.MIN_WAGE)) || 16.55;
}

// Save data to localStorage
function saveShifts(shifts) {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
}

function saveEmployees(employees) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
}

function saveMinWage(wage) {
    localStorage.setItem(STORAGE_KEYS.MIN_WAGE, wage.toString());
}

// Track selected employees for the current shift
let selectedEmployeeIds = [];

// Load and display data
function loadEmployees() {
    // Ensure employees are initialized
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
        initializeData();
    }
    
    const employees = getEmployees();
    const employeeList = document.getElementById('employeeList');
    const employeeButtons = document.getElementById('employeeButtons');

    if (!employeeList || !employeeButtons) {
        // Elements not ready yet, try again shortly
        setTimeout(loadEmployees, 100);
        return;
    }

    // Update tag list in settings
    employeeList.innerHTML = '';
    employees.forEach(employee => {
        const li = document.createElement('li');
        li.className = 'tag';
        li.innerHTML = `
            ${employee.name}
            <button onclick="removeEmployee('${employee.id}')" aria-label="Remove ${employee.name}">×</button>
        `;
        employeeList.appendChild(li);
    });

    // Update employee selection buttons
    employeeButtons.innerHTML = '';
    employees.forEach(employee => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'employee-button';
        button.textContent = employee.name;
        button.dataset.employeeId = employee.id;
        button.onclick = () => toggleEmployee(employee.id);
        employeeButtons.appendChild(button);
    });

    // Update selected employees display
    updateSelectedEmployeesDisplay();
}

// Toggle employee selection
function toggleEmployee(employeeId) {
    const index = selectedEmployeeIds.indexOf(employeeId);
    if (index > -1) {
        // Deselect
        selectedEmployeeIds.splice(index, 1);
    } else {
        // Select
        selectedEmployeeIds.push(employeeId);
    }
    updateSelectedEmployeesDisplay();
}

// Update the display of selected employees and button states
function updateSelectedEmployeesDisplay() {
    const employeeButtons = document.querySelectorAll('.employee-button');
    const selectedContainer = document.getElementById('selectedEmployees');
    
    if (!selectedContainer) return;

    // Update button states
    employeeButtons.forEach(button => {
        const employeeId = button.dataset.employeeId;
        if (selectedEmployeeIds.includes(employeeId)) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });

    // Update selected employees summary
    const employees = getEmployees();
    if (selectedEmployeeIds.length === 0) {
        selectedContainer.innerHTML = '<span class="no-selection">No employees selected (worked alone)</span>';
        return;
    }

    selectedContainer.innerHTML = '<strong>Selected:</strong> ' + selectedEmployeeIds.map(empId => {
        const employee = employees.find(e => e.id === empId);
        return employee ? `<span class="selected-tag">${employee.name}</span>` : '';
    }).filter(Boolean).join('');
}

function loadVenues() {
    const venues = getVenues();
    const venueSelect = document.getElementById('venue');

    if (!venueSelect) {
        // Element not ready yet, try again shortly
        setTimeout(loadVenues, 100);
        return;
    }

    // Update select dropdown
    venueSelect.innerHTML = '<option value="">Select venue...</option>';
    venues.forEach(venue => {
        const option = document.createElement('option');
        option.value = venue;
        option.textContent = venue;
        venueSelect.appendChild(option);
    });
}

function loadTotalStats() {
    const shifts = getShifts();
    const totalStatsCard = document.getElementById('totalStatsCard');
    const totalStatsContent = document.getElementById('totalStatsContent');

    if (shifts.length === 0) {
        if (totalStatsCard) totalStatsCard.style.display = 'none';
        return;
    }

    if (!totalStatsCard || !totalStatsContent) return;

    // Show the card
    totalStatsCard.style.display = 'block';

    const minWage = getMinWage();
    let totalEarnings = 0;
    let totalGrossSales = 0;
    let totalTips = 0;
    let totalHours = 0;
    let totalShifts = shifts.length;

    shifts.forEach(shift => {
        const tips = shift.cashTips + shift.duebackTips;
        const wage = shift.hours * minWage;
        totalEarnings += wage + tips;
        totalGrossSales += shift.grossSales;
        totalTips += tips;
        totalHours += shift.hours;
    });

    const avgTipPercentage = totalGrossSales > 0 ? (totalTips / totalGrossSales) * 100 : 0;
    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
    const avgEarningsPerShift = totalShifts > 0 ? totalEarnings / totalShifts : 0;

    totalStatsContent.innerHTML = `
        <div class="baseball-card-grid">
            <div class="baseball-stat">
                <div class="baseball-stat-label">Total Shifts</div>
                <div class="baseball-stat-value">${totalShifts}</div>
            </div>
            <div class="baseball-stat">
                <div class="baseball-stat-label">Total Earnings</div>
                <div class="baseball-stat-value">$${formatCurrency(totalEarnings)}</div>
            </div>
            <div class="baseball-stat">
                <div class="baseball-stat-label">Total Tips</div>
                <div class="baseball-stat-value">$${formatCurrency(totalTips)}</div>
            </div>
            <div class="baseball-stat">
                <div class="baseball-stat-label">Gross Sales</div>
                <div class="baseball-stat-value">$${formatCurrency(totalGrossSales)}</div>
            </div>
            <div class="baseball-stat">
                <div class="baseball-stat-label">Tip %</div>
                <div class="baseball-stat-value">${formatCurrency(avgTipPercentage)}%</div>
            </div>
            <div class="baseball-stat">
                <div class="baseball-stat-label">Avg/Hour</div>
                <div class="baseball-stat-value">$${formatCurrency(avgHourlyRate)}</div>
            </div>
            <div class="baseball-stat">
                <div class="baseball-stat-label">Total Hours</div>
                <div class="baseball-stat-value">${formatCurrency(totalHours)}h</div>
            </div>
            <div class="baseball-stat">
                <div class="baseball-stat-label">Avg/Shift</div>
                <div class="baseball-stat-value">$${formatCurrency(avgEarningsPerShift)}</div>
            </div>
        </div>
    `;
}

function loadShifts() {
    let shifts = getShifts();
    const container = document.getElementById('recordsContainer');
    const statsSection = document.getElementById('statsSection');

    if (shifts.length === 0) {
        container.innerHTML = '<p class="empty-state">No shifts recorded yet. Log your first shift above!</p>';
        if (statsSection) statsSection.style.display = 'none';
        return;
    }

    // Show stats section if there are shifts (but keep it collapsed)
    if (statsSection) {
        statsSection.style.display = 'block';
        // Ensure stats content is collapsed
        const statsContent = document.getElementById('statsContent');
        const statsIcon = document.getElementById('statsIcon');
        if (statsContent && statsIcon) {
            statsContent.style.display = 'none';
            statsIcon.textContent = '▼';
        }
    }

    // Migrate old shift data if needed (employees -> employeeIds)
    const employees = getEmployees();
    let needsSave = false;
    shifts = shifts.map(shift => {
        if (shift.employees && !shift.employeeIds) {
            // Migrate old format
            needsSave = true;
            const employeeIds = shift.employees.map(empName => {
                const emp = employees.find(e => e.name === empName);
                return emp ? emp.id : null;
            }).filter(Boolean);
            return { ...shift, employeeIds };
        }
        return shift;
    });

    if (needsSave) {
        saveShifts(shifts);
    }

    // Sort shifts by date (newest first)
    const sortedShifts = [...shifts].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = '';
    sortedShifts.forEach((shift, index) => {
        const card = createShiftCard(shift, index);
        container.appendChild(card);
    });

    // Load stats for current period
    showStatsPeriod('week');
    
    // Load total stats baseball card
    loadTotalStats();
}

function createShiftCard(shift, index) {
    const card = document.createElement('div');
    card.className = 'record-card';

    const minWage = getMinWage();
    const totalTips = shift.cashTips + shift.duebackTips;
    const hourlyWage = shift.hours > 0 ? (shift.hours * minWage + totalTips) / shift.hours : 0;
    const tipPercentage = shift.grossSales > 0 ? (totalTips / shift.grossSales) * 100 : 0;
    const shiftEarnings = (shift.hours * minWage) + totalTips;

    // Calculate health scores based on all shifts
    const allShifts = getShifts();
    const tipHealth = calculateTipPercentageHealth(tipPercentage, allShifts);
    const earningsHealth = calculateEarningsHealth(shiftEarnings, allShifts);
    const tipColor = getHealthColor(tipHealth);
    const earningsColor = getHealthColor(earningsHealth);

    const date = new Date(shift.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    card.innerHTML = `
        <div class="record-header">
            <div>
                <div class="record-date">${formattedDate}</div>
                <div class="record-venue">${shift.venue}</div>
            </div>
            <button onclick="deleteShift(${index})" class="btn btn-danger btn-small">Delete</button>
        </div>
        <div class="health-bars">
            <div class="health-bar-item">
                <div class="health-bar-label">
                    <span>Tip % Quality</span>
                    <span class="health-bar-value">${formatCurrency(tipPercentage)}%</span>
                </div>
                <div class="health-bar-container">
                    <div class="health-bar health-bar-${tipColor}" style="width: ${tipHealth}%"></div>
                </div>
            </div>
            <div class="health-bar-item">
                <div class="health-bar-label">
                    <span>Earnings Performance</span>
                    <span class="health-bar-value">$${formatCurrency(shiftEarnings)}</span>
                </div>
                <div class="health-bar-container">
                    <div class="health-bar health-bar-${earningsColor}" style="width: ${earningsHealth}%"></div>
                </div>
            </div>
        </div>
        <div class="record-stats">
            <div class="stat-item">
                <div class="stat-label">Gross Sales</div>
                <div class="stat-value">$${formatCurrency(shift.grossSales)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Cash Tips</div>
                <div class="stat-value">$${formatCurrency(shift.cashTips)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Dueback Tips</div>
                <div class="stat-value">$${formatCurrency(shift.duebackTips)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Tips</div>
                <div class="stat-value highlight">$${formatCurrency(totalTips)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Hours Worked</div>
                <div class="stat-value">${shift.hours}h</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Hourly Rate</div>
                <div class="stat-value highlight">$${formatCurrency(hourlyWage)}/hr</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Tip Percentage</div>
                <div class="stat-value highlight">${formatCurrency(tipPercentage)}%</div>
            </div>
        </div>
        ${shift.employeeIds && shift.employeeIds.length > 0 ? `
            <div class="record-details">
                <strong>Worked with:</strong>
                ${shift.employeeIds.map(empId => {
                    const employee = getEmployees().find(e => e.id === empId);
                    return employee ? `<span>${employee.name}</span>` : '';
                }).filter(Boolean).join('')}
            </div>
        ` : ''}
    `;

    return card;
}

function formatCurrency(value) {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Calculate statistics for a given period
function calculateStats(period) {
    const shifts = getShifts();
    if (shifts.length === 0) return null;

    const now = new Date();
    let startDate;

    switch(period) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'all':
            startDate = new Date(0); // Beginning of time
            break;
        default:
            startDate = new Date(0);
    }

    const filteredShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= startDate;
    });

    if (filteredShifts.length === 0) return null;

    const minWage = getMinWage();
    let totalEarnings = 0;
    let totalGrossSales = 0;
    let totalTips = 0;
    let totalHours = 0;

    filteredShifts.forEach(shift => {
        const tips = shift.cashTips + shift.duebackTips;
        const wage = shift.hours * minWage;
        totalEarnings += wage + tips;
        totalGrossSales += shift.grossSales;
        totalTips += tips;
        totalHours += shift.hours;
    });

    const avgTipPercentage = totalGrossSales > 0 ? (totalTips / totalGrossSales) * 100 : 0;
    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

    return {
        period,
        shifts: filteredShifts.length,
        totalEarnings,
        totalTips,
        totalGrossSales,
        totalHours,
        avgTipPercentage,
        avgHourlyRate
    };
}

// Calculate health score for tip percentage (0-100)
function calculateTipPercentageHealth(tipPercentage, allShifts) {
    if (allShifts.length === 0) return 50; // Neutral if no data

    const percentages = allShifts.map(shift => {
        const tips = shift.cashTips + shift.duebackTips;
        return shift.grossSales > 0 ? (tips / shift.grossSales) * 100 : 0;
    }).filter(p => p > 0);

    if (percentages.length === 0) return 50;

    const min = Math.min(...percentages);
    const max = Math.max(...percentages);
    const range = max - min;

    if (range === 0) return 50; // All same, neutral

    // Normalize to 0-100 scale
    const normalized = ((tipPercentage - min) / range) * 100;
    return Math.max(0, Math.min(100, normalized));
}

// Calculate health score for earnings (0-100)
function calculateEarningsHealth(shiftEarnings, allShifts) {
    if (allShifts.length === 0) return 50;

    const minWage = getMinWage();
    const earnings = allShifts.map(shift => {
        const tips = shift.cashTips + shift.duebackTips;
        const wage = shift.hours * minWage;
        return wage + tips;
    });

    const min = Math.min(...earnings);
    const max = Math.max(...earnings);
    const range = max - min;

    if (range === 0) return 50;

    const normalized = ((shiftEarnings - min) / range) * 100;
    return Math.max(0, Math.min(100, normalized));
}

// Get color for health score
function getHealthColor(score) {
    if (score >= 70) return 'green';
    if (score >= 40) return 'yellow';
    return 'red';
}

// Employee management
function addEmployee() {
    const input = document.getElementById('newEmployee');
    const name = input.value.trim();

    if (!name) {
        alert('Please enter an employee name');
        return;
    }

    const employees = getEmployees();
    const newId = generateEmployeeId(name);
    
    // Check if employee with same ID already exists
    if (employees.find(emp => emp.id === newId)) {
        alert('Employee already exists');
        return;
    }

    employees.push({ id: newId, name: name });
    saveEmployees(employees);
    loadEmployees();
    input.value = '';
}

function removeEmployee(employeeId) {
    const employees = getEmployees();
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) return;
    
    if (confirm(`Remove ${employee.name} from the employee list?`)) {
        const filtered = employees.filter(emp => emp.id !== employeeId);
        saveEmployees(filtered);
        loadEmployees();
    }
}

// Venues are fixed, no management functions needed

// Shift form handling
function handleSubmit(event) {
    event.preventDefault();

    const date = document.getElementById('date').value;
    const venue = document.getElementById('venue').value;
    const hours = parseFloat(document.getElementById('hours').value);
    const grossSales = parseFloat(document.getElementById('grossSales').value);
    const cashTips = parseFloat(document.getElementById('cashTips').value);
    const duebackTips = parseFloat(document.getElementById('duebackTips').value);

    // Get selected employee IDs (can be empty for solo shifts)
    const employeeIds = [...selectedEmployeeIds];

    const shift = {
        date,
        venue,
        hours,
        grossSales,
        cashTips,
        duebackTips,
        employeeIds, // Store employee IDs instead of names
        timestamp: new Date().toISOString()
    };

    const shifts = getShifts();
    shifts.push(shift);
    saveShifts(shifts);

    // Reset form
    document.getElementById('shiftForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    
    // Clear selected employees
    selectedEmployeeIds = [];
    updateSelectedEmployeesDisplay();

    // Reload display
    await loadShifts();

    // Show success message
    alert('Shift saved successfully!');
}

function deleteShift(index) {
    if (confirm('Are you sure you want to delete this shift?')) {
        const shifts = getShifts();
        const sortedShifts = [...shifts].sort((a, b) => new Date(b.date) - new Date(a.date));
        const shiftToDelete = sortedShifts[index];
        
        const filtered = shifts.filter(s => s.timestamp !== shiftToDelete.timestamp);
        saveShifts(filtered);
        loadShifts();
    }
}

// Settings
function updateMinWage() {
    const wageInput = document.getElementById('minWage');
    const wage = parseFloat(wageInput.value);
    if (wage >= 0) {
        saveMinWage(wage);
    }
}

// Export/Import functionality
function exportData() {
    const data = {
        shifts: getShifts(),
        employees: getEmployees(),
        minWage: getMinWage(),
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shiftStats_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('importFile').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('This will replace all current data. Are you sure?')) {
                if (data.shifts) {
                    // Migrate old shift data if needed (employees -> employeeIds)
                    const migratedShifts = data.shifts.map(shift => {
                        if (shift.employees && !shift.employeeIds) {
                            // Migrate old format
                            const employees = getEmployees();
                            const employeeIds = shift.employees.map(empName => {
                                const emp = employees.find(e => e.name === empName);
                                return emp ? emp.id : null;
                            }).filter(Boolean);
                            return { ...shift, employeeIds };
                        }
                        return shift;
                    });
                    saveShifts(migratedShifts);
                }
                if (data.employees) saveEmployees(data.employees);
                if (data.minWage) {
                    saveMinWage(data.minWage);
                    document.getElementById('minWage').value = data.minWage;
                }

                loadEmployees();
                loadVenues();
                loadShifts();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

function clearAllData() {
    if (confirm('Are you absolutely sure you want to delete ALL data? This cannot be undone!')) {
        if (confirm('This is your last chance. Click OK to permanently delete all data.')) {
            localStorage.removeItem(STORAGE_KEYS.SHIFTS);
            localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
            localStorage.removeItem(STORAGE_KEYS.MIN_WAGE);
            
            initializeData();
            loadEmployees();
            loadVenues();
            loadShifts();
            document.getElementById('minWage').value = '16.55';
            alert('All data has been cleared.');
        }
    }
}

// Toggle collapsible sections
function toggleCollapsible(section) {
    const content = document.getElementById(section + 'Content');
    const icon = document.getElementById(section + 'Icon');
    
    if (!content || !icon) return;

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Display statistics for a given period
function showStatsPeriod(period) {
    const stats = calculateStats(period);
    const statsContent = document.getElementById('statsContentInner');
    const tabs = document.querySelectorAll('.stat-tab');

    if (!statsContent) return;

    // Update active tab
    tabs.forEach(tab => {
        const tabText = tab.textContent.trim().toLowerCase();
        const isActive = 
            (period === 'week' && tabText === 'week') ||
            (period === 'month' && tabText === 'month') ||
            (period === 'year' && tabText === 'year') ||
            (period === 'all' && tabText === 'all time');
        
        if (isActive) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    if (!stats) {
        statsContent.innerHTML = '<p class="empty-state">No data available for this period.</p>';
        return;
    }

    const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
    statsContent.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-label">Total Earnings</div>
                <div class="stat-card-value">$${formatCurrency(stats.totalEarnings)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Total Tips</div>
                <div class="stat-card-value">$${formatCurrency(stats.totalTips)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Gross Sales</div>
                <div class="stat-card-value">$${formatCurrency(stats.totalGrossSales)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Tip Percentage</div>
                <div class="stat-card-value">${formatCurrency(stats.avgTipPercentage)}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Avg Hourly Rate</div>
                <div class="stat-card-value">$${formatCurrency(stats.avgHourlyRate)}/hr</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Total Hours</div>
                <div class="stat-card-value">${formatCurrency(stats.totalHours)}h</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Number of Shifts</div>
                <div class="stat-card-value">${stats.shifts}</div>
            </div>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize data first
    initializeData();
    
    // Initialize selected employees array
    selectedEmployeeIds = [];
    
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    // Load existing data - employees and venues must load first
    document.getElementById('minWage').value = getMinWage();
    loadVenues(); // Load venues first
    loadEmployees(); // Then employees (so buttons are populated)
    loadShifts(); // Finally load shifts (this will also load stats)

    // Update min wage on change
    document.getElementById('minWage').addEventListener('change', updateMinWage);
});

