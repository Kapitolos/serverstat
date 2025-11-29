# ShiftStats - Bartending Shift Tracker

A beautiful, modern web application for tracking your bartending shifts, tips, and earnings. Perfect for bartenders who want to keep detailed records of their work.

## Features

- 📊 **Track Shift Data**: Record gross sales, cash tips, dueback tips, hours worked, and more
- 👥 **Employee Management**: Maintain a list of coworkers and track who you worked with each shift
- 🏢 **Venue Tracking**: Keep track of different venues you work at
- 💰 **Automatic Calculations**: 
  - Total tips (cash + dueback)
  - Hourly rate (including tips)
  - Tip percentage of gross sales
- 💾 **Data Persistence**: All data is stored locally in your browser using localStorage
- 📤 **Export/Import**: Backup and restore your data as JSON files
- 📱 **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices

## Getting Started

### Option 1: Use on GitHub Pages (Recommended)

1. Fork or clone this repository
2. Push the code to your GitHub repository
3. Go to your repository settings
4. Navigate to "Pages" in the left sidebar
5. Under "Source", select your main branch (usually `main` or `master`)
6. Click "Save"
7. Your site will be available at `https://yourusername.github.io/ShiftStats/`

### Option 2: Use Locally

1. Clone or download this repository
2. Open `index.html` in your web browser
3. That's it! No server required.

## How to Use

### First Time Setup

1. **Set Minimum Wage**: Update the Ontario minimum wage in the Settings panel (default is $16.55/hour)
2. **Add Employees**: Enter employee names in the Settings panel to build your coworker list
3. **Add Venues**: Enter venue names where you work

### Logging a Shift

1. Fill out the "Log New Shift" form:
   - Select the date
   - Choose the venue
   - Enter hours worked
   - Enter gross sales
   - Enter cash tips and dueback tips
   - Check off who you worked with
2. Click "Save Shift"
3. Your shift will appear in the Shift History section with all calculations displayed

### Viewing Your Data

Each shift record shows:
- Date and venue
- Gross sales
- Cash tips, dueback tips, and total tips
- Hours worked
- **Hourly rate** (wage + tips per hour)
- **Tip percentage** (tips as % of gross sales)
- List of coworkers you worked with

### Managing Your Data

- **Export Data**: Click "Export Data" to download a JSON backup file
- **Import Data**: Click "Import Data" to restore from a backup file
- **Clear All**: Use with caution! This permanently deletes all your data

## Data Storage

This application uses **localStorage** to store all your data in your browser. This means:
- ✅ Your data stays private (never leaves your computer)
- ✅ Works offline
- ✅ No account or login required
- ⚠️ Data is stored per browser/device
- ⚠️ Clearing browser data will delete your records

**Important**: Make regular backups using the Export feature!

## Future Expansion

The data structure is designed to be easily expandable. When you're ready to add features like:
- Charts and graphs
- Monthly/yearly summaries
- Tax calculations
- Multiple user support
- Cloud backup

You can export your data and migrate it to a more advanced system.

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## License

Free to use and modify for personal use.

---

**Note**: This app uses localStorage, so your data is stored locally in your browser. If you clear your browser data or use a different browser/device, you'll need to import your backup file.

