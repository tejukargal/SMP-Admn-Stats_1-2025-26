# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static web application for displaying student admission statistics for SMP (academic institution) for the year 2025-26. The application is a single-page HTML file that reads student data from a CSV file and presents it through an interactive dashboard.

## File Structure

- `index.html` - Main application file containing HTML structure and DOM manipulation
- `script.js` - JavaScript application logic and data processing functions
- `style.css` - CSS styles with theme system and responsive design
- `students.csv` - Student data file with admission details, fees, and course information
- `Previous Students.csv` - Historical student data for comparison
- `start-server.bat` - Local development server launcher (Python HTTP server)
- `jsonhost.com.txt` - Configuration notes for JSONHost.com external storage service

## Architecture

### Core Components

The application is built as a single-page application with the following key sections:

1. **Data Loading System** - Loads student data from `students.csv` using Papa Parse library
2. **Dashboard Interface** - Seven main views:
   - Statistics view with summary tables and interactive charts
   - Student list with filtering and selection capabilities
   - Exam Fee management with payment tracking
   - Fee Dues list with payment status
   - Fee List with detailed fee breakdown
   - Fee Statistics with analytical insights
   - Not Admitted list for rejected applications
3. **Theme System** - Light/dark mode toggle with CSS custom properties
4. **Data Persistence** - Dual JSONHost.com endpoints for message and exam fee storage

### Key JavaScript Functions

The application includes several main functional areas:
- CSV parsing and data processing
- Student filtering and search
- Fee calculation and dues tracking
- PDF export functionality using jsPDF
- Interactive charts and visualizations
- Theme management

### Data Model

#### Student CSV Structure (35+ columns)
- **Basic Info**: Sl No, Student Name, Father Name, Registration Number  
- **Academic**: Year, Course (CS/CE/EC/ME/EE), Category, Admission Type (REGULAR/LTRL/SNQ/RPTR)
- **Financial**: Alloted Fee SMP/SVK, Paid amounts, individual fee categories:
  - Core: Admission, Tuition, Library, RR, Sports, Lab fees
  - Additional: DVP, Magazine, ID, Association, SWF, TWF, NSS, Fine
- **Status**: Date, In/Out status, Remarks, Academic Year (2025-26)

#### Global Data Arrays
- `studentsData[]` - Main filtered student list
- `allStudentsData[]` - Complete student dataset  
- `duesData[]` - Students with pending fee payments
- `examFeeData[]` - Exam fee specific records
- `previousStudentsData[]` - Historical student data
- `notAdmittedData[]` - Rejected applications

#### Key Constants
- `TOTAL_INTAKE_PER_COURSE = 63` - Maximum student capacity per course
- Course codes: CS, CE, EC, ME, EE
- Admission types: REGULAR, LTRL (Lateral), SNQ, RPTR (Repeater)

## Development Commands

### Running the Application

Use the provided batch file for local development:
```bash
# Windows
start-server.bat

# Manual server start (cross-platform)
python -m http.server 8000
```

Then open: http://localhost:8000

Alternative methods:
1. Opening `index.html` directly in a web browser (limited functionality due to CORS)
2. Deploying to GitHub Pages or similar static hosting

### Development Workflow

### No Build Process

The application requires no build step, compilation, or dependencies installation. All external libraries are loaded via CDN:
- **Papa Parse 5.4.1**: CSV parsing and data loading
- **jsPDF 2.5.1 + AutoTable 3.5.23**: PDF export functionality  
- **SheetJS 0.18.5**: Excel export capabilities
- **Google Fonts (Inter)**: Typography system

### Data Updates

To update student data:
1. Edit `students.csv` with new student records
2. Ensure CSV format matches existing structure
3. Refresh the web application to load new data

### Theme Customization

The application uses CSS custom properties (variables) for theming:
- Primary colors: `--primary-color`, `--secondary-color`, `--accent-color`
- Course-specific colors: `--cs-color`, `--ce-color`, `--ec-color`, `--me-color`, `--ee-color`
- Light/dark mode variants for all UI elements

### External Storage Architecture

The application uses JSONHost.com for persistent data storage across two separate endpoints:

#### Message Storage
- **API Key**: `JSONHOST_API_KEY` in `script.js:19`
- **JSON ID**: `JSONHOST_JSON_ID` in `script.js:20`
- **Purpose**: Cross-user scrolling message updates
- **Functions**: `loadMessagesFromServer()`, `saveMessagesToServer()`

#### Exam Fee Storage  
- **API Key**: `JSONHOST_EXAMFEE_API_KEY` in `script.js:23`
- **JSON ID**: `JSONHOST_EXAMFEE_JSON_ID` in `script.js:24`
- **Purpose**: Persistent exam fee payment tracking
- **Fallback**: Local storage when server unavailable

## Key Features

- Real-time student statistics and analytics
- Interactive filtering by course, year, and admission type
- Fee dues tracking and payment status
- PDF export for reports
- Responsive design for mobile and desktop
- Dark/light theme toggle
- Scrolling announcements with edit capability