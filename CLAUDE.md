# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static web application for displaying student admission statistics for SMP (academic institution) for the year 2025-26. The application is a single-page HTML file that reads student data from a CSV file and presents it through an interactive dashboard.

## File Structure

- `index.html` - Main application file (~4,767 lines) containing HTML, CSS, and JavaScript
- `students.csv` - Student data file with admission details, fees, and course information
- `jsonbin.io.txt` - Configuration notes for external storage service

## Architecture

### Core Components

The application is built as a single-page application with the following key sections:

1. **Data Loading System** - Loads student data from `students.csv` using Papa Parse library
2. **Dashboard Interface** - Three main views:
   - Statistics view with summary tables and charts
   - Student list with filtering capabilities
   - Fee dues list with payment tracking
3. **Theme System** - Light/dark mode toggle with CSS custom properties
4. **Data Persistence** - Optional JSONBin.io integration for cross-user message storage

### Key JavaScript Functions

The application includes several main functional areas:
- CSV parsing and data processing
- Student filtering and search
- Fee calculation and dues tracking
- PDF export functionality using jsPDF
- Interactive charts and visualizations
- Theme management

### Data Model

Student records contain fields including:
- Basic info: Student Name, Father Name, Registration Number
- Academic: Year, Course (CS/CE/EC/ME/EE), Admission Type (REGULAR/LTRL/SNQ/RPTR)
- Financial: Various fee categories (SMP, SVK, Tuition, Library, etc.)
- Status: Payment status, remarks, in/out status

## Development Workflow

### Running the Application

This is a static web application that can be run by:
1. Opening `index.html` in a web browser
2. Serving via any static web server (e.g., `python -m http.server`)
3. Deploying to GitHub Pages or similar static hosting

### No Build Process

The application requires no build step, compilation, or dependencies installation. All external libraries are loaded via CDN:
- Papa Parse for CSV parsing
- jsPDF for PDF generation
- Google Fonts for typography

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

### External Storage (Optional)

The application supports JSONBin.io integration for persistent message storage:
- Configure `JSONBIN_API_KEY` and `JSONBIN_BIN_ID` in the JavaScript
- Enables cross-user message updates
- Falls back to local storage if not configured

## Key Features

- Real-time student statistics and analytics
- Interactive filtering by course, year, and admission type
- Fee dues tracking and payment status
- PDF export for reports
- Responsive design for mobile and desktop
- Dark/light theme toggle
- Scrolling announcements with edit capability