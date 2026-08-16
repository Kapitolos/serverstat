// Data storage keys
const STORAGE_KEYS = {
    SHIFTS: 'shiftStats_shifts',
    MIN_WAGE: 'shiftStats_minWage',
    HISTORY_GROUP: 'shiftStats_historyGroup',
    DUEBACKS_COLLECTED: 'shiftStats_duebacksCollected',
    PROFILES: 'shiftStats_profiles',
    CURRENT_NAME: 'shiftStats_currentName',
    THEME: 'shiftStats_theme'
};

const DEFAULT_MIN_WAGE = 17.60;
const PREVIOUS_DEFAULT_MIN_WAGE = '16.55';
const DEFAULT_NAME = 'Larry';
const DEFAULT_THEME = 'dusk';
const THEMES = ['linen', 'dusk', 'slate', 'blush', 'sage', 'sand', 'lavender', 'sea'];

const DEFAULT_VENUES = ['Hole', 'Bothams'];

let currentStatsPeriod = 'week';
let activeNavPanel = null;
let editingTimestamp = null;
let dialogResolver = null;
let historyPickerOpen = false;
let calendarCursor = null;

function showAppAlert(message) {
    return showAppDialog(message, false);
}

function showAppConfirm(message) {
    return showAppDialog(message, true);
}

function showAppDialog(message, showCancel) {
    return new Promise(resolve => {
        const dialog = document.getElementById('appDialog');
        const text = document.getElementById('appDialogMessage');
        const cancel = document.getElementById('appDialogCancel');
        const confirmButton = document.getElementById('appDialogConfirm');

        if (!dialog || !text || !cancel || !confirmButton) {
            resolve(!showCancel);
            return;
        }

        dialogResolver = resolve;
        text.textContent = message;
        cancel.hidden = !showCancel;
        confirmButton.textContent = showCancel ? 'Continue' : 'OK';
        dialog.hidden = false;
        confirmButton.focus();
    });
}

function closeAppDialog(result) {
    const dialog = document.getElementById('appDialog');
    if (dialog) dialog.hidden = true;

    if (dialogResolver) {
        const resolve = dialogResolver;
        dialogResolver = null;
        resolve(Boolean(result));
    }
}

function normalizeName(name) {
    return (name || '').trim().replace(/\s+/g, ' ');
}

function getNameKey(name) {
    return normalizeName(name).toLowerCase();
}

function createEmptyProfile(displayName) {
    return {
        displayName: displayName || DEFAULT_NAME,
        shifts: [],
        minWage: DEFAULT_MIN_WAGE,
        historyGroup: 'week',
        historySort: 'newest',
        historyWeek: null,
        historyMonth: null,
        collectedDuebacks: {},
        venues: DEFAULT_VENUES.slice(),
        venueWages: {}
    };
}

function getProfiles() {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
    return data ? JSON.parse(data) : {};
}

function saveProfiles(profiles) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

function getCurrentName() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_NAME) || DEFAULT_NAME;
}

function setCurrentName(name) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_NAME, name);
}

function getCurrentProfile() {
    const profiles = getProfiles();
    const key = getNameKey(getCurrentName());
    return profiles[key] || createEmptyProfile(getCurrentName());
}

function updateCurrentProfile(partial) {
    const profiles = getProfiles();
    const name = getCurrentName();
    const key = getNameKey(name);
    profiles[key] = {
        ...createEmptyProfile(name),
        ...profiles[key],
        ...partial,
        displayName: name
    };
    saveProfiles(profiles);
}

function initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
        const hasLegacyData = Boolean(
            localStorage.getItem(STORAGE_KEYS.SHIFTS) ||
            localStorage.getItem(STORAGE_KEYS.CURRENT_NAME)
        );

        if (!hasLegacyData) {
            return;
        }

        const storedWage = localStorage.getItem(STORAGE_KEYS.MIN_WAGE);
        const minWage = (!storedWage || storedWage === PREVIOUS_DEFAULT_MIN_WAGE)
            ? DEFAULT_MIN_WAGE
            : parseFloat(storedWage) || DEFAULT_MIN_WAGE;
        const name = localStorage.getItem(STORAGE_KEYS.CURRENT_NAME) || DEFAULT_NAME;
        const profiles = {};
        profiles[getNameKey(name)] = {
            displayName: name,
            shifts: JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]'),
            minWage,
            historyGroup: localStorage.getItem(STORAGE_KEYS.HISTORY_GROUP) || 'week',
            collectedDuebacks: JSON.parse(localStorage.getItem(STORAGE_KEYS.DUEBACKS_COLLECTED) || '{}'),
            venues: DEFAULT_VENUES.slice(),
            venueWages: {}
        };
        saveProfiles(profiles);
        setCurrentName(name);
        return;
    }

    const profiles = getProfiles();
    let name = localStorage.getItem(STORAGE_KEYS.CURRENT_NAME);
    if (!name) {
        const firstProfile = Object.values(profiles)[0];
        if (!firstProfile) return;
        name = firstProfile.displayName;
        setCurrentName(name);
    }

    const key = getNameKey(name);
    if (!profiles[key]) {
        profiles[key] = createEmptyProfile(name);
        saveProfiles(profiles);
    }

    if (!profiles[key].minWage || String(profiles[key].minWage) === PREVIOUS_DEFAULT_MIN_WAGE) {
        profiles[key].minWage = DEFAULT_MIN_WAGE;
        saveProfiles(profiles);
    }
}

function needsNamePrompt() {
    return !localStorage.getItem(STORAGE_KEYS.CURRENT_NAME);
}

function getShifts() {
    return getCurrentProfile().shifts || [];
}

function getVenues() {
    const profile = getCurrentProfile();
    const stored = Array.isArray(profile.venues) ? profile.venues : DEFAULT_VENUES;
    const venues = [...new Set(stored.map(normalizeVenueName).filter(Boolean))];
    return venues.length > 0 ? venues : DEFAULT_VENUES.slice();
}

function saveVenues(venues) {
    updateCurrentProfile({ venues });
}

function normalizeVenueName(name) {
    return (name || '').trim().replace(/\s+/g, ' ');
}

function getDefaultMinWage() {
    return parseFloat(getCurrentProfile().minWage) || DEFAULT_MIN_WAGE;
}

function getVenueWages() {
    const wages = getCurrentProfile().venueWages;
    return wages && typeof wages === 'object' ? { ...wages } : {};
}

function saveVenueWages(venueWages) {
    updateCurrentProfile({ venueWages });
}

function getMinWage(venue) {
    const defaultWage = getDefaultMinWage();
    if (!venue) return defaultWage;

    const wages = getVenueWages();
    const match = Object.keys(wages).find(name => name.toLowerCase() === String(venue).toLowerCase());
    if (!match) return defaultWage;

    const wage = parseFloat(wages[match]);
    return Number.isFinite(wage) && wage >= 0 ? wage : defaultWage;
}

function getHistoryGroupBy() {
    return getCurrentProfile().historyGroup || 'week';
}

function getHistorySort() {
    return getCurrentProfile().historySort === 'oldest' ? 'oldest' : 'newest';
}

function saveShifts(shifts) {
    updateCurrentProfile({ shifts });
}

function saveMinWage(wage) {
    updateCurrentProfile({ minWage: wage });
}

function saveHistoryGroupBy(groupBy) {
    updateCurrentProfile({ historyGroup: groupBy });
}

function saveHistorySort(sortOrder) {
    updateCurrentProfile({ historySort: sortOrder });
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthKey(key) {
    const [year, month] = String(key || '').split('-').map(Number);
    if (!year || !month) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return new Date(year, month - 1, 1);
}

function getSelectedWeekMonday() {
    const stored = getCurrentProfile().historyWeek;
    if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) {
        return getMonday(parseLocalDate(stored));
    }
    return getMonday(new Date());
}

function saveSelectedWeekMonday(monday) {
    updateCurrentProfile({ historyWeek: toISODate(monday) });
}

function getSelectedMonthKey() {
    const stored = getCurrentProfile().historyMonth;
    if (stored && /^\d{4}-\d{2}$/.test(stored)) return stored;
    return getMonthKey(new Date());
}

function saveSelectedMonthKey(key) {
    updateCurrentProfile({ historyMonth: key });
}

function getTheme() {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    return THEMES.includes(stored) ? stored : DEFAULT_THEME;
}

function applyTheme(theme) {
    const nextTheme = THEMES.includes(theme) ? theme : DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', nextTheme);
    updateNavOffset();
    renderThemeOptions();
}

function setTheme(theme) {
    const nextTheme = THEMES.includes(theme) ? theme : DEFAULT_THEME;
    localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
    applyTheme(nextTheme);
}

function renderThemeOptions() {
    const current = getTheme();
    document.querySelectorAll('.theme-swatch').forEach(button => {
        button.classList.toggle('active', button.dataset.theme === current);
    });
}

function updateNavOffset() {
    const nav = document.querySelector('.top-nav');
    if (!nav) return;
    const height = Math.ceil(nav.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--nav-offset', `${height}px`);
}

function scrollPanelIntoView(section) {
    if (!section) return;
    updateNavOffset();
    const nav = document.querySelector('.top-nav');
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    const top = window.scrollY + section.getBoundingClientRect().top - navHeight - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function getCollectedDuebacks() {
    return getCurrentProfile().collectedDuebacks || {};
}

function saveCollectedDuebacks(collected) {
    updateCurrentProfile({ collectedDuebacks: collected });
}

function setWeekDuebacksCollected(weekKey, collected) {
    const collectedWeeks = getCollectedDuebacks();
    if (collected) {
        collectedWeeks[weekKey] = true;
    } else {
        delete collectedWeeks[weekKey];
    }
    saveCollectedDuebacks(collectedWeeks);
}

function clearWeekDuebacksCollected(weekKey) {
    const collectedWeeks = getCollectedDuebacks();
    if (collectedWeeks[weekKey]) {
        delete collectedWeeks[weekKey];
        saveCollectedDuebacks(collectedWeeks);
    }
}

function updateActiveNameDisplay() {
    const name = getCurrentName();
    const pageHeading = document.getElementById('pageNameHeading');
    const nameInput = document.getElementById('profileName');

    if (pageHeading) pageHeading.textContent = name;
    document.title = `${name} · Shift Tracker`;
    if (nameInput && document.activeElement !== nameInput) {
        nameInput.value = name;
    }
}

function renderSavedNames() {
    const list = document.getElementById('savedNamesList');
    if (!list) return;

    list.innerHTML = '';
    const profiles = getProfiles();
    const currentKey = getNameKey(getCurrentName());
    const keys = Object.keys(profiles).sort((a, b) =>
        (profiles[a].displayName || a).localeCompare(profiles[b].displayName || b)
    );

    keys.forEach(key => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = key === currentKey ? 'name-tag active' : 'name-tag';
        button.textContent = profiles[key].displayName || key;
        button.onclick = () => switchToProfile(key);
        list.appendChild(button);
    });
}

function refreshProfileView() {
    updateActiveNameDisplay();
    renderSavedNames();
    renderVenueList();
    document.getElementById('minWage').value = getMinWage();
    loadVenues();
    loadShifts();
}

async function submitNameChange() {
    const name = normalizeName(document.getElementById('profileName').value);
    if (!name) {
        await showAppAlert('Please enter a name');
        return;
    }

    const currentName = getCurrentName();
    const newKey = getNameKey(name);
    const currentKey = getNameKey(currentName);

    if (newKey === currentKey) {
        setCurrentName(name);
        updateCurrentProfile({ displayName: name });
        refreshProfileView();
        return;
    }

    const profiles = getProfiles();
    if (profiles[newKey]) {
        const shouldSwitch = await showAppConfirm(`Switch to ${profiles[newKey].displayName}'s existing log?`);
        if (!shouldSwitch) return;
        setCurrentName(profiles[newKey].displayName);
        refreshProfileView();
        return;
    }

    const shouldCreate = await showAppConfirm(`Start a new log for ${name}? ${currentName}'s shifts will stay saved under that name.`);
    if (!shouldCreate) {
        document.getElementById('profileName').value = currentName;
        return;
    }

    profiles[newKey] = createEmptyProfile(name);
    saveProfiles(profiles);
    setCurrentName(name);
    refreshProfileView();
}

function switchToProfile(nameKey) {
    const profiles = getProfiles();
    const profile = profiles[nameKey];
    if (!profile) return;
    if (getNameKey(getCurrentName()) === nameKey) return;

    setCurrentName(profile.displayName);
    refreshProfileView();
}

function getNavPanelId(panel) {
    if (panel === 'settings') return 'settingsSection';
    if (panel === 'statistics') return 'statsSection';
    if (panel === 'duebacks') return 'duebacksSection';
    return null;
}

function applyNavPanelVisibility() {
    ['settings', 'statistics', 'duebacks'].forEach(panel => {
        const section = document.getElementById(getNavPanelId(panel));
        if (section) {
            section.style.display = activeNavPanel === panel ? 'block' : 'none';
        }
    });

    document.querySelectorAll('.nav-dropdown-item').forEach(item => {
        item.classList.toggle('active', item.dataset.panel === activeNavPanel);
    });
}

function toggleNavMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('navDropdown');
    const button = document.getElementById('navMenuButton');
    if (!dropdown || !button) return;

    const willOpen = dropdown.hidden;
    dropdown.hidden = !willOpen;
    button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
}

function closeNavMenu() {
    const dropdown = document.getElementById('navDropdown');
    const button = document.getElementById('navMenuButton');
    if (dropdown) dropdown.hidden = true;
    if (button) button.setAttribute('aria-expanded', 'false');
}

function isShiftFormCollapsed() {
    return document.getElementById('shiftFormSection')?.classList.contains('is-collapsed');
}

function setShiftFormCollapsed(collapsed) {
    const section = document.getElementById('shiftFormSection');
    const content = document.getElementById('shiftFormContent');
    const toggle = document.getElementById('shiftFormToggle');
    const icon = document.getElementById('shiftFormIcon');
    if (!section || !content || !toggle) return;

    section.classList.toggle('is-collapsed', collapsed);
    content.hidden = collapsed;
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (icon) icon.textContent = collapsed ? '▾' : '▴';
}

function toggleShiftForm() {
    setShiftFormCollapsed(!isShiftFormCollapsed());
}

function updateHistoryToolbarState() {
    const section = document.getElementById('historySection');
    const diskButton = document.getElementById('historyDiskButton');
    const filterButton = document.getElementById('historyFilterButton');
    if (!section || !diskButton || !filterButton) return;

    const diskOpen = section.classList.contains('is-disk-open');
    const filterOpen = section.classList.contains('is-filter-open');
    diskButton.setAttribute('aria-expanded', diskOpen ? 'true' : 'false');
    filterButton.setAttribute('aria-expanded', filterOpen ? 'true' : 'false');
}

function toggleHistoryPanel(panel) {
    const section = document.getElementById('historySection');
    if (!section || (panel !== 'disk' && panel !== 'filter')) return;

    const className = panel === 'disk' ? 'is-disk-open' : 'is-filter-open';
    const willOpen = !section.classList.contains(className);
    section.classList.remove('is-disk-open', 'is-filter-open');
    if (willOpen) section.classList.add(className);
    updateHistoryToolbarState();
}

function closeNavPanel() {
    activeNavPanel = null;
    applyNavPanelVisibility();
}

function openNavPanel(panel) {
    closeNavMenu();
    activeNavPanel = activeNavPanel === panel ? null : panel;

    if (activeNavPanel === 'statistics') {
        showStatsPeriod(currentStatsPeriod);
    }
    if (activeNavPanel === 'duebacks') {
        loadWeeklyDuebacks(getShifts());
    }

    applyNavPanelVisibility();

    const section = document.getElementById(getNavPanelId(activeNavPanel));
    if (section) {
        scrollPanelIntoView(section);
    }
}

function showNamePrompt() {
    const prompt = document.getElementById('namePrompt');
    if (!prompt) return;
    prompt.hidden = false;
    const input = document.getElementById('firstNameInput');
    if (input) {
        setTimeout(() => input.focus(), 50);
    }
}

function hideNamePrompt() {
    const prompt = document.getElementById('namePrompt');
    if (prompt) prompt.hidden = true;
}

function submitFirstName(event) {
    event.preventDefault();
    const name = normalizeName(document.getElementById('firstNameInput').value) || DEFAULT_NAME;
    const profiles = getProfiles();
    const key = getNameKey(name);

    if (!profiles[key]) {
        profiles[key] = createEmptyProfile(name);
        saveProfiles(profiles);
    }

    setCurrentName(profiles[key].displayName || name);
    hideNamePrompt();
    startApp();
}

function startApp() {
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('minWage').value = getMinWage();
    document.getElementById('profileName').value = getCurrentName();
    renderSavedNames();
    renderThemeOptions();
    renderVenueList();
    updateActiveNameDisplay();
    loadVenues();
    loadShifts();
    setShiftFormCollapsed(true);
}

function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMonday(date) {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = monday.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + offset);
    return monday;
}

function getSunday(monday) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
}

function formatDate(dateStr) {
    return parseLocalDate(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatWeekRange(monday) {
    const sunday = getSunday(monday);
    const start = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} – ${end}`;
}

function formatMonthLabel(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
}

function getShiftTotals(shift, minWage = getMinWage(shift && shift.venue)) {
    const cashTips = Number(shift.cashTips) || 0;
    const duebackTips = Number(shift.duebackTips) || 0;
    const hours = Number(shift.hours) || 0;
    const totalTips = cashTips + duebackTips;
    const wage = hours * minWage;
    const earnings = wage + totalTips;
    const hourlyRate = hours > 0 ? earnings / hours : 0;

    return { cashTips, duebackTips, hours, totalTips, wage, earnings, hourlyRate };
}

function loadVenues() {
    const venues = getVenues();
    const venueSelect = document.getElementById('venue');

    if (!venueSelect) {
        setTimeout(loadVenues, 100);
        return;
    }

    const selected = venueSelect.value;
    venueSelect.innerHTML = '<option value="">Select venue...</option>';
    venues.forEach(venue => {
        const option = document.createElement('option');
        option.value = venue;
        option.textContent = venue;
        venueSelect.appendChild(option);
    });

    if (venues.includes(selected)) {
        venueSelect.value = selected;
    }
}

function renderVenueList() {
    const list = document.getElementById('venueList');
    if (!list) return;

    list.innerHTML = '';
    getVenues().forEach(venue => {
        const item = document.createElement('li');
        item.className = 'venue-item';

        const top = document.createElement('div');
        top.className = 'venue-item-top';

        const name = document.createElement('span');
        name.className = 'venue-item-name';
        name.textContent = venue;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'venue-item-remove';
        button.setAttribute('aria-label', `Delete ${venue}`);
        button.textContent = '×';
        button.onclick = () => removeVenue(venue);

        top.appendChild(name);
        top.appendChild(button);

        const wageLabel = document.createElement('label');
        wageLabel.className = 'venue-wage';
        const wageCaption = document.createElement('span');
        wageCaption.textContent = 'Hourly wage';
        const wageInput = document.createElement('input');
        wageInput.type = 'number';
        wageInput.step = '0.01';
        wageInput.min = '0';
        wageInput.value = getMinWage(venue).toFixed(2);
        wageInput.addEventListener('change', () => updateVenueWage(venue, wageInput));
        wageLabel.appendChild(wageCaption);
        wageLabel.appendChild(wageInput);

        item.appendChild(top);
        item.appendChild(wageLabel);
        list.appendChild(item);
    });
}

async function addVenue() {
    const input = document.getElementById('newVenue');
    const name = normalizeVenueName(input && input.value);
    if (!name) {
        await showAppAlert('Please enter a venue name');
        return;
    }

    const venues = getVenues();
    if (venues.some(venue => venue.toLowerCase() === name.toLowerCase())) {
        await showAppAlert('That venue already exists');
        return;
    }

    saveVenues([...venues, name]);
    input.value = '';
    renderVenueList();
    loadVenues();
}

function updateVenueWage(venueName, input) {
    const wage = parseFloat(input.value);
    if (!(wage >= 0)) {
        input.value = getMinWage(venueName).toFixed(2);
        return;
    }

    input.value = wage.toFixed(2);
    const wages = getVenueWages();
    wages[venueName] = wage;
    saveVenueWages(wages);
    loadShifts();
}

async function removeVenue(venueName) {
    const matchingShifts = getShifts().filter(shift => shift.venue === venueName);
    if (matchingShifts.length > 0) {
        const confirmed = await showAppConfirm(
            `Delete ${venueName}? This will also delete ${matchingShifts.length} saved shift${matchingShifts.length === 1 ? '' : 's'} at that venue.`
        );
        if (!confirmed) return;

        const remainingShifts = getShifts().filter(shift => shift.venue !== venueName);
        saveShifts(remainingShifts);
        if (editingTimestamp && matchingShifts.some(shift => shift.timestamp === editingTimestamp)) {
            resetShiftForm();
        }
    }

    const wages = getVenueWages();
    delete wages[venueName];
    saveVenueWages(wages);
    saveVenues(getVenues().filter(venue => venue !== venueName));
    renderVenueList();
    loadVenues();
    loadShifts();
}

function setHistoryGroupBy(groupBy) {
    saveHistoryGroupBy(groupBy);
    historyPickerOpen = false;
    calendarCursor = null;
    loadShifts();
}

function setHistorySort(sortOrder) {
    saveHistorySort(sortOrder);
    loadShifts();
}

function loadShifts() {
    const shifts = getShifts();
    const container = document.getElementById('recordsContainer');
    const groupSelect = document.getElementById('historyGroupBy');
    const sortSelect = document.getElementById('historySort');

    if (groupSelect) {
        groupSelect.value = getHistoryGroupBy();
    }
    if (sortSelect) {
        sortSelect.value = getHistorySort();
    }

    if (shifts.length === 0) {
        setHistoryPeriodBrowser(null);
        container.innerHTML = '<p class="empty-state">No shifts recorded yet. Log your first shift above!</p>';
        loadWeeklyDuebacks(shifts);
        showStatsPeriod(currentStatsPeriod);
        updateActiveNameDisplay();
        applyNavPanelVisibility();
        return;
    }

    renderShiftHistory(shifts, getHistoryGroupBy());
    loadWeeklyDuebacks(shifts);
    showStatsPeriod(currentStatsPeriod);
    updateActiveNameDisplay();
    applyNavPanelVisibility();
}

function compareShiftsByDate(a, b, newestFirst) {
    const dateDiff = parseLocalDate(a.date) - parseLocalDate(b.date);
    if (dateDiff !== 0) {
        return newestFirst ? -dateDiff : dateDiff;
    }

    const timeA = a.timestamp || '';
    const timeB = b.timestamp || '';
    if (timeA === timeB) return 0;
    return newestFirst ? (timeA < timeB ? 1 : -1) : (timeA < timeB ? -1 : 1);
}

function renderShiftHistory(shifts, groupBy) {
    const container = document.getElementById('recordsContainer');
    container.innerHTML = '';
    const newestFirst = getHistorySort() === 'newest';
    setHistoryPeriodBrowser(null);

    if (groupBy === 'all') {
        const sortedShifts = [...shifts].sort((a, b) => compareShiftsByDate(a, b, newestFirst));
        sortedShifts.forEach(shift => container.appendChild(createShiftCard(shift)));
        return;
    }

    if (groupBy === 'week') {
        renderWeekHistory(container, shifts, newestFirst);
        return;
    }

    if (groupBy === 'month') {
        renderMonthHistory(container, shifts, newestFirst);
        return;
    }

    const groups = groupShifts(shifts, groupBy, newestFirst);
    groups.forEach(group => {
        const section = document.createElement('div');
        section.className = 'history-group';

        const header = document.createElement('div');
        header.className = 'history-group-header';
        header.innerHTML = `
            <div>
                <div class="history-group-title">${escapeHtml(group.title)}</div>
                <div class="history-group-subtitle">${escapeHtml(group.subtitle)}</div>
            </div>
            <div class="history-group-totals">
                ${group.shifts.length} shift${group.shifts.length === 1 ? '' : 's'}
                · ${formatCurrency(group.hours)}h
                · $${formatCurrency(group.tips)} tips
            </div>
        `;
        section.appendChild(header);

        group.shifts.forEach(shift => section.appendChild(createShiftCard(shift)));
        container.appendChild(section);
    });
}

function getPeriodTotals(periodShifts) {
    return periodShifts.reduce((totals, shift) => {
        const shiftTotals = getShiftTotals(shift);
        totals.hours += shiftTotals.hours;
        totals.tips += shiftTotals.totalTips;
        return totals;
    }, { hours: 0, tips: 0 });
}

function formatPeriodTotals(periodShifts) {
    const totals = getPeriodTotals(periodShifts);
    return `${periodShifts.length} shift${periodShifts.length === 1 ? '' : 's'} · ${formatCurrency(totals.hours)}h · $${formatCurrency(totals.tips)} tips`;
}

function getShiftsInWeek(shifts, monday) {
    const start = toISODate(monday);
    const end = toISODate(getSunday(monday));
    return shifts.filter(shift => shift.date >= start && shift.date <= end);
}

function getShiftsInMonth(shifts, monthKey) {
    return shifts.filter(shift => String(shift.date || '').startsWith(monthKey));
}

function getWeeksWithShifts(shifts, newestFirst) {
    const weeks = new Map();
    shifts.forEach(shift => {
        const monday = getMonday(parseLocalDate(shift.date));
        const key = toISODate(monday);
        if (!weeks.has(key)) {
            weeks.set(key, { key, monday, shifts: [] });
        }
        weeks.get(key).shifts.push(shift);
    });

    const list = Array.from(weeks.values());
    list.sort((a, b) => newestFirst ? b.monday - a.monday : a.monday - b.monday);
    return list;
}

function getMonthsWithShifts(shifts, newestFirst) {
    const months = new Map();
    shifts.forEach(shift => {
        const key = String(shift.date || '').slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(key)) return;
        if (!months.has(key)) {
            months.set(key, { key, date: parseMonthKey(key), shifts: [] });
        }
        months.get(key).shifts.push(shift);
    });

    const list = Array.from(months.values());
    list.sort((a, b) => newestFirst ? b.date - a.date : a.date - b.date);
    return list;
}

function ensureCalendarCursor(groupBy) {
    if (calendarCursor) return;
    if (groupBy === 'week') {
        const monday = getSelectedWeekMonday();
        calendarCursor = new Date(monday.getFullYear(), monday.getMonth(), 1);
        return;
    }
    calendarCursor = parseMonthKey(getSelectedMonthKey());
}

function createPeriodNav({ title, subtitle, totalsText, onPrev, onNext }) {
    const header = document.createElement('div');
    header.className = 'history-period-header';

    const nav = document.createElement('div');
    nav.className = 'history-period-nav';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'icon-button';
    prev.setAttribute('aria-label', 'Previous');
    prev.textContent = '‹';
    prev.onclick = onPrev;

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'icon-button';
    next.setAttribute('aria-label', 'Next');
    next.textContent = '›';
    next.onclick = onNext;

    const copy = document.createElement('div');
    copy.className = 'history-period-copy';
    copy.innerHTML = `
        <div class="history-group-title">${escapeHtml(title)}</div>
        <div class="history-group-subtitle">${escapeHtml(subtitle)}</div>
    `;

    nav.appendChild(prev);
    nav.appendChild(copy);
    nav.appendChild(next);

    const totals = document.createElement('div');
    totals.className = 'history-group-totals';
    totals.textContent = totalsText;

    header.appendChild(nav);
    header.appendChild(totals);
    return header;
}

function setHistoryPeriodBrowser(options) {
    const slot = document.getElementById('historyPeriodBrowser');
    if (!slot) return;

    slot.innerHTML = '';
    if (!options) {
        slot.hidden = true;
        return;
    }

    slot.hidden = false;
    slot.appendChild(createPeriodNav(options));
}

function createHistoryPicker({ title, onToggle, renderBody }) {
    const picker = document.createElement('div');
    picker.className = 'history-picker';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'collapsible-header history-picker-toggle';
    toggle.id = 'historyPickerToggle';
    toggle.setAttribute('aria-expanded', historyPickerOpen ? 'true' : 'false');
    toggle.setAttribute('aria-controls', 'historyPicker');
    toggle.innerHTML = `
        <span class="card-title">${escapeHtml(title)}</span>
        <span class="collapsible-icon" id="historyPickerIcon" aria-hidden="true">${historyPickerOpen ? '▴' : '▾'}</span>
    `;
    toggle.onclick = onToggle;

    const body = document.createElement('div');
    body.className = 'collapsible-content history-picker-body';
    body.id = 'historyPicker';
    body.hidden = !historyPickerOpen;
    if (historyPickerOpen) {
        renderBody(body);
    }

    picker.appendChild(toggle);
    picker.appendChild(body);
    return picker;
}

function toggleHistoryPicker() {
    historyPickerOpen = !historyPickerOpen;
    loadShifts();
}

function shiftCalendarMonth(delta) {
    ensureCalendarCursor(getHistoryGroupBy());
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + delta, 1);
    historyPickerOpen = true;
    loadShifts();
}

function shiftCalendarYear(delta) {
    ensureCalendarCursor(getHistoryGroupBy());
    calendarCursor = new Date(calendarCursor.getFullYear() + delta, 0, 1);
    historyPickerOpen = true;
    loadShifts();
}

function selectHistoryWeek(date) {
    const monday = getMonday(date);
    saveSelectedWeekMonday(monday);
    calendarCursor = new Date(monday.getFullYear(), monday.getMonth(), 1);
    loadShifts();
}

function selectHistoryMonth(monthKey) {
    saveSelectedMonthKey(monthKey);
    calendarCursor = parseMonthKey(monthKey);
    loadShifts();
}

function stepHistoryWeek(delta) {
    const monday = getSelectedWeekMonday();
    const next = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + (delta * 7));
    saveSelectedWeekMonday(getMonday(next));
    calendarCursor = new Date(next.getFullYear(), next.getMonth(), 1);
    loadShifts();
}

function stepHistoryMonth(delta) {
    const current = parseMonthKey(getSelectedMonthKey());
    const next = new Date(current.getFullYear(), current.getMonth() + delta, 1);
    saveSelectedMonthKey(getMonthKey(next));
    calendarCursor = new Date(next.getFullYear(), next.getMonth(), 1);
    loadShifts();
}

function renderWeekHistory(container, shifts, newestFirst) {
    ensureCalendarCursor('week');
    const monday = getSelectedWeekMonday();
    const weekShifts = getShiftsInWeek(shifts, monday).sort((a, b) => compareShiftsByDate(a, b, newestFirst));
    const otherWeeks = getWeeksWithShifts(shifts, newestFirst).filter(week => week.key !== toISODate(monday));

    const periodNav = {
        title: formatWeekRange(monday),
        subtitle: 'Work week · Monday–Sunday',
        totalsText: formatPeriodTotals(weekShifts),
        onPrev: () => stepHistoryWeek(-1),
        onNext: () => stepHistoryWeek(1)
    };
    setHistoryPeriodBrowser(periodNav);

    const section = document.createElement('div');
    section.className = 'history-period';
    section.appendChild(createPeriodNav(periodNav));

    if (weekShifts.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No shifts in this work week.';
        section.appendChild(empty);
    } else {
        weekShifts.forEach(shift => section.appendChild(createShiftCard(shift)));
    }

    if (otherWeeks.length > 0) {
        const heading = document.createElement('h3');
        heading.className = 'history-picker-heading';
        heading.textContent = 'Other weeks';
        section.appendChild(heading);

        const list = document.createElement('div');
        list.className = 'week-choice-list';
        otherWeeks.forEach(week => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'week-choice';
            button.innerHTML = `
                <span class="week-choice-title">${escapeHtml(formatWeekRange(week.monday))}</span>
                <span class="week-choice-meta">${escapeHtml(formatPeriodTotals(week.shifts))}</span>
            `;
            button.onclick = () => selectHistoryWeek(week.monday);
            list.appendChild(button);
        });
        section.appendChild(list);
    }

    section.appendChild(createHistoryPicker({
        title: 'Calendar',
        onToggle: toggleHistoryPicker,
        renderBody: body => {
            body.appendChild(renderWeekCalendar(shifts, monday));
        }
    }));

    container.appendChild(section);
}

function renderMonthHistory(container, shifts, newestFirst) {
    ensureCalendarCursor('month');
    const monthKey = getSelectedMonthKey();
    const monthDate = parseMonthKey(monthKey);
    const monthShifts = getShiftsInMonth(shifts, monthKey).sort((a, b) => compareShiftsByDate(a, b, newestFirst));

    const periodNav = {
        title: formatMonthLabel(monthKey),
        subtitle: 'Calendar month',
        totalsText: formatPeriodTotals(monthShifts),
        onPrev: () => stepHistoryMonth(-1),
        onNext: () => stepHistoryMonth(1)
    };
    setHistoryPeriodBrowser(periodNav);

    const section = document.createElement('div');
    section.className = 'history-period';
    section.appendChild(createPeriodNav(periodNav));

    if (monthShifts.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No shifts in this month.';
        section.appendChild(empty);
    } else {
        monthShifts.forEach(shift => section.appendChild(createShiftCard(shift)));
    }

    section.appendChild(createHistoryPicker({
        title: 'Calendar',
        onToggle: toggleHistoryPicker,
        renderBody: body => {
            body.appendChild(renderMonthCalendar(shifts, monthKey));
        }
    }));

    container.appendChild(section);
}

function renderWeekCalendar(shifts, selectedMonday) {
    const wrap = document.createElement('div');
    wrap.className = 'history-calendar';

    const cursor = calendarCursor || new Date(selectedMonday.getFullYear(), selectedMonday.getMonth(), 1);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const selectedKey = toISODate(selectedMonday);
    const selectedEnd = toISODate(getSunday(selectedMonday));
    const shiftDates = new Set(shifts.map(shift => shift.date));
    const todayKey = toISODate(new Date());

    const header = document.createElement('div');
    header.className = 'calendar-header';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'icon-button';
    prev.setAttribute('aria-label', 'Previous month');
    prev.textContent = '‹';
    prev.onclick = () => shiftCalendarMonth(-1);

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'icon-button';
    next.setAttribute('aria-label', 'Next month');
    next.textContent = '›';
    next.onclick = () => shiftCalendarMonth(1);

    const label = document.createElement('div');
    label.className = 'calendar-label';
    label.textContent = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    header.appendChild(prev);
    header.appendChild(label);
    header.appendChild(next);

    const weekdays = document.createElement('div');
    weekdays.className = 'calendar-weekdays';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day => {
        const cell = document.createElement('div');
        cell.textContent = day;
        weekdays.appendChild(cell);
    });

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    const first = new Date(year, month, 1);
    const start = getMonday(first);
    const last = new Date(year, month + 1, 0);
    const end = getSunday(last);

    for (let cursorDay = new Date(start); cursorDay <= end; cursorDay.setDate(cursorDay.getDate() + 1)) {
        const date = new Date(cursorDay.getFullYear(), cursorDay.getMonth(), cursorDay.getDate());
        const key = toISODate(date);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'calendar-day';
        if (date.getMonth() !== month) button.classList.add('outside');
        if (key >= selectedKey && key <= selectedEnd) button.classList.add('in-week');
        if (shiftDates.has(key)) button.classList.add('has-shifts');
        if (key === todayKey) button.classList.add('today');
        button.textContent = String(date.getDate());
        button.setAttribute('aria-label', date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }));
        button.onclick = () => selectHistoryWeek(date);
        grid.appendChild(button);
    }

    wrap.appendChild(header);
    wrap.appendChild(weekdays);
    wrap.appendChild(grid);
    return wrap;
}

function renderMonthCalendar(shifts, selectedMonthKey) {
    const wrap = document.createElement('div');
    wrap.className = 'history-calendar';

    const cursor = calendarCursor || parseMonthKey(selectedMonthKey);
    const year = cursor.getFullYear();
    const monthsWithShifts = new Set(getMonthsWithShifts(shifts, true).map(month => month.key));

    const header = document.createElement('div');
    header.className = 'calendar-header';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'icon-button';
    prev.setAttribute('aria-label', 'Previous year');
    prev.textContent = '‹';
    prev.onclick = () => shiftCalendarYear(-1);

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'icon-button';
    next.setAttribute('aria-label', 'Next year');
    next.textContent = '›';
    next.onclick = () => shiftCalendarYear(1);

    const label = document.createElement('div');
    label.className = 'calendar-label';
    label.textContent = String(year);

    header.appendChild(prev);
    header.appendChild(label);
    header.appendChild(next);

    const grid = document.createElement('div');
    grid.className = 'month-grid';

    for (let month = 0; month < 12; month += 1) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'month-choice';
        if (key === selectedMonthKey) button.classList.add('active');
        if (monthsWithShifts.has(key)) button.classList.add('has-shifts');
        button.textContent = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' });
        button.onclick = () => selectHistoryMonth(key);
        grid.appendChild(button);
    }

    wrap.appendChild(header);
    wrap.appendChild(grid);
    return wrap;
}

function groupShifts(shifts, groupBy, newestFirst) {
    const grouped = new Map();

    shifts.forEach(shift => {
        const shiftDate = parseLocalDate(shift.date);
        let key;
        let title;
        let subtitle;
        let sortValue;

        if (groupBy === 'week') {
            const monday = getMonday(shiftDate);
            key = toISODate(monday);
            title = formatWeekRange(monday);
            subtitle = 'Work week · Monday–Sunday';
            sortValue = monday.getTime();
        } else if (groupBy === 'month') {
            key = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}`;
            title = formatMonthLabel(key);
            subtitle = 'Calendar month';
            sortValue = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), 1).getTime();
        } else {
            key = shift.venue || 'Unknown venue';
            title = key;
            subtitle = 'Venue';
            sortValue = key.toLowerCase();
        }

        if (!grouped.has(key)) {
            grouped.set(key, {
                key,
                title,
                subtitle,
                sortValue,
                shifts: [],
                hours: 0,
                tips: 0
            });
        }

        const group = grouped.get(key);
        const totals = getShiftTotals(shift);
        group.shifts.push(shift);
        group.hours += totals.hours;
        group.tips += totals.totalTips;
    });

    const groups = Array.from(grouped.values());

    if (groupBy === 'venue') {
        groups.sort((a, b) => a.sortValue.localeCompare(b.sortValue));
    } else {
        groups.sort((a, b) => newestFirst ? b.sortValue - a.sortValue : a.sortValue - b.sortValue);
    }

    groups.forEach(group => {
        group.shifts.sort((a, b) => compareShiftsByDate(a, b, newestFirst));
    });

    return groups;
}

function getWeeklyDuebackSummaries(shifts) {
    const weeks = new Map();

    shifts.forEach(shift => {
        const dueback = Number(shift.duebackTips) || 0;
        if (dueback <= 0) return;

        const monday = getMonday(parseLocalDate(shift.date));
        const key = toISODate(monday);

        if (!weeks.has(key)) {
            weeks.set(key, {
                key,
                monday,
                title: formatWeekRange(monday),
                total: 0,
                byVenue: {},
                count: 0
            });
        }

        const week = weeks.get(key);
        week.total += dueback;
        week.count += 1;
        week.byVenue[shift.venue] = (week.byVenue[shift.venue] || 0) + dueback;
    });

    return Array.from(weeks.values()).sort((a, b) => b.monday - a.monday);
}

function loadWeeklyDuebacks(shifts) {
    const section = document.getElementById('duebacksSection');
    const container = document.getElementById('duebacksContainer');
    const outstanding = document.getElementById('duebacksOutstanding');

    if (!section || !container || !outstanding) return;

    const weeks = getWeeklyDuebackSummaries(shifts);
    const collectedWeeks = getCollectedDuebacks();

    if (weeks.length === 0) {
        outstanding.textContent = '';
        container.innerHTML = '<p class="empty-state">No duebacks recorded yet.</p>';
        return;
    }

    const uncollectedTotal = weeks.reduce((sum, week) => {
        return collectedWeeks[week.key] ? sum : sum + week.total;
    }, 0);

    outstanding.textContent = uncollectedTotal > 0
        ? `$${formatCurrency(uncollectedTotal)} uncollected`
        : 'All duebacks collected';

    container.innerHTML = '';
    weeks.forEach(week => {
        const collected = Boolean(collectedWeeks[week.key]);
        const venueBreakdown = Object.entries(week.byVenue)
            .map(([venue, amount]) => `${venue} $${formatCurrency(amount)}`)
            .join(' · ');

        const row = document.createElement('div');
        row.className = collected ? 'dueback-week collected' : 'dueback-week';
        row.innerHTML = `
            <div class="dueback-week-top">
                <label class="dueback-check">
                    <input type="checkbox" ${collected ? 'checked' : ''} onchange="toggleWeekDuebacksCollected('${week.key}', this.checked)">
                    <span>Collected</span>
                </label>
                <div class="dueback-week-copy">
                    <div class="dueback-week-title">${week.title}</div>
                    <div class="dueback-week-amount">$${formatCurrency(week.total)}</div>
                    <div class="dueback-week-venues">${week.count} shift${week.count === 1 ? '' : 's'} · ${venueBreakdown}</div>
                    <div class="dueback-week-status">${collected ? 'Collected' : 'Not collected'}</div>
                </div>
            </div>
        `;
        container.appendChild(row);
    });
}

function toggleWeekDuebacksCollected(weekKey, collected) {
    setWeekDuebacksCollected(weekKey, collected);
    loadWeeklyDuebacks(getShifts());
}

function getWeekdayName(dateStr) {
    return parseLocalDate(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

function getPeerShifts(shift, allShifts) {
    const weekday = parseLocalDate(shift.date).getDay();
    return allShifts.filter(other =>
        other.venue === shift.venue &&
        parseLocalDate(other.date).getDay() === weekday &&
        other.timestamp !== shift.timestamp
    );
}

function getPeerAverages(peerShifts) {
    if (peerShifts.length === 0) return null;

    let totalHours = 0;
    let totalEarnings = 0;

    peerShifts.forEach(shift => {
        const totals = getShiftTotals(shift);
        totalHours += totals.hours;
        totalEarnings += totals.earnings;
    });

    return {
        count: peerShifts.length,
        hours: totalHours / peerShifts.length,
        earnings: totalEarnings / peerShifts.length,
        hourlyRate: totalHours > 0 ? totalEarnings / totalHours : 0
    };
}

function scoreAgainstAverage(value, average) {
    if (average == null || average <= 0) return 50;
    return Math.max(0, Math.min(100, (value / average) * 50));
}

function getCompareColor(value, average) {
    if (average == null || average <= 0) return 'neutral';
    const ratio = value / average;
    if (ratio >= 1.08) return 'green';
    if (ratio >= 0.92) return 'yellow';
    return 'red';
}

function formatDelta(value, average, { money = false, suffix = '' } = {}) {
    if (average == null) return 'No other matching shifts yet';

    const diff = value - average;
    const percent = average === 0 ? 0 : (diff / average) * 100;
    const sign = percent > 0 ? '+' : '';
    const formattedValue = money ? `$${formatCurrency(value)}` : `${formatCurrency(value)}${suffix}`;
    const formattedAvg = money ? `$${formatCurrency(average)}` : `${formatCurrency(average)}${suffix}`;

    return `${formattedValue} vs ${formattedAvg} avg (${sign}${percent.toFixed(0)}%)`;
}

function createComparisonBar(label, valueText, score, color, caption) {
    return `
        <div class="health-bar-item">
            <div class="health-bar-label">
                <span>${label}</span>
                <span class="health-bar-value">${valueText}</span>
            </div>
            <div class="health-bar-container">
                <div class="health-bar-avg-mark" title="Average"></div>
                <div class="health-bar health-bar-${color}" style="width: ${score}%"></div>
            </div>
            <div class="health-bar-caption">${caption}</div>
        </div>
    `;
}

function createShiftCard(shift) {
    const card = document.createElement('div');
    card.className = 'record-card';

    const totals = getShiftTotals(shift);
    const weekday = getWeekdayName(shift.date);
    const peerLabel = `${weekday}s at ${shift.venue}`;
    const averages = getPeerAverages(getPeerShifts(shift, getShifts()));
    const hasPeers = averages !== null;

    const hourlyScore = scoreAgainstAverage(totals.hourlyRate, averages && averages.hourlyRate);
    const earningsScore = scoreAgainstAverage(totals.earnings, averages && averages.earnings);
    const hoursScore = scoreAgainstAverage(totals.hours, averages && averages.hours);

    const peerCaption = hasPeers
        ? `Compared with ${averages.count} other ${peerLabel}`
        : `First ${weekday} at ${shift.venue}`;

    card.innerHTML = `
        <div class="record-header">
            <div>
                <div class="record-date">${formatDate(shift.date)}</div>
                <div class="record-venue">${shift.venue}</div>
            </div>
            <div class="record-actions">
                <button onclick="editShift('${shift.timestamp}')" class="btn btn-secondary btn-small">Edit</button>
                <button onclick="deleteShift('${shift.timestamp}')" class="btn btn-danger btn-small">Delete</button>
            </div>
        </div>
        <div class="health-bars">
            ${createComparisonBar(
                `Hourly · ${peerLabel}`,
                `$${formatCurrency(totals.hourlyRate)}/hr`,
                hourlyScore,
                getCompareColor(totals.hourlyRate, averages && averages.hourlyRate),
                hasPeers ? formatDelta(totals.hourlyRate, averages.hourlyRate, { money: true }) : peerCaption
            )}
            ${createComparisonBar(
                `Earnings · ${peerLabel}`,
                `$${formatCurrency(totals.earnings)}`,
                earningsScore,
                getCompareColor(totals.earnings, averages && averages.earnings),
                hasPeers ? formatDelta(totals.earnings, averages.earnings, { money: true }) : peerCaption
            )}
            ${createComparisonBar(
                `Hours · ${peerLabel}`,
                `${formatCurrency(totals.hours)}h`,
                hoursScore,
                'neutral',
                hasPeers ? formatDelta(totals.hours, averages.hours, { suffix: 'h' }) : peerCaption
            )}
        </div>
        <div class="record-stats">
            <div class="stat-item">
                <div class="stat-label">Cash Tips</div>
                <div class="stat-value">$${formatCurrency(totals.cashTips)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Dueback Tips</div>
                <div class="stat-value">$${formatCurrency(totals.duebackTips)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Tips</div>
                <div class="stat-value highlight">$${formatCurrency(totals.totalTips)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Hours Worked</div>
                <div class="stat-value">${formatCurrency(totals.hours)}h</div>
                <div class="stat-average">${hasPeers ? `avg ${formatCurrency(averages.hours)}h on ${peerLabel}` : `No ${peerLabel} average yet`}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Hourly Rate</div>
                <div class="stat-value highlight">$${formatCurrency(totals.hourlyRate)}/hr</div>
                <div class="stat-average">${hasPeers ? `avg $${formatCurrency(averages.hourlyRate)}/hr` : 'No matching average yet'}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Shift Earnings</div>
                <div class="stat-value highlight">$${formatCurrency(totals.earnings)}</div>
                <div class="stat-average">${hasPeers ? `avg $${formatCurrency(averages.earnings)}` : 'No matching average yet'}</div>
            </div>
        </div>
        ${shift.note ? `<p class="shift-note">“${escapeHtml(shift.note)}”</p>` : ''}
    `;

    return card;
}

function formatCurrency(value) {
    return Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function calculateStats(period) {
    const shifts = getShifts();
    if (shifts.length === 0) return null;

    const now = new Date();
    let startDate;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
        case 'week': {
            startDate = getMonday(now);
            endDate = getSunday(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
        }
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'all':
            startDate = new Date(0);
            break;
        default:
            startDate = new Date(0);
    }

    const filteredShifts = shifts.filter(shift => {
        const shiftDate = parseLocalDate(shift.date);
        return shiftDate >= startDate && shiftDate <= endDate;
    });

    if (filteredShifts.length === 0) return null;

    let totalEarnings = 0;
    let totalTips = 0;
    let totalHours = 0;

    filteredShifts.forEach(shift => {
        const totals = getShiftTotals(shift);
        totalEarnings += totals.earnings;
        totalTips += totals.totalTips;
        totalHours += totals.hours;
    });

    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
    const avgEarningsPerShift = filteredShifts.length > 0 ? totalEarnings / filteredShifts.length : 0;

    return {
        period,
        shifts: filteredShifts.length,
        totalEarnings,
        totalTips,
        totalHours,
        avgHourlyRate,
        avgEarningsPerShift
    };
}


function handleSubmit(event) {
    event.preventDefault();
    saveShiftFromForm({ exportJson: false });
}

function handleSaveAndExport() {
    saveShiftFromForm({ exportJson: true });
}

function getShiftFormData() {
    const note = document.getElementById('shiftNote').value.trim();
    return {
        date: document.getElementById('date').value,
        venue: document.getElementById('venue').value,
        hours: parseFloat(document.getElementById('hours').value),
        cashTips: parseFloat(document.getElementById('cashTips').value),
        duebackTips: parseFloat(document.getElementById('duebackTips').value),
        note
    };
}

async function saveShiftFromForm({ exportJson = false } = {}) {
    const form = document.getElementById('shiftForm');
    if (!form.reportValidity()) return false;

    const values = getShiftFormData();
    const shifts = getShifts();
    const wasEditing = Boolean(editingTimestamp);

    if (editingTimestamp) {
        const index = shifts.findIndex(shift => shift.timestamp === editingTimestamp);
        if (index === -1) {
            await showAppAlert('That shift could not be found.');
            return false;
        }

        const updated = {
            ...shifts[index],
            ...values,
            timestamp: shifts[index].timestamp
        };
        if (!updated.note) delete updated.note;
        shifts[index] = updated;
    } else {
        const shift = {
            ...values,
            timestamp: new Date().toISOString()
        };
        if (!shift.note) delete shift.note;
        shifts.push(shift);
    }

    saveShifts(shifts);

    if (values.duebackTips > 0) {
        const weekKey = toISODate(getMonday(parseLocalDate(values.date)));
        clearWeekDuebacksCollected(weekKey);
    }

    resetShiftForm();
    loadShifts();

    if (exportJson) {
        exportData();
        await showAppAlert(wasEditing ? 'Shift updated and exported.' : 'Shift saved and exported.');
    } else {
        await showAppAlert(wasEditing ? 'Shift updated.' : 'Shift saved successfully!');
    }

    return true;
}

function editShift(timestamp) {
    const shift = getShifts().find(item => item.timestamp === timestamp);
    if (!shift) return;

    editingTimestamp = timestamp;
    document.getElementById('date').value = shift.date;
    document.getElementById('venue').value = shift.venue;
    document.getElementById('hours').value = shift.hours;
    document.getElementById('cashTips').value = shift.cashTips;
    document.getElementById('duebackTips').value = shift.duebackTips;
    document.getElementById('shiftNote').value = shift.note || '';
    document.getElementById('shiftFormTitle').textContent = 'Edit Shift';
    document.getElementById('saveShiftButton').textContent = 'Save Changes';
    document.getElementById('cancelEditButton').hidden = false;
    setShiftFormCollapsed(false);
    document.getElementById('shiftFormSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
    resetShiftForm();
}

function resetShiftForm() {
    editingTimestamp = null;
    document.getElementById('shiftForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('shiftNote').value = '';
    document.getElementById('shiftFormTitle').textContent = 'Log New Shift';
    document.getElementById('saveShiftButton').textContent = 'Save Shift';
    document.getElementById('cancelEditButton').hidden = true;
    setShiftFormCollapsed(true);
}

async function deleteShift(timestamp) {
    const confirmed = await showAppConfirm('Are you sure you want to delete this shift?');
    if (!confirmed) return;

    const shifts = getShifts();
    const filtered = shifts.filter(shift => shift.timestamp !== timestamp);
    saveShifts(filtered);
    if (editingTimestamp === timestamp) resetShiftForm();
    loadShifts();
}

function updateMinWage() {
    const wageInput = document.getElementById('minWage');
    const wage = parseFloat(wageInput.value);
    if (wage >= 0) {
        saveMinWage(wage);
        renderVenueList();
        loadShifts();
    }
}

function downloadFile(filename, contents, type) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeCsv(value) {
    const text = value == null ? '' : String(value);
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function exportData() {
    const data = {
        currentName: getCurrentName(),
        profiles: getProfiles(),
        shifts: getShifts(),
        minWage: getMinWage(),
        collectedDuebacks: getCollectedDuebacks(),
        theme: getTheme(),
        exportDate: new Date().toISOString()
    };

    const dateStamp = new Date().toISOString().split('T')[0];
    const namePart = getCurrentName().replace(/\s+/g, '_');
    downloadFile(
        `${namePart}_shiftStats_${dateStamp}.json`,
        JSON.stringify(data, null, 2),
        'application/json'
    );
}

function exportCsv() {
    const shifts = [...getShifts()].sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
    const headers = ['Date', 'Venue', 'Hours', 'Cash Tips', 'Dueback Tips', 'Total Tips', 'Note'];
    const rows = shifts.map(shift => {
        const cashTips = Number(shift.cashTips) || 0;
        const duebackTips = Number(shift.duebackTips) || 0;
        return [
            shift.date,
            shift.venue,
            shift.hours,
            cashTips,
            duebackTips,
            cashTips + duebackTips,
            shift.note || ''
        ].map(escapeCsv).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const dateStamp = new Date().toISOString().split('T')[0];
    const namePart = getCurrentName().replace(/\s+/g, '_');
    downloadFile(`${namePart}_shifts_${dateStamp}.csv`, csv, 'text/csv');
}

async function clearCache() {
    const confirmed = await showAppConfirm(
        'This will delete all names, shifts, settings, and dueback checkmarks saved in this browser. This cannot be undone unless you have an exported file. Continue?'
    );
    if (!confirmed) return;

    localStorage.clear();
    location.reload();
}

function importData() {
    document.getElementById('importFile').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const confirmed = await showAppConfirm('This will replace all current data. Are you sure?');
            if (!confirmed) return;

            if (data.profiles) {
                saveProfiles(data.profiles);
                if (data.currentName) setCurrentName(data.currentName);
            } else {
                if (data.shifts) {
                    saveShifts(data.shifts);
                }
                if (data.minWage) {
                    saveMinWage(data.minWage);
                }
                if (data.collectedDuebacks) {
                    saveCollectedDuebacks(data.collectedDuebacks);
                }
            }
            if (data.theme) {
                setTheme(data.theme);
            }

            document.getElementById('minWage').value = getMinWage();
            renderSavedNames();
            renderThemeOptions();
            renderVenueList();
            updateActiveNameDisplay();
            loadVenues();
            loadShifts();
            await showAppAlert('Data imported successfully!');
        } catch (error) {
            await showAppAlert('Error importing data: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

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

function showStatsPeriod(period) {
    currentStatsPeriod = period;
    const stats = calculateStats(period);
    const statsContent = document.getElementById('statsContentInner');
    const tabs = document.querySelectorAll('.stat-tab');

    if (!statsContent) return;

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

    statsContent.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-label">Total Shifts</div>
                <div class="stat-card-value">${stats.shifts}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Total Earnings</div>
                <div class="stat-card-value">$${formatCurrency(stats.totalEarnings)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Total Tips</div>
                <div class="stat-card-value">$${formatCurrency(stats.totalTips)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Avg/Hour</div>
                <div class="stat-card-value">$${formatCurrency(stats.avgHourlyRate)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Total Hours</div>
                <div class="stat-card-value">${formatCurrency(stats.totalHours)}h</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Avg/Shift</div>
                <div class="stat-card-value">$${formatCurrency(stats.avgEarningsPerShift)}</div>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    applyTheme(getTheme());
    updateNavOffset();
    window.addEventListener('resize', updateNavOffset);

    document.getElementById('minWage').addEventListener('change', updateMinWage);
    document.getElementById('profileName').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitNameChange();
        }
    });
    document.getElementById('newVenue').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addVenue();
        }
    });
    document.addEventListener('click', function(event) {
        const menu = document.querySelector('.nav-menu');
        if (menu && !menu.contains(event.target)) {
            closeNavMenu();
        }
    });
    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') return;
        const dialog = document.getElementById('appDialog');
        if (dialog && !dialog.hidden) {
            closeAppDialog(false);
            return;
        }
        closeNavMenu();
    });

    applyNavPanelVisibility();

    if (needsNamePrompt()) {
        showNamePrompt();
        return;
    }

    startApp();
});
