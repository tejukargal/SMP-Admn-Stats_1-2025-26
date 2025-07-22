let studentsData = [];
let allStudentsData = []; // Store all students including those with dues
let filteredData = [];
let filteredDuesData = [];
let duesData = [];
let previousStudentsData = []; // Store previous year students
let notAdmittedData = [];
let filteredNotAdmittedData = [];
let popupTimer = null;
let messageIndex = 0;
const TOTAL_INTAKE_PER_COURSE = 63;

// JSONhost configuration for persistent storage
const JSONHOST_API_KEY = 'w1he0onjv4fssfinwxquhoxif3z1llcw'; // Replace with your JSONhost API token
const JSONHOST_JSON_ID = '1a167691ed974abc8def5c4d486b7a23'; // Replace with your JSON ID from JSONhost

// Default scrolling messages (fallback)
let scrollingMessages = [
    "📅 Last date for fee payment: 31st March 2025 | 💰 Late fee charges applicable after due date",
    "📋 Submit original documents by 15th April 2025 | 🏛️ Visit college office during working hours",
    "🎓 Final semester exam registration opens 1st May 2025 | 📚 Ensure all dues are cleared before registration"
];

// Load messages from JSONhost on startup
async function loadMessagesFromServer() {
    try {
        const response = await fetch(`https://jsonhost.com/json/${JSONHOST_JSON_ID}`, {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data.messages && Array.isArray(data.messages)) {
                scrollingMessages = data.messages;
                console.log('✅ Messages loaded from server successfully');
            }
        } else {
            console.log('⚠️ Using default messages (server data not available)');
        }
    } catch (error) {
        console.log('⚠️ Using default messages (connection error):', error.message);
    }
}

// Save messages to JSONhost
async function saveMessagesToServer() {
    try {
        const response = await fetch(`https://jsonhost.com/json/${JSONHOST_JSON_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': JSONHOST_API_KEY
            },
            body: JSON.stringify({
                messages: scrollingMessages,
                lastUpdated: new Date().toISOString(),
                updatedBy: 'SMP Admin'
            })
        });

        if (response.ok) {
            console.log('✅ Messages saved to server successfully');
            return true;
        } else {
            console.error('❌ Failed to save messages to server');
            return false;
        }
    } catch (error) {
        console.error('❌ Error saving messages:', error);
        return false;
    }
}

// Function to update scrolling message
function updateScrollingMessage() {
    const scrollingText = document.getElementById('scrollingText');
    if (scrollingText && scrollingMessages.length > 0) {
        scrollingText.textContent = scrollingMessages[messageIndex];
        messageIndex = (messageIndex + 1) % scrollingMessages.length;
    }
}

// Initialize scrolling messages
async function initScrollingMessages() {
    // Load messages from server first
    await loadMessagesFromServer();
    
    // Start the scrolling display
    updateScrollingMessage();
    // Change message every 15 seconds (matches animation duration)
    setInterval(updateScrollingMessage, 15000);
    
    // Add double-click event to the horn icon
    const scrollingMessage = document.querySelector('.scrolling-message');
    if (scrollingMessage) {
        scrollingMessage.addEventListener('dblclick', function(e) {
            // Check if double-click was on the horn icon area
            const rect = scrollingMessage.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            
            // Horn icon is positioned at left: 10px with width ~30px
            if (clickX <= 40) {
                showAuthPopup();
            }
        });
        
        // Add visual feedback on hover for the horn icon
        scrollingMessage.style.cursor = 'default';
    }
}

// Authentication functions
function showAuthPopup() {
    const authPopup = document.getElementById('authPopup');
    const authInput = document.getElementById('authInput');
    authPopup.classList.add('show');
    authInput.value = '';
    authInput.focus();
    
    // Handle Enter key in auth input
    authInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            authenticateUser();
        }
    });
}

function closeAuthPopup() {
    const authPopup = document.getElementById('authPopup');
    authPopup.classList.remove('show');
}

function authenticateUser() {
    const authInput = document.getElementById('authInput');
    const enteredKey = authInput.value.trim();
    
    if (enteredKey === 'tejusmp') {
        closeAuthPopup();
        showMessageEditor();
    } else {
        authInput.style.borderColor = '#f72585';
        authInput.style.boxShadow = '0 0 0 3px rgba(247, 37, 133, 0.2)';
        authInput.value = '';
        authInput.placeholder = 'Incorrect key. Try again...';
        
        setTimeout(() => {
            authInput.style.borderColor = 'var(--border-color)';
            authInput.style.boxShadow = 'none';
            authInput.placeholder = 'Enter access key...';
        }, 2000);
    }
}

// Message editor functions
function showMessageEditor() {
    const editorPopup = document.getElementById('messageEditorPopup');
    editorPopup.classList.add('show');
    populateMessageEditor();
}

function closeMessageEditor() {
    const editorPopup = document.getElementById('messageEditorPopup');
    editorPopup.classList.remove('show');
}

function populateMessageEditor() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    scrollingMessages.forEach((message, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-item';
        messageDiv.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">
                Message ${index + 1}
            </div>
            <textarea class="message-input" data-index="${index}">${message}</textarea>
            <div class="message-controls">
                <button class="btn-small btn-save" onclick="saveMessage(${index})">💾 Save</button>
                <button class="btn-small btn-delete" onclick="deleteMessage(${index})">🗑️ Delete</button>
            </div>
        `;
        container.appendChild(messageDiv);
    });
}

function addNewMessage() {
    const newMessage = "📢 New announcement message - edit this text";
    scrollingMessages.push(newMessage);
    populateMessageEditor();
}

async function saveMessage(index) {
    const messageInput = document.querySelector(`textarea[data-index="${index}"]`);
    const newMessage = messageInput.value.trim();
    
    if (newMessage) {
        scrollingMessages[index] = newMessage;
        
        // Show saving indicator
        messageInput.style.borderColor = '#ffc107';
        messageInput.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.2)';
        messageInput.parentElement.querySelector('.btn-save').textContent = '⏳ Saving...';
        messageInput.parentElement.querySelector('.btn-save').disabled = true;
        
        // Save to server
        const success = await saveMessagesToServer();
        
        if (success) {
            // Success feedback
            messageInput.style.borderColor = '#4cc9f0';
            messageInput.style.boxShadow = '0 0 0 3px rgba(76, 201, 240, 0.2)';
            messageInput.parentElement.querySelector('.btn-save').textContent = '✅ Saved';
        } else {
            // Error feedback
            messageInput.style.borderColor = '#f72585';
            messageInput.style.boxShadow = '0 0 0 3px rgba(247, 37, 133, 0.2)';
            messageInput.parentElement.querySelector('.btn-save').textContent = '❌ Error';
        }
        
        setTimeout(() => {
            messageInput.style.borderColor = 'var(--border-color)';
            messageInput.style.boxShadow = 'none';
            messageInput.parentElement.querySelector('.btn-save').textContent = '💾 Save';
            messageInput.parentElement.querySelector('.btn-save').disabled = false;
        }, 2000);
        
        // Update the currently displayed message if it's the one being edited
        if (messageIndex - 1 === index || (messageIndex === 0 && index === scrollingMessages.length - 1)) {
            updateScrollingMessage();
        }
    }
}

async function deleteMessage(index) {
    if (scrollingMessages.length <= 1) {
        alert('❌ Cannot delete the last message. At least one message must remain.');
        return;
    }
    
    if (confirm(`🗑️ Are you sure you want to delete Message ${index + 1}?\n\nThis will be permanently removed for all users.`)) {
        scrollingMessages.splice(index, 1);
        
        // Adjust messageIndex if necessary
        if (messageIndex >= scrollingMessages.length) {
            messageIndex = 0;
        }
        
        // Save to server
        const success = await saveMessagesToServer();
        
        if (success) {
            populateMessageEditor();
            updateScrollingMessage();
            
            // Show success message
            const container = document.getElementById('messagesContainer');
            const successDiv = document.createElement('div');
            successDiv.style.cssText = 'background: #4cc9f0; color: white; padding: 10px; border-radius: 6px; text-align: center; margin-bottom: 15px; font-weight: 600;';
            successDiv.textContent = '✅ Message deleted successfully and updated for all users';
            container.insertBefore(successDiv, container.firstChild);
            
            setTimeout(() => {
                successDiv.remove();
            }, 3000);
        } else {
            alert('❌ Failed to delete message on server. Please try again.');
        }
    }
}

// Dark mode functionality
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const toggle = document.getElementById('themeToggle');
    
    if (isDark) {
        body.removeAttribute('data-theme');
        toggle.innerHTML = '🌙 Switch to Dark Mode';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        toggle.innerHTML = '☀️ Switch to Light Mode';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        toggle.innerHTML = '☀️ Switch to Light Mode';
    } else {
        toggle.innerHTML = '🌙 Switch to Dark Mode';
    }
}

// Section navigation
function showSection(sectionName) {
    // If switching to fee list section, check access control FIRST
    if (sectionName === 'feelist') {
        const accessKey = prompt('🔐 Enter access key to view Fee List:');
        if (accessKey === null || accessKey === '' || accessKey !== 'teju2015') {
            alert('❌ Access denied. Invalid access key.');
            // Don't switch sections, exit immediately
            return;
        }
    }
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // If switching to fee list section, load data
    if (sectionName === 'feelist') {
        // Access already granted above, proceed with loading data
        if (feeListData.length === 0 && allStudentsData.length > 0) {
            populateFeeList();
        }
    }
    
    // If switching to not admitted section, ensure data is loaded and displayed
    if (sectionName === 'notadmitted') {
        
        // If data exists but table is empty, refresh display
        if (notAdmittedData.length > 0) {
            console.log('Refreshing display with existing data');
            filteredNotAdmittedData = [...notAdmittedData];
            populateNotAdmittedFilters();
            displayNotAdmittedStudents();
        } else {
            console.log('Loading not admitted data');
            // Try to load data if not already loaded
            loadNotAdmittedData();
        }
        
        // As a fallback, if still no data after 1 second, show a message
        setTimeout(() => {
            if (notAdmittedData.length === 0) {
                const tableBody = document.querySelector('#notAdmittedTable tbody');
                if (tableBody && !tableBody.innerHTML.includes('No students found')) {
                    tableBody.innerHTML = '<tr><td colspan="10" class="no-data">Unable to load not admitted students. Please check console for errors.</td></tr>';
                }
            }
        }, 1000);
    }
}

// Auto-load CSV file on page load
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    initScrollingMessages(); // Initialize scrolling messages
    loadCSVFile();
    
    // Close popup when clicking outside
    document.getElementById('courseBreakdownPopup').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCourseBreakdown();
        }
    });

    // Close auth popup when clicking outside
    document.getElementById('authPopup').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAuthPopup();
        }
    });

    // Close message editor when clicking outside
    document.getElementById('messageEditorPopup').addEventListener('click', function(e) {
        if (e.target === this) {
            closeMessageEditor();
        }
    });

    // Close popup with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCourseBreakdown();
            closeAuthPopup();
            closeMessageEditor();
        }
    });
});

async function loadCSVFile() {
    try {
        showLoading();
        const response = await fetch('students.csv');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        // Parse CSV and show basic UI immediately
        parseCSV(csvText);
        updateLastModifiedDate();
        hideLoading();
        
        // Show data info popup after successful loading
        showDataInfoPopup();
        
        // Defer heavy processing to next tick for better perceived performance
        setTimeout(() => {
            // Load not admitted students data in background
            loadNotAdmittedData();
        }, 100);
        
    } catch (error) {
        console.error('Error loading CSV file:', error);
        showError('Could not load students.csv file. Make sure the file exists in the same directory.');
    }
}

function updateLastModifiedDate() {
    // This function is no longer needed since we show the date in the popup
    // Keeping it empty to maintain compatibility with existing calls
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('error').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Data Info Popup Functions
function showDataInfoPopup() {
    // Update the popup with current date
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = String(today.getDate()).padStart(2, '0');
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    
    document.getElementById('popupLastUpdated').textContent = formattedDate;
    
    // Show the popup
    const popup = document.getElementById('dataInfoPopup');
    popup.classList.add('show');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        hideDataInfoPopup();
    }, 4000);
}

function hideDataInfoPopup() {
    const popup = document.getElementById('dataInfoPopup');
    popup.classList.remove('show');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        // Try to parse the date in various formats
        let date;
        
        // Handle dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd formats
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                // Assume dd/mm/yyyy format
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        } else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    // yyyy-mm-dd format
                    date = new Date(parts[0], parts[1] - 1, parts[2]);
                } else {
                    // dd-mm-yyyy format
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
        } else {
            date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) {
            return dateStr; // Return original if parsing fails
        }
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = months[date.getMonth()];
        const year = String(date.getFullYear()).slice(-2);
        
        return `${day}-${month}-${year}`;
    } catch (error) {
        return dateStr; // Return original if formatting fails
    }
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        showError('CSV file is empty');
        return;
    }
    
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    
    allStudentsData = [];
    studentsData = [];
    
    // Detect status column name
    const statusColumn = headers.find(h => 
        h.toLowerCase().includes('in/out') || 
        h.toLowerCase().includes('year in') ||
        h.toLowerCase().includes('status')
    ) || 'In/Out';
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
            const values = parseCSVLine(line);
            const student = {};
            
            headers.forEach((header, index) => {
                student[header] = values[index] ? values[index].trim() : '';
            });
            
            // Normalize Adm Type: treat all values as REGULAR except SNQ, LTRL & RPTR
            if (student['Adm Type']) {
                const admType = student['Adm Type'].trim();
                if (admType !== 'SNQ' && admType !== 'LTRL' && admType !== 'RPTR') {
                    student['Adm Type'] = 'REGULAR';
                }
            } else {
                student['Adm Type'] = 'REGULAR';
            }
            
            // Only include students with 'In' status
            const status = student[statusColumn] || student['In/Out'] || '';
            if (status.toLowerCase() === 'in') {
                allStudentsData.push(student);
                
                // For statistics section - exclude only if no 'Due Fee' in remarks
                if (!student['Remarks']?.toLowerCase().includes('due fee')) {
                    studentsData.push(student);
                }
            }
        } catch (error) {
            console.warn(`Error parsing line ${i + 1}:`, error);
        }
    }
    
    console.log(`Processed ${allStudentsData.length} total students`);
    console.log(`${studentsData.length} students for statistics (excluding due fee)`);
    
    // Sort students alphabetically by name
    studentsData.sort((a, b) => {
        const nameA = (a['Student Name'] || '').toLowerCase();
        const nameB = (b['Student Name'] || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    allStudentsData.sort((a, b) => {
        const nameA = (a['Student Name'] || '').toLowerCase();
        const nameB = (b['Student Name'] || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    filteredData = [...studentsData];
    
    // Process dues data
    processDuesData();
    
    displayDashboard();
}

function processDuesData() {
    
    // Group students by Registration Number, treating EE course separately
    const studentGroups = {};
    
    allStudentsData.forEach(student => {
        const regNo = student['Reg No'] || student['Registration No'] || '';
        const course = student['Course'] || '';
        
        if (!regNo || !course) return;
        
        // For EE course, use Reg No + Course as unique key to avoid conflicts
        // For other courses (CE, ME, EC, CS), use only Reg No
        let uniqueKey;
        if (course.toUpperCase() === 'EE') {
            uniqueKey = `${regNo}_${course}`; // EE students grouped by Reg No + Course
        } else {
            uniqueKey = regNo; // Other courses grouped by Reg No only
        }
        
        if (!studentGroups[uniqueKey]) {
            studentGroups[uniqueKey] = [];
        }
        studentGroups[uniqueKey].push(student);
    });
    
    console.log(`Found ${Object.keys(studentGroups).length} unique student groups`);
    console.log('Group distribution:', Object.keys(studentGroups).reduce((acc, key) => {
        const course = studentGroups[key][0]['Course'];
        acc[course] = (acc[course] || 0) + 1;
        return acc;
    }, {}));
    
    duesData = [];
    
    Object.entries(studentGroups).forEach(([uniqueKey, records]) => {
        if (records.length === 0) return;
        
        // Use the first record for basic student info (should be same across installments)
        const baseStudent = records[0];
        const course = baseStudent['Course'] || '';
        const regNo = baseStudent['Reg No'] || '';
        
        // Parse financial fields with robust number extraction
        const parseAmount = (value) => {
            if (!value || value === '') return 0;
            // Handle both string and number inputs
            const cleanValue = value.toString().replace(/[^\d.-]/g, '');
            const num = parseFloat(cleanValue);
            return isNaN(num) ? 0 : Math.abs(num); // Use absolute value to handle any negative signs
        };
        
        // Aggregate all payments across multiple installment records for this unique key
        let totalPaidSMP = 0;
        let totalPaidSVK = 0;
        
        // Sum all installment payments for this unique identifier
        records.forEach(record => {
            const smpPayment = parseAmount(record['SMP Paid']);
            const svkPayment = parseAmount(record['SVK Paid']);
            
            totalPaidSMP += smpPayment;
            totalPaidSVK += svkPayment;
            
            console.log(`  ${course} Installment - SMP: ${smpPayment}, SVK: ${svkPayment}`);
        });
        
        // Get allotted amounts (should be same across all records for same student)
        const allotedSMP = parseAmount(baseStudent['Alloted Fee SMP']);
        const allotedSVK = parseAmount(baseStudent['Alloted Fee SVK']);
        
        const totalAlloted = allotedSMP + allotedSVK;
        const totalPaid = totalPaidSMP + totalPaidSVK;
        
        // Calculate individual dues for SMP and SVK
        const duesSMP = Math.max(0, allotedSMP - totalPaidSMP);
        const duesSVK = Math.max(0, allotedSVK - totalPaidSVK);
        const totalDues = duesSMP + duesSVK;
        
        // Student has dues if ANY amount is pending in either SMP OR SVK
        const hasDues = (totalPaidSMP < allotedSMP) || (totalPaidSVK < allotedSVK);
        
        const keyInfo = course.toUpperCase() === 'EE' ? `${regNo} (${course})` : regNo;
        console.log(`Student: ${baseStudent['Student Name']}, Key: ${keyInfo} (${records.length} payment records)`);
        console.log(`  SMP: Alloted=${allotedSMP}, Total Paid=${totalPaidSMP}, Due=${duesSMP}`);
        console.log(`  SVK: Alloted=${allotedSVK}, Total Paid=${totalPaidSVK}, Due=${duesSVK}`);
        console.log(`  Total: Alloted=${totalAlloted}, Paid=${totalPaid}, Due=${totalDues}`);
        console.log(`  Has Dues: ${hasDues}`);
        
        // Include student if they have any pending amount in either SMP or SVK
        if (hasDues && totalDues > 0) {
            // Mixed admission type logic for dues data
            let normalizedAdmType;
            const admCat = baseStudent['Adm Cat'] || '';
            const admTypeCol = baseStudent['Adm Type'] || '';
            
            if (admCat.trim() === 'SNQ') {
                normalizedAdmType = 'SNQ';
            } else {
                // Use Adm Type for Regular, LTRL, RPTR
                if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                    normalizedAdmType = admTypeCol;
                } else {
                    normalizedAdmType = 'REGULAR';
                }
            }
            
            const duesStudent = {
                'Student Name': baseStudent['Student Name'] || '',
                'Father Name': baseStudent['Father Name'] || '',
                'Year': baseStudent['Year'] || '',
                'Course': course,
                'Reg No': regNo,
                'Adm Type': normalizedAdmType,
                'Adm Cat': baseStudent['Adm Cat'] || '',
                'In/Out': baseStudent['In/Out'] || 'In',
                'SMP Alloted': allotedSMP,
                'SVK Alloted': allotedSVK,
                'SMP Paid': totalPaidSMP,
                'SVK Paid': totalPaidSVK,
                'SMP Due': duesSMP,
                'SVK Due': duesSVK,
                'Total Alloted': totalAlloted,
                'Total Paid': totalPaid,
                'Total Dues': totalDues,
                'Payment Records': records.length,
                'Unique Key': uniqueKey
            };
            
            duesData.push(duesStudent);
        } else {
            console.log(`  ✅ Student ${baseStudent['Student Name']} (${course}) has no dues - both fees paid in full`);
        }
    });
    
    // Sort by course first, then by student name
    duesData.sort((a, b) => {
        const courseCompare = a['Course'].localeCompare(b['Course']);
        if (courseCompare !== 0) return courseCompare;
        
        const nameA = (a['Student Name'] || '').toLowerCase();
        const nameB = (b['Student Name'] || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    console.log(`Found ${duesData.length} students with outstanding dues`);
    
    // Log course distribution
    const courseDistribution = {};
    duesData.forEach(student => {
        const course = student['Course'];
        courseDistribution[course] = (courseDistribution[course] || 0) + 1;
    });
    console.log('Dues by course:', courseDistribution);
    
    // Log EE vs Other courses separation
    const eeStudents = duesData.filter(s => s['Course'].toUpperCase() === 'EE').length;
    const otherStudents = duesData.filter(s => s['Course'].toUpperCase() !== 'EE').length;
    console.log(`EE Students with dues: ${eeStudents}, Other courses: ${otherStudents}`);
    
    // Log sample dues calculations
    if (duesData.length > 0) {
        console.log('Sample dues calculation:', duesData[0]);
    }
    
    filteredDuesData = [...duesData];
}

function displayDashboard() {
    document.getElementById('dashboard').classList.remove('hidden');
    
    generateMetrics();
    generateYearWiseCharts();
    generateSummaryTable();
    generateDatewiseReport();
    populateFilters();
    populateDuesFilters();
    displayStudentList();
    displayDuesList();
    generateDuesMetrics();
}

function generateMetrics() {
    const courseCount = {};
    const courseYearCount = {};
    
    studentsData.forEach(student => {
        const course = student['Course'];
        const year = student['Year'];
        if (course) {
            courseCount[course] = (courseCount[course] || 0) + 1;
            
            if (!courseYearCount[course]) {
                courseYearCount[course] = {};
            }
            if (year) {
                courseYearCount[course][year] = (courseYearCount[course][year] || 0) + 1;
            }
        }
    });

    const metricsGrid = document.getElementById('metricsGrid');
    metricsGrid.innerHTML = '';

    const courseColors = {
        'CE': 'ce',
        'ME': 'me', 
        'EC': 'ec',
        'CS': 'cs',
        'EE': 'ee'
    };

    // Ensure all expected courses are shown, even with 0 count
    const expectedCourses = ['CE', 'ME', 'EC', 'CS', 'EE'];
    expectedCourses.forEach(course => {
        if (!courseCount[course]) {
            courseCount[course] = 0;
            courseYearCount[course] = {};
        }
    });

    expectedCourses.forEach(course => {
        const yearBreakdown = courseYearCount[course] || {};
        const firstYr = yearBreakdown['1st Yr'] || 0;
        const secondYr = yearBreakdown['2nd Yr'] || 0;
        const thirdYr = yearBreakdown['3rd Yr'] || 0;
        
        const metricCard = document.createElement('div');
        metricCard.className = 'metric-card';
        metricCard.style.cursor = 'pointer';
        metricCard.setAttribute('data-course', course);
        metricCard.innerHTML = `
            <div class="metric-number ${courseColors[course] || ''}">${courseCount[course]}</div>
            <div class="metric-label">${course}</div>
            <div class="year-breakdown">
                <div class="year-item">1st Yr: <span class="${courseColors[course] || ''}">${firstYr}</span></div>
                <div class="year-item">2nd Yr: <span class="${courseColors[course] || ''}">${secondYr}</span></div>
                <div class="year-item">3rd Yr: <span class="${courseColors[course] || ''}">${thirdYr}</span></div>
            </div>
        `;
        
        // Add click event listener for course breakdown popup
        metricCard.addEventListener('click', () => showCourseBreakdown(course));
        
        metricsGrid.appendChild(metricCard);
    });

    // Total students card with year breakdown
    const totalFirstYr = studentsData.filter(s => s['Year'] === '1st Yr').length;
    const totalSecondYr = studentsData.filter(s => s['Year'] === '2nd Yr').length;
    const totalThirdYr = studentsData.filter(s => s['Year'] === '3rd Yr').length;
    
    const totalCard = document.createElement('div');
    totalCard.className = 'metric-card';
    totalCard.innerHTML = `
        <div class="metric-number" style="color: var(--primary-color);">${studentsData.length}</div>
        <div class="metric-label">All Students</div>
        <div class="year-breakdown">
            <div class="year-item">1st Yr: <span style="color: var(--primary-color); font-weight: 600;">${totalFirstYr}</span></div>
            <div class="year-item">2nd Yr: <span style="color: var(--primary-color); font-weight: 600;">${totalSecondYr}</span></div>
            <div class="year-item">3rd Yr: <span style="color: var(--primary-color); font-weight: 600;">${totalThirdYr}</span></div>
        </div>
    `;
    metricsGrid.appendChild(totalCard);
}

// Course breakdown popup functions
function showCourseBreakdown(course) {
    const popup = document.getElementById('courseBreakdownPopup');
    const title = document.getElementById('popupTitle');
    const subtitle = document.getElementById('popupSubtitle');
    const timer = document.getElementById('popupTimer');
    const card = document.getElementById('breakdownCard');
    
    // Set popup title and subtitle
    const courseNames = {
        'CE': 'Civil Engineering',
        'ME': 'Mechanical Engineering',
        'EC': 'Electronics & Communication Engineering',
        'CS': 'Computer Science Engineering',
        'EE': 'Electrical Engineering'
    };
    
    title.textContent = `${course} - ${courseNames[course] || course}`;
    subtitle.textContent = `Year & Admission Type Breakdown`;
    
    // Generate breakdown data
    const breakdown = generateCourseBreakdown(course);
    
    // Populate single card
    const expectedYears = ['1st Yr', '2nd Yr', '3rd Yr'];
    let totalRegular = 0, totalLTRL = 0, totalSNQ = 0, totalRPTR = 0, grandTotal = 0;
    
    let cardHTML = `
        <div class="breakdown-grid">
            <div class="breakdown-header">
                <div class="year-label">Year</div>
                <div style="text-align: center; font-weight: 600;">Regular</div>
                <div style="text-align: center; font-weight: 600;">LTRL</div>
                <div style="text-align: center; font-weight: 600;">SNQ</div>
                <div style="text-align: center; font-weight: 600;">RPTR</div>
                <div style="text-align: center; font-weight: 600;">Total</div>
            </div>
            <div class="breakdown-divider"></div>
    `;
    
    expectedYears.forEach(year => {
        const yearData = breakdown[year] || { REGULAR: 0, LTRL: 0, SNQ: 0, RPTR: 0, total: 0 };
        
        cardHTML += `
            <div class="breakdown-row">
                <div class="year-label">${year}</div>
                <div class="breakdown-value regular">${yearData.REGULAR}</div>
                <div class="breakdown-value ltrl">${yearData.LTRL}</div>
                <div class="breakdown-value snq">${yearData.SNQ}</div>
                <div class="breakdown-value rptr">${yearData.RPTR}</div>
                <div class="breakdown-value breakdown-total">${yearData.total}</div>
            </div>
        `;
        
        totalRegular += yearData.REGULAR;
        totalLTRL += yearData.LTRL;
        totalSNQ += yearData.SNQ;
        totalRPTR += yearData.RPTR;
        grandTotal += yearData.total;
    });
    
    cardHTML += `
            <div class="breakdown-divider"></div>
            <div class="breakdown-row">
                <div class="year-label" style="font-weight: 700;">TOTAL</div>
                <div class="breakdown-value regular" style="font-weight: 700;">${totalRegular}</div>
                <div class="breakdown-value ltrl" style="font-weight: 700;">${totalLTRL}</div>
                <div class="breakdown-value snq" style="font-weight: 700;">${totalSNQ}</div>
                <div class="breakdown-value rptr" style="font-weight: 700;">${totalRPTR}</div>
                <div class="breakdown-value breakdown-total" style="font-weight: 700;">${grandTotal}</div>
            </div>
        </div>
        <div class="breakdown-grand-total">
            Grand Total: ${grandTotal} Students
        </div>
    `;
    
    card.innerHTML = cardHTML;
    
    // Show popup
    popup.classList.add('show');
    
    // Start countdown timer (8 seconds)
    let timeLeft = 8;
    timer.textContent = `Auto-close in ${timeLeft} seconds`;
    
    // Clear any existing timer
    if (popupTimer) {
        clearInterval(popupTimer);
    }
    
    popupTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            timer.textContent = `Auto-close in ${timeLeft} seconds`;
        } else {
            closeCourseBreakdown();
        }
    }, 1000);
}

function generateCourseBreakdown(course) {
    const breakdown = {};
    
    // Filter students for the specific course
    const courseStudents = studentsData.filter(student => student['Course'] === course);
    
    courseStudents.forEach(student => {
        const year = student['Year'];
        
        // For SNQ, check 'Adm Cat' column; for others, check 'Adm Type' column
        let admType;
        const admCat = student['Adm Cat'] || '';
        const admTypeCol = student['Adm Type'] || '';
        
        if (admCat.trim() === 'SNQ') {
            admType = 'SNQ';
        } else {
            // Use Adm Type for Regular, LTRL, RPTR
            if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                admType = admTypeCol;
            } else {
                admType = 'REGULAR'; // Default to REGULAR for all other values
            }
        }
        
        if (!breakdown[year]) {
            breakdown[year] = { REGULAR: 0, LTRL: 0, SNQ: 0, RPTR: 0, total: 0 };
        }
        
        breakdown[year][admType] = (breakdown[year][admType] || 0) + 1;
        breakdown[year].total++;
    });
    
    return breakdown;
}

function closeCourseBreakdown() {
    const popup = document.getElementById('courseBreakdownPopup');
    popup.classList.remove('show');
    
    // Clear timer
    if (popupTimer) {
        clearInterval(popupTimer);
        popupTimer = null;
    }
}

function generateYearWiseCharts() {
    const yearChartsWrapper = document.getElementById('yearChartsWrapper');
    yearChartsWrapper.innerHTML = '';

    const expectedYears = ['1st Yr', '2nd Yr', '3rd Yr'];
    const expectedCourses = ['CE', 'ME', 'EC', 'CS', 'EE'];

    // Count students by year and course
    const yearCourseCount = {};
    studentsData.forEach(student => {
        const course = student['Course'];
        const year = student['Year'];
        if (course && year) {
            if (!yearCourseCount[year]) {
                yearCourseCount[year] = {};
            }
            yearCourseCount[year][course] = (yearCourseCount[year][course] || 0) + 1;
        }
    });

    expectedYears.forEach(year => {
        const yearContainer = document.createElement('div');
        yearContainer.className = 'year-chart-container';
        
        // Get total students for this year
        const yearData = yearCourseCount[year] || {};
        const totalStudentsThisYear = Object.values(yearData).reduce((sum, count) => sum + count, 0);
        const maxPossibleStudents = expectedCourses.length * TOTAL_INTAKE_PER_COURSE;
        const completionPercentage = ((totalStudentsThisYear / maxPossibleStudents) * 100).toFixed(1);

        // Chart header
        const chartHeader = document.createElement('div');
        chartHeader.className = 'year-chart-header';
        chartHeader.innerHTML = `
            <div class="year-chart-title">${year} Admissions</div>
            <div class="year-chart-subtitle">Course-wise Student Distribution</div>
            <div class="year-chart-stats">${totalStudentsThisYear} of ${maxPossibleStudents} seats filled (${completionPercentage}%)</div>
        `;

        // Chart wrapper
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'year-chart-wrapper';
        
        // Chart container
        const chart = document.createElement('div');
        chart.className = 'year-chart';
        chart.id = `chart-${year.replace(' ', '-')}`;

        expectedCourses.forEach(course => {
            const admitted = yearData[course] || 0;
            
            const courseGroup = document.createElement('div');
            courseGroup.className = 'year-course-group';
            
            courseGroup.innerHTML = `
                <div class="year-bar-container">
                    <div class="year-bar ${course.toLowerCase()}" 
                         data-value="${admitted}" 
                         data-label="${course} (${year}): ${admitted} students"
                         data-course="${course}"
                         data-year="${year}">
                        <span class="year-bar-label">${admitted}</span>
                    </div>
                </div>
                <div class="year-course-label">${course}</div>
                <div class="year-course-stats">${admitted}/${TOTAL_INTAKE_PER_COURSE}</div>
            `;
            
            chart.appendChild(courseGroup);
        });

        chartWrapper.appendChild(chart);

        // Chart legend
        const legend = document.createElement('div');
        legend.className = 'year-chart-legend';
        legend.innerHTML = `
            <div class="year-legend-item">
                <div class="year-legend-color" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));"></div>
                <span class="year-legend-text">Students Admitted</span>
            </div>
            <div class="year-legend-item">
                <div class="year-legend-color" style="background: var(--border-color);"></div>
                <span class="year-legend-text">Available Seats: ${TOTAL_INTAKE_PER_COURSE} per course</span>
            </div>
        `;

        yearContainer.appendChild(chartHeader);
        yearContainer.appendChild(chartWrapper);
        yearContainer.appendChild(legend);
        yearChartsWrapper.appendChild(yearContainer);
    });

    // Initialize animations and tooltips for year-wise charts
    setTimeout(() => {
        initYearWiseCharts();
        setupYearWiseTooltips();
    }, 100);
}

function initYearWiseCharts() {
    const yearBars = document.querySelectorAll('.year-bar');
    const maxValue = TOTAL_INTAKE_PER_COURSE;

    yearBars.forEach(bar => {
        const value = parseInt(bar.dataset.value);
        const height = (value / maxValue) * 100;
        
        setTimeout(() => {
            bar.style.height = height + '%';
        }, 300);
    });
}

function setupYearWiseTooltips() {
    const yearBars = document.querySelectorAll('.year-bar');
    const tooltip = document.getElementById('tooltip');

    yearBars.forEach(bar => {
        bar.addEventListener('mouseenter', (e) => {
            tooltip.textContent = bar.dataset.label;
            tooltip.style.opacity = '1';
        });

        bar.addEventListener('mousemove', (e) => {
            tooltip.style.left = e.pageX + 10 + 'px';
            tooltip.style.top = e.pageY - 10 + 'px';
        });

        bar.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
}

function generateSummaryTable() {
    const summary = {};
    
    studentsData.forEach(student => {
        const year = student['Year'];
        const course = student['Course'];
        
        // For SNQ, check 'Adm Cat' column; for others, check 'Adm Type' column
        let admType;
        const admCat = student['Adm Cat'] || '';
        const admTypeCol = student['Adm Type'] || '';
        
        if (admCat.trim() === 'SNQ') {
            admType = 'SNQ';
        } else {
            // Use Adm Type for Regular, LTRL, RPTR
            if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                admType = admTypeCol;
            } else {
                admType = 'Regular'; // Default to Regular for display
            }
        }
        
        if (!summary[year]) {
            summary[year] = {};
        }
        if (!summary[year][course]) {
            summary[year][course] = { Regular: 0, LTRL: 0, SNQ: 0, RPTR: 0, total: 0 };
        }
        
        summary[year][course][admType] = (summary[year][course][admType] || 0) + 1;
        summary[year][course].total++;
    });

    const tbody = document.querySelector('#summaryTable tbody');
    tbody.innerHTML = '';

    // Calculate grand totals
    const grandTotals = { Regular: 0, LTRL: 0, SNQ: 0, RPTR: 0, total: 0 };

    const expectedYears = ['1st Yr', '2nd Yr', '3rd Yr'];
    const expectedCourses = ['CE', 'ME', 'EC', 'CS', 'EE'];
    
    expectedYears.forEach(year => {
        let yearTotals = { Regular: 0, LTRL: 0, SNQ: 0, RPTR: 0, total: 0 };
        
        expectedCourses.forEach(course => {
            const admTypes = summary[year]?.[course] || { Regular: 0, LTRL: 0, SNQ: 0, RPTR: 0, total: 0 };
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${year}</strong></td>
                <td><strong>${course}</strong></td>
                <td>${admTypes.Regular || 0}</td>
                <td>${admTypes.LTRL || 0}</td>
                <td>${admTypes.SNQ || 0}</td>
                <td>${admTypes.RPTR || 0}</td>
                <td><strong>${admTypes.total}</strong></td>
            `;
            tbody.appendChild(row);

            // Add to year totals
            yearTotals.Regular += admTypes.Regular || 0;
            yearTotals.LTRL += admTypes.LTRL || 0;
            yearTotals.SNQ += admTypes.SNQ || 0;
            yearTotals.RPTR += admTypes.RPTR || 0;
            yearTotals.total += admTypes.total;

            // Add to grand totals
            grandTotals.Regular += admTypes.Regular || 0;
            grandTotals.LTRL += admTypes.LTRL || 0;
            grandTotals.SNQ += admTypes.SNQ || 0;
            grandTotals.RPTR += admTypes.RPTR || 0;
            grandTotals.total += admTypes.total;
        });
        
        // Add subtotal row for each year
        const subtotalRow = document.createElement('tr');
        subtotalRow.className = 'subtotal-row';
        subtotalRow.innerHTML = `
            <td><strong>${year} SUBTOTAL</strong></td>
            <td><strong>All Courses</strong></td>
            <td><strong>${yearTotals.Regular}</strong></td>
            <td><strong>${yearTotals.LTRL}</strong></td>
            <td><strong>${yearTotals.SNQ}</strong></td>
            <td><strong>${yearTotals.RPTR}</strong></td>
            <td><strong>${yearTotals.total}</strong></td>
        `;
        tbody.appendChild(subtotalRow);
    });

    // Add Grand Total row
    const grandTotalRow = document.createElement('tr');
    grandTotalRow.className = 'grand-total-row';
    grandTotalRow.innerHTML = `
        <td colspan="2"><strong>GRAND TOTAL</strong></td>
        <td><strong>${grandTotals.Regular}</strong></td>
        <td><strong>${grandTotals.LTRL}</strong></td>
        <td><strong>${grandTotals.SNQ}</strong></td>
        <td><strong>${grandTotals.RPTR}</strong></td>
        <td><strong>${grandTotals.total}</strong></td>
    `;
    tbody.appendChild(grandTotalRow);
}

function generateDatewiseReport() {
    const dateSummary = {};
    
    // Look for common date field names
    const possibleDateFields = ['Date', 'Admission Date', 'Registration Date', 'DOB', 'Date of Birth', 'Entry Date'];
    let dateField = null;
    
    // Find which date field exists in the data
    for (let field of possibleDateFields) {
        if (studentsData.length > 0 && studentsData[0].hasOwnProperty(field)) {
            dateField = field;
            break;
        }
    }
    
    if (!dateField) {
        // If no date field found, create a sample entry showing "No date data available"
        const tbody = document.querySelector('#datewiseTable tbody');
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No date information available in the data</td></tr>';
        return;
    }
    
    studentsData.forEach(student => {
        const dateStr = student[dateField];
        const course = student['Course'];
        
        if (dateStr && course) {
            const formattedDate = formatDate(dateStr);
            
            if (!dateSummary[formattedDate]) {
                dateSummary[formattedDate] = { CE: 0, ME: 0, EC: 0, CS: 0, EE: 0, total: 0 };
            }
            
            dateSummary[formattedDate][course] = (dateSummary[formattedDate][course] || 0) + 1;
            dateSummary[formattedDate].total++;
        }
    });

    const tbody = document.querySelector('#datewiseTable tbody');
    tbody.innerHTML = '';

    // Calculate grand totals
    const grandTotals = { CE: 0, ME: 0, EC: 0, CS: 0, EE: 0, total: 0 };

    // Sort dates chronologically
    const sortedDates = Object.keys(dateSummary).sort((a, b) => {
        // Parse dates for sorting (dd-mmm-yy format)
        const parseDate = (dateStr) => {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const day = parseInt(parts[0]);
                const month = months.indexOf(parts[1]);
                const year = 2000 + parseInt(parts[2]); // Convert yy to yyyy
                return new Date(year, month, day);
            }
            return new Date(dateStr);
        };
        
        return parseDate(a) - parseDate(b);
    });

    sortedDates.forEach(date => {
        const courses = dateSummary[date];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${date}</strong></td>
            <td>${courses.CE || 0}</td>
            <td>${courses.ME || 0}</td>
            <td>${courses.EC || 0}</td>
            <td>${courses.CS || 0}</td>
            <td>${courses.EE || 0}</td>
            <td><strong>${courses.total}</strong></td>
        `;
        tbody.appendChild(row);

        // Add to grand totals
        grandTotals.CE += courses.CE || 0;
        grandTotals.ME += courses.ME || 0;
        grandTotals.EC += courses.EC || 0;
        grandTotals.CS += courses.CS || 0;
        grandTotals.EE += courses.EE || 0;
        grandTotals.total += courses.total;
    });

    // Add Grand Total row if there's data
    if (sortedDates.length > 0) {
        const grandTotalRow = document.createElement('tr');
        grandTotalRow.className = 'grand-total-row';
        grandTotalRow.innerHTML = `
            <td><strong>GRAND TOTAL</strong></td>
            <td><strong>${grandTotals.CE}</strong></td>
            <td><strong>${grandTotals.ME}</strong></td>
            <td><strong>${grandTotals.EC}</strong></td>
            <td><strong>${grandTotals.CS}</strong></td>
            <td><strong>${grandTotals.EE}</strong></td>
            <td><strong>${grandTotals.total}</strong></td>
        `;
        tbody.appendChild(grandTotalRow);
    }
}

function populateFilters() {
    const courses = [...new Set(studentsData.map(s => s['Course']))].sort();
    const years = [...new Set(studentsData.map(s => s['Year']))].sort();
    
    // Collect admission types from both columns with mixed logic
    const admTypesSet = new Set();
    studentsData.forEach(student => {
        const admCat = student['Adm Cat'] || '';
        const admTypeCol = student['Adm Type'] || '';
        
        if (admCat.trim() === 'SNQ') {
            admTypesSet.add('SNQ');
        } else {
            if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                admTypesSet.add(admTypeCol);
            } else {
                admTypesSet.add('REGULAR');
            }
        }
    });
    
    const admTypes = Array.from(admTypesSet).sort();

    const courseFilter = document.getElementById('courseFilter');
    const yearFilter = document.getElementById('yearFilter');
    const admTypeFilter = document.getElementById('admTypeFilter');

    courseFilter.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
        courseFilter.innerHTML += `<option value="${course}">${course}</option>`;
    });

    yearFilter.innerHTML = '<option value="">All Years</option>';
    years.forEach(year => {
        yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
    });

    admTypeFilter.innerHTML = '<option value="">All Types</option>';
    admTypes.forEach(admType => {
        admTypeFilter.innerHTML += `<option value="${admType}">${admType}</option>`;
    });
}

function populateDuesFilters() {
    const courses = [...new Set(duesData.map(s => s['Course']))].sort();
    const years = [...new Set(duesData.map(s => s['Year']))].sort();
    
    // Get admission types from processed dues data (which already has mixed logic applied)
    const admTypes = [...new Set(duesData.map(s => s['Adm Type']).filter(type => type))].sort();

    const courseFilter = document.getElementById('duesCourseFilter');
    const yearFilter = document.getElementById('duesYearFilter');
    const admTypeFilter = document.getElementById('duesAdmTypeFilter');

    courseFilter.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
        courseFilter.innerHTML += `<option value="${course}">${course}</option>`;
    });

    yearFilter.innerHTML = '<option value="">All Years</option>';
    years.forEach(year => {
        yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
    });

    admTypeFilter.innerHTML = '<option value="">All Types</option>';
    admTypes.forEach(admType => {
        admTypeFilter.innerHTML += `<option value="${admType}">${admType}</option>`;
    });
}

function displayStudentList() {
    const tbody = document.querySelector('#studentTable tbody');
    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-data">No students found</td></tr>';
        return;
    }

    filteredData.forEach((student, index) => {
        const serialNumber = String(index + 1).padStart(2, '0');
        
        // Determine displayed admission type using mixed logic
        let displayedAdmType;
        const admCat = student['Adm Cat'] || '';
        const admTypeCol = student['Adm Type'] || '';
        
        if (admCat.trim() === 'SNQ') {
            displayedAdmType = 'SNQ';
        } else {
            if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                displayedAdmType = admTypeCol;
            } else {
                displayedAdmType = 'REGULAR';
            }
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="student-checkbox" data-index="${index}" onchange="updateSelectedButtons()"></td>
            <td>${serialNumber}</td>
            <td>${student['Student Name'] || ''}</td>
            <td>${student['Father Name'] || ''}</td>
            <td>${student['Year'] || ''}</td>
            <td><span class="${student['Course']?.toLowerCase()}" style="font-weight: bold;">${student['Course'] || ''}</span></td>
            <td>${student['Reg No'] || ''}</td>
            <td>${displayedAdmType}</td>
            <td>${student['Adm Cat'] || ''}</td>
            <td>${student['In/Out'] || ''}</td>
        `;
        tbody.appendChild(row);
    });
    
    updateSelectedButtons();
}

function generateDuesMetrics() {
    const courseData = {};
    
    // Calculate metrics for each course
    duesData.forEach(student => {
        const course = student['Course'];
        if (!courseData[course]) {
            courseData[course] = {
                count: 0,
                totalDues: 0
            };
        }
        courseData[course].count++;
        courseData[course].totalDues += student['Total Dues'];
    });

    const duesMetricsGrid = document.getElementById('duesMetricsGrid');
    duesMetricsGrid.innerHTML = '';

    const courseColors = {
        'CE': 'ce',
        'ME': 'me', 
        'EC': 'ec',
        'CS': 'cs',
        'EE': 'ee'
    };

    // Ensure all expected courses are shown, even with 0 count
    const expectedCourses = ['CE', 'ME', 'EC', 'CS', 'EE'];
    expectedCourses.forEach(course => {
        if (!courseData[course]) {
            courseData[course] = { count: 0, totalDues: 0 };
        }
    });

    let grandTotalStudents = 0;
    let grandTotalAmount = 0;

    expectedCourses.forEach(course => {
        const data = courseData[course];
        grandTotalStudents += data.count;
        grandTotalAmount += data.totalDues;
        
        const formatAmount = (amount) => {
            if (amount === 0) return '₹0';
            return '₹' + amount.toLocaleString('en-IN', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
        };
        
        const metricCard = document.createElement('div');
        metricCard.className = 'metric-card';
        metricCard.innerHTML = `
            <div class="metric-number ${courseColors[course] || ''}">${data.count}</div>
            <div class="metric-label">${course} Students</div>
            <div style="font-size: 0.9rem; color: var(--warning-color); font-weight: 600; margin-top: 8px;">
                ${formatAmount(data.totalDues)}
            </div>
        `;
        duesMetricsGrid.appendChild(metricCard);
    });

    // Grand Total card
    const formatGrandTotal = (amount) => {
        return '₹' + amount.toLocaleString('en-IN', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
    };

    const totalCard = document.createElement('div');
    totalCard.className = 'metric-card';
    totalCard.style.background = 'linear-gradient(135deg, var(--warning-color), #dc1a68)';
    totalCard.style.color = 'white';
    totalCard.innerHTML = `
        <div class="metric-number" style="color: white;">${grandTotalStudents}</div>
        <div class="metric-label" style="color: white; opacity: 0.9;">Total Students</div>
        <div style="font-size: 1rem; color: white; font-weight: 700; margin-top: 8px;">
            ${formatGrandTotal(grandTotalAmount)}
        </div>
    `;
    duesMetricsGrid.appendChild(totalCard);
}

function displayDuesList() {
    const tbody = document.querySelector('#duesTable tbody');
    tbody.innerHTML = '';

    if (filteredDuesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="19" class="no-data">No students with outstanding dues found</td></tr>';
        return;
    }

    let totalSMPAlloted = 0;
    let totalSVKAlloted = 0;
    let totalSMPPaid = 0;
    let totalSVKPaid = 0;
    let totalSMPDue = 0;
    let totalSVKDue = 0;
    let totalAlloted = 0;
    let totalPaid = 0;
    let totalDues = 0;

    filteredDuesData.forEach((student, index) => {
        const serialNumber = String(index + 1).padStart(2, '0');
        const row = document.createElement('tr');
        
        const formatAmount = (amount) => {
            return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        };
        
        // Add to totals
        totalSMPAlloted += student['SMP Alloted'];
        totalSVKAlloted += student['SVK Alloted'];
        totalSMPPaid += student['SMP Paid'];
        totalSVKPaid += student['SVK Paid'];
        totalSMPDue += student['SMP Due'];
        totalSVKDue += student['SVK Due'];
        totalAlloted += student['Total Alloted'];
        totalPaid += student['Total Paid'];
        totalDues += student['Total Dues'];
        
        row.innerHTML = `
            <td><input type="checkbox" class="dues-checkbox" data-index="${index}" onchange="updateDuesSelectedButtons()"></td>
            <td>${serialNumber}</td>
            <td>${student['Student Name'] || ''}</td>
            <td>${student['Father Name'] || ''}</td>
            <td>${student['Year'] || ''}</td>
            <td><span class="${student['Course']?.toLowerCase()}" style="font-weight: bold;">${student['Course'] || ''}</span></td>
            <td>${student['Reg No'] || ''}</td>
            <td>${student['Adm Type'] || ''}</td>
            <td>${student['Adm Cat'] || ''}</td>
            <td>${student['In/Out'] || ''}</td>
            <td class="positive-amount">${formatAmount(student['SMP Alloted'])}</td>
            <td class="positive-amount">${formatAmount(student['SVK Alloted'])}</td>
            <td class="positive-amount">${formatAmount(student['SMP Paid'])}</td>
            <td class="positive-amount">${formatAmount(student['SVK Paid'])}</td>
            <td class="dues-amount">${formatAmount(student['SMP Due'])}</td>
            <td class="dues-amount">${formatAmount(student['SVK Due'])}</td>
            <td class="positive-amount">${formatAmount(student['Total Alloted'])}</td>
            <td class="positive-amount">${formatAmount(student['Total Paid'])}</td>
            <td class="dues-amount">${formatAmount(student['Total Dues'])}</td>
        `;
        tbody.appendChild(row);
    });

    // Add Grand Total row
    if (filteredDuesData.length > 0) {
        const grandTotalRow = document.createElement('tr');
        grandTotalRow.className = 'grand-total-row';
        grandTotalRow.innerHTML = `
            <td colspan="10"><strong>GRAND TOTAL (${filteredDuesData.length} Students)</strong></td>
            <td><strong>₹${totalSMPAlloted.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totalSVKAlloted.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totalSMPPaid.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totalSVKPaid.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totalSMPDue.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totalSVKDue.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totalPaid.toLocaleString('en-IN')}</strong></td>
            <td><strong>₹${totalDues.toLocaleString('en-IN')}</strong></td>
        `;
        tbody.appendChild(grandTotalRow);
    }
    
    updateDuesSelectedButtons();
}

function applyFilters() {
    const courseFilter = document.getElementById('courseFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const admTypeFilter = document.getElementById('admTypeFilter').value;
    const nameFilter = document.getElementById('nameFilter').value.toLowerCase();

    filteredData = studentsData.filter(student => {
        const matchesCourse = !courseFilter || student['Course'] === courseFilter;
        const matchesYear = !yearFilter || student['Year'] === yearFilter;
        
        // Mixed admission type filtering logic
        let matchesAdmType = true;
        if (admTypeFilter) {
            if (admTypeFilter === 'SNQ') {
                // For SNQ, check 'Adm Cat' column
                const admCat = student['Adm Cat'] || '';
                matchesAdmType = admCat.trim() === 'SNQ';
            } else {
                // For Regular, LTRL, RPTR - check 'Adm Type' column
                const admTypeCol = student['Adm Type'] || '';
                if (admTypeFilter === 'REGULAR') {
                    // Regular includes all values that are not LTRL, RPTR, or SNQ
                    const admCat = student['Adm Cat'] || '';
                    matchesAdmType = (admCat.trim() !== 'SNQ') && 
                                   (admTypeCol !== 'LTRL') && 
                                   (admTypeCol !== 'RPTR');
                } else {
                    // For LTRL and RPTR, exact match from Adm Type column
                    matchesAdmType = admTypeCol === admTypeFilter;
                }
            }
        }
        
        const matchesName = !nameFilter || 
            student['Student Name']?.toLowerCase().includes(nameFilter) ||
            student['Father Name']?.toLowerCase().includes(nameFilter) ||
            student['Reg No']?.toString().toLowerCase().includes(nameFilter);

        return matchesCourse && matchesYear && matchesAdmType && matchesName;
    });

    displayStudentList();
}

function applyDuesFilters() {
    const courseFilter = document.getElementById('duesCourseFilter').value;
    const yearFilter = document.getElementById('duesYearFilter').value;
    const admTypeFilter = document.getElementById('duesAdmTypeFilter').value;
    const nameFilter = document.getElementById('duesNameFilter').value.toLowerCase();

    filteredDuesData = duesData.filter(student => {
        const matchesCourse = !courseFilter || student['Course'] === courseFilter;
        const matchesYear = !yearFilter || student['Year'] === yearFilter;
        
        // Mixed admission type filtering logic
        let matchesAdmType = true;
        if (admTypeFilter) {
            if (admTypeFilter === 'SNQ') {
                // For SNQ, check if student was classified as SNQ based on Adm Cat
                // Since dues data stores the processed admission type, we check the stored value
                matchesAdmType = student['Adm Type'] === 'SNQ';
            } else {
                // For Regular, LTRL, RPTR - check stored admission type
                if (admTypeFilter === 'REGULAR') {
                    matchesAdmType = student['Adm Type'] === 'REGULAR';
                } else {
                    // For LTRL and RPTR
                    matchesAdmType = student['Adm Type'] === admTypeFilter;
                }
            }
        }
        
        const matchesName = !nameFilter || 
            student['Student Name']?.toLowerCase().includes(nameFilter) ||
            student['Father Name']?.toLowerCase().includes(nameFilter) ||
            student['Reg No']?.toString().toLowerCase().includes(nameFilter);

        return matchesCourse && matchesYear && matchesAdmType && matchesName;
    });

    displayDuesList();
    generateFilteredDuesMetrics();
}

function generateFilteredDuesMetrics() {
    const courseData = {};
    
    // Calculate metrics for each course based on filtered data
    filteredDuesData.forEach(student => {
        const course = student['Course'];
        if (!courseData[course]) {
            courseData[course] = {
                count: 0,
                totalDues: 0
            };
        }
        courseData[course].count++;
        courseData[course].totalDues += student['Total Dues'];
    });

    const duesMetricsGrid = document.getElementById('duesMetricsGrid');
    duesMetricsGrid.innerHTML = '';

    const courseColors = {
        'CE': 'ce',
        'ME': 'me', 
        'EC': 'ec',
        'CS': 'cs',
        'EE': 'ee'
    };

    // Ensure all expected courses are shown, even with 0 count
    const expectedCourses = ['CE', 'ME', 'EC', 'CS', 'EE'];
    expectedCourses.forEach(course => {
        if (!courseData[course]) {
            courseData[course] = { count: 0, totalDues: 0 };
        }
    });

    let grandTotalStudents = 0;
    let grandTotalAmount = 0;

    expectedCourses.forEach(course => {
        const data = courseData[course];
        grandTotalStudents += data.count;
        grandTotalAmount += data.totalDues;
        
        const formatAmount = (amount) => {
            if (amount === 0) return '₹0';
            return '₹' + amount.toLocaleString('en-IN', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
        };
        
        const metricCard = document.createElement('div');
        metricCard.className = 'metric-card';
        metricCard.innerHTML = `
            <div class="metric-number ${courseColors[course] || ''}">${data.count}</div>
            <div class="metric-label">${course} Students</div>
            <div style="font-size: 0.9rem; color: var(--warning-color); font-weight: 600; margin-top: 8px;">
                ${formatAmount(data.totalDues)}
            </div>
        `;
        duesMetricsGrid.appendChild(metricCard);
    });

    // Grand Total card
    const formatGrandTotal = (amount) => {
        return '₹' + amount.toLocaleString('en-IN', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
    };

    const totalCard = document.createElement('div');
    totalCard.className = 'metric-card';
    totalCard.style.background = 'linear-gradient(135deg, var(--warning-color), #dc1a68)';
    totalCard.style.color = 'white';
    totalCard.innerHTML = `
        <div class="metric-number" style="color: white;">${grandTotalStudents}</div>
        <div class="metric-label" style="color: white; opacity: 0.9;">Total Students</div>
        <div style="font-size: 1rem; color: white; font-weight: 700; margin-top: 8px;">
            ${formatGrandTotal(grandTotalAmount)}
        </div>
    `;
    duesMetricsGrid.appendChild(totalCard);
}

function clearFilters() {
    document.getElementById('courseFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('admTypeFilter').value = '';
    document.getElementById('nameFilter').value = '';
    filteredData = [...studentsData];
    displayStudentList();
}

function clearDuesFilters() {
    document.getElementById('duesCourseFilter').value = '';
    document.getElementById('duesYearFilter').value = '';
    document.getElementById('duesAdmTypeFilter').value = '';
    document.getElementById('duesNameFilter').value = '';
    filteredDuesData = [...duesData];
    displayDuesList();
    generateDuesMetrics(); // Regenerate original metrics
}

function exportSummaryToPDF() {
    if (!confirm('📄 Export Year, Course & Admission Type-wise Student Count as PDF?')) {
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SMP Admn Stats 2025-26', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Year, Course & Admission Type-wise Student Count', 105, 30, { align: 'center' });
    
    // Generation info
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const genInfo = `Generated: ${currentDate}`;
    doc.text(genInfo, 105, 45, { align: 'center' });
    
    // Get table data
    const table = document.getElementById('summaryTable');
    const rows = table.querySelectorAll('tbody tr');
    
    if (rows.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Table headers
    const headers = ['Year', 'Course', 'Regular', 'LTRL', 'SNQ', 'RPTR', 'Total'];
    const startY = 55;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    
    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY - 2, 180, 8, 'F');
    
    const colWidths = [25, 25, 22, 22, 22, 22, 22];
    let xPos = 15;
    
    headers.forEach((header, index) => {
        doc.text(header, xPos + 2, startY + 4);
        xPos += colWidths[index];
    });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    
    let currentY = startY + 12;
    const rowHeight = 6;
    const pageHeight = 270;
    
    rows.forEach((row, index) => {
        if (currentY > pageHeight) {
            doc.addPage();
            currentY = 20;
            
            // Repeat headers on new page
            doc.setFont(undefined, 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(15, currentY - 2, 180, 8, 'F');
            
            xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos + 2, currentY + 4);
                xPos += colWidths[i];
            });
            
            currentY += 12;
            doc.setFont(undefined, 'normal');
        }
        
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => cell.textContent.trim());
        
        // Check if this is a subtotal or grand total row
        const isSubtotal = row.classList.contains('subtotal-row');
        const isGrandTotal = row.classList.contains('grand-total-row');
        
        if (isSubtotal || isGrandTotal) {
            doc.setFillColor(67, 97, 238);
            doc.rect(15, currentY - 2, 180, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
        } else if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, currentY - 2, 180, rowHeight, 'F');
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        }
        
        xPos = 15;
        rowData.forEach((data, i) => {
            const text = String(data);
            doc.text(text, xPos + 2, currentY + 2);
            xPos += colWidths[i];
        });
        
        currentY += rowHeight;
    });
    
    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('SMP Admn Stats 2025-26 - Summary Report', 105, 285, { align: 'center' });
    }
    
    const fileName = `SMP_Summary_Report_${currentDate.replace(/-/g, '_')}.pdf`;
    doc.save(fileName);
}

function exportDatewiseToPDF() {
    if (!confirm('📄 Export Date-wise & Course-wise Students Report as PDF?')) {
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SMP Admn Stats 2025-26', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Date-wise & Course-wise Students Report', 105, 30, { align: 'center' });
    
    // Generation info
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const genInfo = `Generated: ${currentDate}`;
    doc.text(genInfo, 105, 45, { align: 'center' });
    
    // Get table data
    const table = document.getElementById('datewiseTable');
    const rows = table.querySelectorAll('tbody tr');
    
    if (rows.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Table headers
    const headers = ['Date', 'CE', 'ME', 'EC', 'CS', 'EE', 'Total'];
    const startY = 55;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    
    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY - 2, 180, 8, 'F');
    
    const colWidths = [35, 20, 20, 20, 20, 20, 25];
    let xPos = 15;
    
    headers.forEach((header, index) => {
        doc.text(header, xPos + 2, startY + 4);
        xPos += colWidths[index];
    });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    
    let currentY = startY + 12;
    const rowHeight = 6;
    const pageHeight = 270;
    
    rows.forEach((row, index) => {
        if (currentY > pageHeight) {
            doc.addPage();
            currentY = 20;
            
            // Repeat headers on new page
            doc.setFont(undefined, 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(15, currentY - 2, 180, 8, 'F');
            
            xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos + 2, currentY + 4);
                xPos += colWidths[i];
            });
            
            currentY += 12;
            doc.setFont(undefined, 'normal');
        }
        
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => cell.textContent.trim());
        
        // Check if this is a grand total row
        const isGrandTotal = row.classList.contains('grand-total-row');
        
        if (isGrandTotal) {
            doc.setFillColor(67, 97, 238);
            doc.rect(15, currentY - 2, 180, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
        } else if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, currentY - 2, 180, rowHeight, 'F');
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        }
        
        xPos = 15;
        rowData.forEach((data, i) => {
            const text = String(data);
            doc.text(text, xPos + 2, currentY + 2);
            xPos += colWidths[i];
        });
        
        currentY += rowHeight;
    });
    
    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('SMP Admn Stats 2025-26 - Date-wise Report', 105, 285, { align: 'center' });
    }
    
    const fileName = `SMP_Datewise_Report_${currentDate.replace(/-/g, '_')}.pdf`;
    doc.save(fileName);
}

function saveToPDF() {
    if (filteredData.length === 0) {
        alert('No data to export');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const courseFilter = document.getElementById('courseFilter').value || 'All Courses';
    const yearFilter = document.getElementById('yearFilter').value || 'All Years';
    const nameFilter = document.getElementById('nameFilter').value || 'No Name Filter';
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SMP Admn Stats 2025-26', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Student Directory Report', 105, 30, { align: 'center' });
    
    // Filter Information - Compact horizontal layout
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const shortNameFilter = nameFilter === 'No Name Filter' ? 'None' : (nameFilter.length > 15 ? nameFilter.substring(0, 15) + '...' : nameFilter);
    const filterInfo = `Generated: ${currentDate} | Course: ${courseFilter} | Year: ${yearFilter} | Name: ${shortNameFilter} | Records: ${filteredData.length}`;
    doc.text(filterInfo, 105, 45, { align: 'center' });
    
    const courseHeaders = {
        'CS': 'Computer Science Engineering',
        'CE': 'Civil Engineering', 
        'EC': 'Electronics & Communication Engineering',
        'ME': 'Mechanical Engineering',
        'EE': 'Electrical Engineering'
    };
    
    if (courseFilter !== 'All Courses' && courseHeaders[courseFilter]) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(courseHeaders[courseFilter], 105, 55, { align: 'center' });
    }
    
    // Table headers
    const headers = ['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Status'];
    const startY = courseFilter !== 'All Courses' ? 65 : 55;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    
    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY - 2, 180, 8, 'F');
    
    const colWidths = [12, 28, 28, 15, 15, 20, 20, 20, 12];
    let xPos = 15;
    
    headers.forEach((header, index) => {
        doc.text(header, xPos + 2, startY + 4);
        xPos += colWidths[index];
    });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    
    let currentY = startY + 12;
    const rowHeight = 6;
    const pageHeight = 270;
    
    filteredData.forEach((student, index) => {
        if (currentY > pageHeight) {
            doc.addPage();
            currentY = 20;
            
            doc.setFont(undefined, 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(15, currentY - 2, 180, 8, 'F');
            
            xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos + 2, currentY + 4);
                xPos += colWidths[i];
            });
            
            currentY += 12;
            doc.setFont(undefined, 'normal');
        }
        
        const serialNumber = String(index + 1).padStart(2, '0');
        
        // Determine displayed admission type using mixed logic
        let displayedAdmType;
        const admCat = student['Adm Cat'] || '';
        const admTypeCol = student['Adm Type'] || '';
        
        if (admCat.trim() === 'SNQ') {
            displayedAdmType = 'SNQ';
        } else {
            if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                displayedAdmType = admTypeCol;
            } else {
                displayedAdmType = 'REGULAR';
            }
        }
        
        const rowData = [
            serialNumber,
            (student['Student Name'] || '').substring(0, 20),
            (student['Father Name'] || '').substring(0, 20),
            student['Year'] || '',
            student['Course'] || '',
            (student['Reg No'] || '').substring(0, 15),
            displayedAdmType.substring(0, 12),
            (student['Adm Cat'] || '').substring(0, 12),
            student['In/Out'] || ''
        ];
        
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, currentY - 2, 180, rowHeight, 'F');
        }
        
        xPos = 15;
        rowData.forEach((data, i) => {
            const text = String(data);
            doc.text(text, xPos + 2, currentY + 2);
            xPos += colWidths[i];
        });
        
        currentY += rowHeight;
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('SMP Admn Stats 2025-26 - Student Directory', 105, 285, { align: 'center' });
    }
    
    const fileName = `SMP_Students_${courseFilter.replace(' ', '_')}_${currentDate.replace(/-/g, '_')}.pdf`;
    doc.save(fileName);
}

function saveDuesToPDF() {
    if (filteredDuesData.length === 0) {
        alert('No data to export');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    const courseFilter = document.getElementById('duesCourseFilter').value || 'All Courses';
    const yearFilter = document.getElementById('duesYearFilter').value || 'All Years';
    const nameFilter = document.getElementById('duesNameFilter').value || 'No Name Filter';
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Fee Dues Report', 148, 30, { align: 'center' });
    
    // Filter Information - Compact horizontal layout
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const shortNameFilter = nameFilter === 'No Name Filter' ? 'None' : (nameFilter.length > 15 ? nameFilter.substring(0, 15) + '...' : nameFilter);
    const filterInfo = `Generated: ${currentDate} | Course: ${courseFilter} | Year: ${yearFilter} | Name: ${shortNameFilter} | Records: ${filteredDuesData.length}`;
    doc.text(filterInfo, 148, 45, { align: 'center' });
    
    // Calculate total dues amount
    const totalDuesAmount = filteredDuesData.reduce((sum, student) => sum + student['Total Dues'], 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Outstanding Dues: ₹${totalDuesAmount.toLocaleString('en-IN')}`, 148, 55, { align: 'center' });
    
    // Table headers
    const headers = ['Sl', 'Student Name', 'Father Name', 'Yr', 'Course', 'Reg No', 'Adm', 'Cat', 'Status', 'SMP All', 'SVK All', 'SMP Paid', 'SVK Paid', 'SMP Due', 'SVK Due', 'Tot All', 'Tot Paid', 'Tot Due'];
    const startY = 65;
    
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    
    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY - 2, 266, 8, 'F');
    
    const colWidths = [8, 20, 20, 8, 10, 15, 12, 12, 8, 15, 15, 15, 15, 15, 15, 15, 15, 15];
    let xPos = 15;
    
    headers.forEach((header, index) => {
        doc.text(header, xPos + 2, startY + 4);
        xPos += colWidths[index];
    });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(6);
    
    let currentY = startY + 12;
    const rowHeight = 6;
    const pageHeight = 180;
    
    filteredDuesData.forEach((student, index) => {
        if (currentY > pageHeight) {
            doc.addPage();
            currentY = 20;
            
            doc.setFont(undefined, 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(15, currentY - 2, 266, 8, 'F');
            
            xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos + 2, currentY + 4);
                xPos += colWidths[i];
            });
            
            currentY += 12;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(6);
        }
        
        const serialNumber = String(index + 1).padStart(2, '0');
        const formatAmount = (amount) => '₹' + Math.round(amount).toLocaleString('en-IN');
        
        const rowData = [
            serialNumber,
            (student['Student Name'] || '').substring(0, 11),
            (student['Father Name'] || '').substring(0, 11),
            student['Year'] || '',
            student['Course'] || '',
            student['Reg No'] || '',
            (student['Adm Type'] || '').substring(0, 8),
            (student['Adm Cat'] || '').substring(0, 8),
            student['In/Out'] || '',
            formatAmount(student['SMP Alloted']),
            formatAmount(student['SVK Alloted']),
            formatAmount(student['SMP Paid']),
            formatAmount(student['SVK Paid']),
            formatAmount(student['SMP Due']),
            formatAmount(student['SVK Due']),
            formatAmount(student['Total Alloted']),
            formatAmount(student['Total Paid']),
            formatAmount(student['Total Dues'])
        ];
        
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, currentY - 2, 266, rowHeight, 'F');
        }
        
        xPos = 15;
        rowData.forEach((data, i) => {
            const text = String(data);
            doc.text(text, xPos + 2, currentY + 2);
            xPos += colWidths[i];
        });
        
        currentY += rowHeight;
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Page ${i} of ${pageCount}`, 148, 205, { align: 'center' });
        doc.text('SMP Admn Stats 2025-26 - Fee Dues Report', 148, 200, { align: 'center' });
    }
    
    const fileName = `SMP_Dues_${courseFilter.replace(' ', '_')}_${currentDate.replace(/-/g, '_')}.pdf`;
    doc.save(fileName);
}

function exportToCSV() {
    if (filteredData.length === 0) {
        alert('No data to export');
        return;
    }

    const headers = ['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Status'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map((student, index) => {
            const serialNumber = String(index + 1).padStart(2, '0');
            
            // Determine displayed admission type using mixed logic
            let displayedAdmType;
            const admCat = student['Adm Cat'] || '';
            const admTypeCol = student['Adm Type'] || '';
            
            if (admCat.trim() === 'SNQ') {
                displayedAdmType = 'SNQ';
            } else {
                if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                    displayedAdmType = admTypeCol;
                } else {
                    displayedAdmType = 'REGULAR';
                }
            }
            
            const values = [
                serialNumber,
                student['Student Name'] || '',
                student['Father Name'] || '',
                student['Year'] || '',
                student['Course'] || '',
                student['Reg No'] || '',
                displayedAdmType,
                student['Adm Cat'] || '',
                student['In/Out'] || ''
            ];
            return values.map(value => `"${value.toString().replace(/"/g, '""')}"`).join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    link.setAttribute('download', `students_export_${currentDate.replace(/-/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportDuesToCSV() {
    if (filteredDuesData.length === 0) {
        alert('No data to export');
        return;
    }

    const headers = ['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Status', 'SMP Alloted', 'SVK Alloted', 'SMP Paid', 'SVK Paid', 'SMP Due', 'SVK Due', 'Total Alloted', 'Total Paid', 'Total Dues'];
    const csvContent = [
        headers.join(','),
        ...filteredDuesData.map((student, index) => {
            const serialNumber = String(index + 1).padStart(2, '0');
            const values = [
                serialNumber,
                student['Student Name'] || '',
                student['Father Name'] || '',
                student['Year'] || '',
                student['Course'] || '',
                student['Reg No'] || '',
                student['Adm Type'] || '',
                student['Adm Cat'] || '',
                student['In/Out'] || '',
                student['SMP Alloted'],
                student['SVK Alloted'],
                student['SMP Paid'],
                student['SVK Paid'],
                student['SMP Due'],
                student['SVK Due'],
                student['Total Alloted'],
                student['Total Paid'],
                student['Total Dues']
            ];
            return values.map(value => `"${value.toString().replace(/"/g, '""')}"`).join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    link.setAttribute('download', `dues_export_${currentDate.replace(/-/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to convert input to uppercase as user types
function makeUppercaseOnInput(inputElement) {
    inputElement.addEventListener('input', function() {
        const cursorPosition = this.selectionStart;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(cursorPosition, cursorPosition);
    });
}

// Auto-apply filters on input change and convert to uppercase
document.getElementById('nameFilter').addEventListener('input', applyFilters);
document.getElementById('courseFilter').addEventListener('change', applyFilters);
document.getElementById('yearFilter').addEventListener('change', applyFilters);
document.getElementById('admTypeFilter').addEventListener('change', applyFilters);

// Dues filters
document.getElementById('duesNameFilter').addEventListener('input', applyDuesFilters);
document.getElementById('duesCourseFilter').addEventListener('change', applyDuesFilters);
document.getElementById('duesYearFilter').addEventListener('change', applyDuesFilters);
document.getElementById('duesAdmTypeFilter').addEventListener('change', applyDuesFilters);

// Apply uppercase conversion to all search input fields
makeUppercaseOnInput(document.getElementById('nameFilter'));
makeUppercaseOnInput(document.getElementById('duesNameFilter'));
makeUppercaseOnInput(document.getElementById('notAdmittedNameFilter'));

// Data Info Popup event listener
document.getElementById('dataInfoPopup').addEventListener('click', function(e) {
    // Hide popup when clicking on the background (not the content)
    if (e.target === this) {
        hideDataInfoPopup();
    }
});

// ============================================
// NOT ADMITTED LIST FUNCTIONALITY
// ============================================

// Apply filters for not admitted students
function applyNotAdmittedFilters() {
    const courseFilter = document.getElementById('notAdmittedCourseFilter')?.value || '';
    const yearFilter = document.getElementById('notAdmittedYearFilter')?.value || '';
    const admTypeFilter = document.getElementById('notAdmittedAdmTypeFilter')?.value || '';
    const nameFilter = document.getElementById('notAdmittedNameFilter')?.value.toLowerCase() || '';

    filteredNotAdmittedData = notAdmittedData.filter(student => {
        const courseMatch = !courseFilter || student['Course'] === courseFilter;
        const yearMatch = !yearFilter || student['Year'] === yearFilter;
        const admTypeMatch = !admTypeFilter || student['Adm Type'] === admTypeFilter;
        const nameMatch = !nameFilter || 
            student['Student Name'].toLowerCase().includes(nameFilter) ||
            student['Reg No'].toLowerCase().includes(nameFilter);

        return courseMatch && yearMatch && admTypeMatch && nameMatch;
    });

    displayNotAdmittedStudents();
}

// Display not admitted students in table
function displayNotAdmittedStudents() {
    console.log('=== DISPLAY NOT ADMITTED STUDENTS ===');
    const tableBody = document.querySelector('#notAdmittedTable tbody');
    console.log('Table body found:', !!tableBody);
    console.log('Filtered data length:', filteredNotAdmittedData.length);
    
    if (!tableBody) {
        console.error('notAdmittedTable tbody not found in DOM');
        return;
    }

    if (filteredNotAdmittedData.length === 0) {
        console.log('No filtered data - showing no data message');
        tableBody.innerHTML = '<tr><td colspan="11" class="no-data">No students found matching the current filters</td></tr>';
        return;
    }
    
    console.log('Populating table with', filteredNotAdmittedData.length, 'students');

    tableBody.innerHTML = filteredNotAdmittedData.map((student, index) => `
        <tr>
            <td><input type="checkbox" class="notadmitted-checkbox" data-index="${index}" onchange="updateNotAdmittedSelectedButtons()"></td>
            <td>${index + 1}</td>
            <td>${student['Student Name'] || ''}</td>
            <td>${student['Father Name'] || ''}</td>
            <td>${student['Year'] || ''}</td>
            <td class="${(student['Course'] || '').toLowerCase()}">${student['Course'] || ''}</td>
            <td>${student['Reg No'] || ''}</td>
            <td class="admtype-${(student['Adm Type'] || '').toLowerCase()}">${student['Adm Type'] || ''}</td>
            <td>${student['Adm Cat'] || student['Admn Cat'] || ''}</td>
            <td>${student['Acdmc Year'] || ''}</td>
            <td>${student['In/Out'] || 'Not Admitted'}</td>
        </tr>
    `).join('');
    
    updateNotAdmittedSelectedButtons();
}

// Clear all not admitted filters
function clearNotAdmittedFilters() {
    document.getElementById('notAdmittedCourseFilter').value = '';
    document.getElementById('notAdmittedYearFilter').value = '';
    document.getElementById('notAdmittedAdmTypeFilter').value = '';
    document.getElementById('notAdmittedNameFilter').value = '';
    applyNotAdmittedFilters();
}

// Populate not admitted filter dropdowns
function populateNotAdmittedFilters() {
    if (notAdmittedData.length === 0) return;

    const courses = [...new Set(notAdmittedData.map(s => s['Course']).filter(Boolean))].sort();
    const years = [...new Set(notAdmittedData.map(s => s['Year']).filter(Boolean))].sort();
    const admTypes = [...new Set(notAdmittedData.map(s => s['Adm Type']).filter(Boolean))].sort();

    // Populate course filter
    const courseFilter = document.getElementById('notAdmittedCourseFilter');
    if (courseFilter) {
        courseFilter.innerHTML = '<option value="">All Courses</option>' +
            courses.map(course => `<option value="${course}">${course}</option>`).join('');
    }

    // Populate year filter
    const yearFilter = document.getElementById('notAdmittedYearFilter');
    if (yearFilter) {
        yearFilter.innerHTML = '<option value="">All Years</option>' +
            years.map(year => `<option value="${year}">${year}</option>`).join('');
    }

    // Populate adm type filter
    const admTypeFilter = document.getElementById('notAdmittedAdmTypeFilter');
    if (admTypeFilter) {
        admTypeFilter.innerHTML = '<option value="">All Types</option>' +
            admTypes.map(type => `<option value="${type}">${type}</option>`).join('');
    }
}

// Export not admitted students to CSV
function exportNotAdmittedToCSV() {
    if (filteredNotAdmittedData.length === 0) {
        alert('No data to export');
        return;
    }

    const headers = [
        'Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 
        'Reg No', 'Adm Type', 'Adm Cat', 'Academic Year', 'Status'
    ];

    const csvContent = [
        headers.join(','),
        ...filteredNotAdmittedData.map((student, index) => {
            const values = [
                index + 1,
                student['Student Name'] || '',
                student['Father Name'] || '',
                student['Year'] || '',
                student['Course'] || '',
                student['Reg No'] || '',
                student['Adm Type'] || '',
                student['Adm Cat'] || student['Admn Cat'] || '',
                student['Acdmc Year'] || '',
                student['In/Out'] || 'Not Admitted'
            ];
            return values.map(value => `"${value.toString().replace(/"/g, '""')}"`).join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    link.setAttribute('download', `not_admitted_export_${currentDate.replace(/-/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Save not admitted students list as PDF
function saveNotAdmittedToPDF() {
    if (filteredNotAdmittedData.length === 0) {
        alert('No data to export');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(16);
    doc.text('SMP Not Admitted Students List', 14, 15);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Total Students: ${filteredNotAdmittedData.length}`, 14, 32);
    
    // Prepare data for the table
    const headers = [['Sl No', 'Student Name', 'Father Name', 'Prev Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Status']];
    const data = filteredNotAdmittedData.map((student, index) => [
        (index + 1).toString(),
        student['Student Name'] || '',
        student['Father Name'] || '',
        student['Year'] || '',
        student['Course'] || '',
        student['Reg No'] || '',
        student['Adm Type'] || '',
        student['Adm Cat'] || student['Admn Cat'] || '',
        student['In/Out'] || 'Not Admitted'
    ]);
    
    // Add table
    doc.autoTable({
        head: headers,
        body: data,
        startY: 40,
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [67, 97, 238],
            textColor: 255
        },
        columnStyles: {
            0: { cellWidth: 15 }, // Sl No
            1: { cellWidth: 35 }, // Student Name
            2: { cellWidth: 35 }, // Father Name
            3: { cellWidth: 20 }, // Prev Year
            4: { cellWidth: 20 }, // Course
            5: { cellWidth: 30 }, // Reg No
            6: { cellWidth: 25 }, // Adm Type
            7: { cellWidth: 25 }, // Adm Cat
            8: { cellWidth: 25 }  // Status
        }
    });
    
    // Save the PDF
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    doc.save(`not_admitted_list_${currentDate.replace(/-/g, '_')}.pdf`);
}

// Load not admitted students data from Previous Students.csv
async function loadNotAdmittedData() {
    try {
        
        
        // If no current students data, don't proceed
        if (allStudentsData.length === 0) {
            console.log('No current students data available yet');
            const tableBody = document.querySelector('#notAdmittedTable tbody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="10" class="no-data">Current students data not loaded yet. Please wait...</td></tr>';
            }
            return;
        }
        
        const response = await fetch('Previous Students.csv');
        if (!response.ok) {
            console.log('Previous Students.csv not found, not admitted list will be empty');
            // Show message in table
            const tableBody = document.querySelector('#notAdmittedTable tbody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="10" class="no-data">Previous Students.csv file not found. Unable to load not admitted students data.</td></tr>';
            }
            return;
        }
        console.log('Previous Students.csv loaded successfully');
        
        const csvText = await response.text();
        
        // Parse CSV manually like the main parseCSV function
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            console.error('Previous Students.csv is empty');
            return;
        }
        
        // Parse headers
        const headers = parseCSVLine(lines[0]).map(h => h.trim());
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;
            
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
        
        const results = { data };
        
        // Create a set of current students for comparison using ONLY Reg No as unique identifier
        // Reg No is unique and most reliable for matching students across years
        const currentStudentRegNumbers = new Set();
        
        allStudentsData.forEach(s => {
            if (s['Student Name'] && s['Student Name'] !== 'ABC') {
                const regNo = (s['Reg No'] || '').toString().trim();
                
                // Add only Reg No as the unique identifier
                if (regNo) {
                    currentStudentRegNumbers.add(regNo);
                }
            }
        });
        
        console.log('Current student reg numbers count:', currentStudentRegNumbers.size);
        console.log('Sample reg numbers:', Array.from(currentStudentRegNumbers).slice(0, 3));
        
        // Filter students from 2024-25 who are NOT in current 2025-26 data
        notAdmittedData = results.data.filter(student => {
            // Must be from 2024-25 academic year
            if (student['Acdmc Year'] !== '2024-25') return false;
            
            // Must have a valid name
            if (!student['Student Name'] || student['Student Name'].trim() === '') return false;
            
            // Skip students with "OUT" status (they have completed their studies)
            if (student['Year'] === 'OUT') return false;
            
            // Check if this student appears in current data using ONLY Reg No
            const regNo = (student['Reg No'] || '').toString().trim();
            let isInCurrentData = false;
            
            // Use ONLY Registration Number for comparison (most reliable and unique)
            // If student doesn't have a Reg No, we cannot reliably match them, so skip them
            if (regNo) {
                isInCurrentData = currentStudentRegNumbers.has(regNo);
                // Return true if NOT in current data (i.e., not admitted)
                return !isInCurrentData;
            } else {
                // Skip students without Registration Number as we cannot reliably match them
                return false;
            }
        });
        
        console.log(`=== NOT ADMITTED ANALYSIS ===`);
        console.log(`Current students: ${allStudentsData.length}`);
        console.log(`Previous students (total): ${results.data.length}`);
        console.log(`Previous students (2024-25): ${results.data.filter(s => s['Acdmc Year'] === '2024-25').length}`);
        console.log(`Previous students with OUT status: ${results.data.filter(s => s['Acdmc Year'] === '2024-25' && s['Year'] === 'OUT').length}`);
        console.log(`Previous students eligible for re-admission: ${results.data.filter(s => s['Acdmc Year'] === '2024-25' && s['Year'] !== 'OUT').length}`);
        console.log(`Previous students with valid Reg No: ${results.data.filter(s => s['Acdmc Year'] === '2024-25' && s['Year'] !== 'OUT' && s['Reg No'] && s['Reg No'].toString().trim()).length}`);
        console.log(`Not admitted students: ${notAdmittedData.length}`);
        console.log('Sample current student reg nos:', allStudentsData.slice(0, 5).map(s => s['Reg No']));
        console.log('Sample previous student reg nos:', results.data.slice(0, 5).map(s => s['Reg No']));
        if (notAdmittedData.length > 0) {
            console.log('Sample not admitted students:');
            notAdmittedData.slice(0, 3).forEach((student, index) => {
                console.log(`  ${index + 1}. ${student['Student Name']} (${student['Reg No']}) - ${student['Course']}`);
            });
        }
        
        // Initialize the not admitted section
        filteredNotAdmittedData = [...notAdmittedData];
        console.log('Initializing not admitted section with', notAdmittedData.length, 'students');
        
        // Ensure DOM is ready before trying to populate
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM loaded - populating not admitted filters and display');
                populateNotAdmittedFilters();
                displayNotAdmittedStudents();
            });
        } else {
            console.log('DOM already ready - populating not admitted filters and display');
            populateNotAdmittedFilters();
            displayNotAdmittedStudents();
        }
        
    } catch (error) {
        console.error('Error loading Previous Students.csv:', error);
    }
}

// Not admitted filters event listeners
document.addEventListener('DOMContentLoaded', function() {
    const notAdmittedNameFilter = document.getElementById('notAdmittedNameFilter');
    const notAdmittedCourseFilter = document.getElementById('notAdmittedCourseFilter');
    const notAdmittedYearFilter = document.getElementById('notAdmittedYearFilter');
    const notAdmittedAdmTypeFilter = document.getElementById('notAdmittedAdmTypeFilter');
    
    if (notAdmittedNameFilter) notAdmittedNameFilter.addEventListener('input', applyNotAdmittedFilters);
    if (notAdmittedCourseFilter) notAdmittedCourseFilter.addEventListener('change', applyNotAdmittedFilters);
    if (notAdmittedYearFilter) notAdmittedYearFilter.addEventListener('change', applyNotAdmittedFilters);
    if (notAdmittedAdmTypeFilter) notAdmittedAdmTypeFilter.addEventListener('change', applyNotAdmittedFilters);
});

// Generate admission comparison summary
function generateAdmissionSummary() {
    if (!allStudentsData || allStudentsData.length === 0) {
        alert('Current students data not loaded yet. Please wait...');
        return;
    }

    // Get previous year students data (2024-25)
    let previousYearStudents = [];
    try {
        // We need to parse the Previous Students.csv again to get full data
        fetch('Previous Students.csv')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Previous Students.csv not found');
                }
                return response.text();
            })
            .then(csvText => {
                // Parse CSV manually
                const lines = csvText.split('\n').filter(line => line.trim());
                if (lines.length === 0) {
                    throw new Error('Previous Students.csv is empty');
                }
                
                const headers = parseCSVLine(lines[0]).map(h => h.trim());
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    if (values.length === 0) continue;
                    
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    data.push(row);
                }
                
                // Filter for 2024-25 students who are not OUT
                previousYearStudents = data.filter(student => 
                    student['Acdmc Year'] === '2024-25' && 
                    student['Year'] !== 'OUT' &&
                    student['Student Name'] && 
                    student['Student Name'].trim() !== ''
                );
                
                generateSummaryReport(previousYearStudents);
            })
            .catch(error => {
                console.error('Error loading previous students data:', error);
                alert('Unable to load previous students data. Please ensure Previous Students.csv file is available.');
            });
    } catch (error) {
        console.error('Error generating summary:', error);
        alert('Error generating summary. Please check console for details.');
    }
}

function generateSummaryReport(previousYearStudents) {
    // Use the already calculated notAdmittedData for accurate counts
    // Group the data from the existing calculations
    const groupedPrevious = {};
    const groupedCurrent = {};
    const groupedNotAdmitted = {};
    const newAdmissions = {};

    // Process previous year students to get total counts
    previousYearStudents.forEach(student => {
        const course = (student['Course'] || '').toUpperCase().trim();
        const year = (student['Year'] || '').trim();
        const admType = (student['Adm Type'] || '').toUpperCase().trim();
        
        // Skip 1st year students and LTRL students from 2nd year
        if (year === '1' || year === 'I' || year === '1st' || year === '1st Yr' || 
            ((year === '2' || year === 'II' || year === '2nd' || year === '2nd Yr') && admType === 'LTRL')) {
            return;
        }
        
        const key = `${year} ${course}`;
        if (!groupedPrevious[key]) {
            groupedPrevious[key] = [];
        }
        groupedPrevious[key].push(student);
    });

    // Use the actual notAdmittedData for accurate not admitted counts
    if (notAdmittedData && notAdmittedData.length > 0) {
        notAdmittedData.forEach(student => {
            const course = (student['Course'] || '').toUpperCase().trim();
            const year = (student['Year'] || '').trim();
            const admType = (student['Adm Type'] || '').toUpperCase().trim();
            
            // Skip 1st year students and LTRL students from 2nd year
            if (year === '1' || year === 'I' || year === '1st' || year === '1st Yr' || 
                ((year === '2' || year === 'II' || year === '2nd' || year === '2nd Yr') && admType === 'LTRL')) {
                return;
            }
            
            const key = `${year} ${course}`;
            if (!groupedNotAdmitted[key]) {
                groupedNotAdmitted[key] = 0;
            }
            groupedNotAdmitted[key]++;
        });
    }

    // Calculate current (readmitted) students by subtracting not admitted from total previous
    Object.keys(groupedPrevious).forEach(key => {
        const totalPrevious = groupedPrevious[key].length;
        const notAdmitted = groupedNotAdmitted[key] || 0;
        groupedCurrent[key] = totalPrevious - notAdmitted;
    });

    // Find new admissions (students in current year who were not in previous year)
    const previousStudentRegNumbers = new Set();
    previousYearStudents.forEach(s => {
        const year = (s['Year'] || '').trim();
        const admType = (s['Adm Type'] || '').toUpperCase().trim();
        
        // Only include eligible students from previous year (excluding 1st year and LTRL from 2nd year)
        if (year === '1' || year === 'I' || year === '1st' || year === '1st Yr' || 
            ((year === '2' || year === 'II' || year === '2nd' || year === '2nd Yr') && admType === 'LTRL')) {
            return;
        }
        
        const regNo = (s['Reg No'] || '').toString().trim();
        
        // Add only Reg No as the unique identifier
        if (regNo) {
            previousStudentRegNumbers.add(regNo);
        }
    });

    // Check current year students for new admissions
    allStudentsData.forEach(student => {
        const course = (student['Course'] || '').toUpperCase().trim();
        const year = (student['Year'] || '').trim();
        const admType = (student['Adm Type'] || '').toUpperCase().trim();
        
        // Skip 1st year students and LTRL students from 2nd year
        if (year === '1' || year === 'I' || year === '1st' || year === '1st Yr' || 
            ((year === '2' || year === 'II' || year === '2nd' || year === '2nd Yr') && admType === 'LTRL')) {
            return;
        }
        
        if (student['Student Name'] && student['Student Name'] !== 'ABC') {
            const regNo = (student['Reg No'] || '').toString().trim();
            
            let wasInPrevious = false;
            
            // Check if student was in previous year using ONLY Reg No
            // Only count as new admission if we have a Reg No to compare
            if (regNo) {
                wasInPrevious = previousStudentRegNumbers.has(regNo);
                
                if (!wasInPrevious) {
                    const key = `${year} ${course}`;
                    if (!newAdmissions[key]) {
                        newAdmissions[key] = 0;
                    }
                    newAdmissions[key]++;
                }
            }
        }
    });

    // Generate summary text
    let summaryPoints = [];
    let pointNumber = 1;

    // Get all unique keys and sort them
    const allKeys = new Set([
        ...Object.keys(groupedPrevious),
        ...Object.keys(groupedCurrent),
        ...Object.keys(groupedNotAdmitted),
        ...Object.keys(newAdmissions)
    ]);
    
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
        // Extract year and course for sorting
        const yearA = a.match(/(\d+)/)?.[0] || '0';
        const yearB = b.match(/(\d+)/)?.[0] || '0';
        const courseA = a.split(' ').pop();
        const courseB = b.split(' ').pop();
        
        if (yearA !== yearB) {
            return parseInt(yearA) - parseInt(yearB);
        }
        return courseA.localeCompare(courseB);
    });

    sortedKeys.forEach(key => {
        const previousCount = groupedPrevious[key] ? groupedPrevious[key].length : 0;
        const currentCount = groupedCurrent[key] || 0;
        const notAdmittedCount = groupedNotAdmitted[key] || 0;
        const newCount = newAdmissions[key] || 0;
        
        if (previousCount > 0) {
            let point = `${pointNumber}. Of the ${previousCount} students who were enrolled in ${key} during the previous year, ${currentCount} ${currentCount === 1 ? 'student has' : 'students have'} been admitted to the current year`;
            
            if (notAdmittedCount > 0) {
                point += `, while ${notAdmittedCount} ${notAdmittedCount === 1 ? 'student is' : 'students are'} yet to be admitted.`;
            } else {
                point += '.';
            }
            
            if (newCount > 0) {
                point += ` Additionally, ${newCount} new ${newCount === 1 ? 'student has' : 'students have'} been admitted to ${key} who ${newCount === 1 ? 'was' : 'were'} not enrolled in the previous year.`;
            }
            
            summaryPoints.push(point);
            pointNumber++;
        } else if (newCount > 0) {
            // Handle case where there are new admissions but no previous year students for this category
            summaryPoints.push(`${pointNumber}. For ${key}, ${newCount} new ${newCount === 1 ? 'student has' : 'students have'} been admitted who ${newCount === 1 ? 'was' : 'were'} not enrolled in the previous year.`);
            pointNumber++;
        }
    });

    if (summaryPoints.length === 0) {
        summaryPoints.push('No significant changes have been observed in admissions between the previous year and current year for the eligible categories (excluding 1st Year and LTRL students from 2nd Year).');
    }

    // Calculate overall statistics for final summary
    const overallStats = {
        totalPreviousStudents: 0,
        totalCurrentStudents: 0,
        totalNotAdmitted: 0,
        totalNewAdmissions: 0
    };

    // Sum up all categories
    sortedKeys.forEach(key => {
        overallStats.totalPreviousStudents += groupedPrevious[key] ? groupedPrevious[key].length : 0;
        overallStats.totalCurrentStudents += groupedCurrent[key] || 0;
        overallStats.totalNotAdmitted += groupedNotAdmitted[key] || 0;
        overallStats.totalNewAdmissions += newAdmissions[key] || 0;
    });

    // Calculate readmission rate
    overallStats.readmissionRate = overallStats.totalPreviousStudents > 0 ? 
        ((overallStats.totalCurrentStudents / overallStats.totalPreviousStudents) * 100).toFixed(1) : '0.0';

    showSummaryPopup(summaryPoints, overallStats);
}

function showSummaryPopup(summaryPoints, overallStats = null) {
    // Check if mobile device
    const isMobile = window.innerWidth <= 768;
    
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.id = 'summaryPopupOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: ${isMobile ? '5px' : '10px'};
        box-sizing: border-box;
    `;

    // Create popup content
    const popup = document.createElement('div');
    popup.style.cssText = `
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        max-width: ${isMobile ? '95vw' : 'min(90vw, 700px)'};
        max-height: ${isMobile ? '90vh' : 'min(85vh, 700px)'};
        overflow: hidden;
        box-shadow: var(--shadow);
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: ${isMobile ? '12px 15px' : '15px 20px'};
        border-bottom: 1px solid var(--border-color);
        background-color: var(--bg-card);
        position: sticky;
        top: 0;
        z-index: 10;
        flex-shrink: 0;
    `;

    const title = document.createElement('h2');
    title.textContent = '📊 Admission Comparison Summary';
    title.style.cssText = `
        margin: 0;
        color: var(--primary-color);
        font-size: ${isMobile ? '1.1em' : '1.2em'};
        font-weight: 600;
        flex: 1;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: var(--text-primary);
        padding: 5px;
        width: ${isMobile ? '32px' : '28px'};
        height: ${isMobile ? '32px' : '28px'};
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        flex-shrink: 0;
        margin-left: 10px;
    `;
    closeBtn.onmouseover = () => closeBtn.style.backgroundColor = 'var(--hover-bg)';
    closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'transparent';

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Create content
    const content = document.createElement('div');
    content.style.cssText = `
        padding: ${isMobile ? '12px 15px' : '15px 20px'};
        overflow-y: auto;
        flex: 1;
    `;
    
    const description = document.createElement('p');
    description.textContent = 'Comparison between Previous Year (2024-25) and Current Year (2025-26) admissions (excluding 1st Year and LTRL students from 2nd Year):';
    description.style.cssText = `
        margin-bottom: 15px;
        color: var(--text-secondary);
        font-style: italic;
        font-size: ${isMobile ? '0.8em' : '0.9em'};
        line-height: 1.4;
    `;

    const summaryList = document.createElement('ol');
    summaryList.style.cssText = `
        line-height: 1.4;
        padding-left: 18px;
        margin: 0;
        font-size: ${isMobile ? '0.8em' : '0.85em'};
    `;

    summaryPoints.forEach(point => {
        const listItem = document.createElement('li');
        listItem.textContent = point.replace(/^\d+\.\s*/, ''); // Remove numbering since <ol> handles it
        listItem.style.cssText = `
            margin-bottom: ${isMobile ? '8px' : '10px'};
            text-align: justify;
            color: var(--text-primary);
        `;
        summaryList.appendChild(listItem);
    });

    content.appendChild(description);
    content.appendChild(summaryList);

    // Add overall summary section if statistics are provided
    if (overallStats) {
        const overallSummarySection = document.createElement('div');
        overallSummarySection.style.cssText = `
            margin-top: 20px;
            padding: ${isMobile ? '12px' : '15px'};
            background-color: var(--hover-bg);
            border-radius: 6px;
            border-left: 3px solid var(--primary-color);
        `;

        const overallTitle = document.createElement('h4');
        overallTitle.textContent = '📊 Overall Summary';
        overallTitle.style.cssText = `
            margin: 0 0 10px 0;
            color: var(--primary-color);
            font-size: ${isMobile ? '0.9em' : '1em'};
            font-weight: 600;
        `;

        const statsGrid = document.createElement('div');
        statsGrid.style.cssText = `
            display: grid;
            grid-template-columns: ${isMobile ? '1fr' : '1fr 1fr'};
            gap: ${isMobile ? '8px' : '10px'};
            margin-bottom: 12px;
        `;

        const statItems = [
            { label: 'Previous Year Students', value: overallStats.totalPreviousStudents, color: '#6366f1' },
            { label: 'Re-admitted Students', value: overallStats.totalCurrentStudents, color: '#10b981' },
            { label: 'Not Yet Admitted', value: overallStats.totalNotAdmitted, color: '#f59e0b' },
            { label: 'New Admissions', value: overallStats.totalNewAdmissions, color: '#8b5cf6' }
        ];

        statItems.forEach(item => {
            const statItem = document.createElement('div');
            statItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: ${isMobile ? '6px 8px' : '8px 10px'};
                background-color: var(--bg-card);
                border-radius: 4px;
                font-size: ${isMobile ? '0.75em' : '0.8em'};
            `;

            const label = document.createElement('span');
            label.textContent = item.label;
            label.style.cssText = `
                color: var(--text-primary);
                font-weight: 500;
            `;

            const value = document.createElement('span');
            value.textContent = item.value;
            value.style.cssText = `
                color: ${item.color};
                font-weight: 600;
                font-size: 1.1em;
            `;

            statItem.appendChild(label);
            statItem.appendChild(value);
            statsGrid.appendChild(statItem);
        });

        const observations = document.createElement('div');
        observations.style.cssText = `
            font-size: ${isMobile ? '0.75em' : '0.8em'};
            line-height: 1.4;
            color: var(--text-primary);
        `;

        const readmissionText = `Re-admission Rate: ${overallStats.readmissionRate}%`;
        const totalCurrentYear = overallStats.totalCurrentStudents + overallStats.totalNewAdmissions;
        const growthRate = overallStats.totalPreviousStudents > 0 ? 
            (((totalCurrentYear / overallStats.totalPreviousStudents) - 1) * 100).toFixed(1) : '0.0';
        
        observations.innerHTML = `
            <strong>Key Observations:</strong><br>
            • ${readmissionText} of previous year students have been re-admitted<br>
            • ${overallStats.totalNotAdmitted > 0 ? `${overallStats.totalNotAdmitted} students are yet to be admitted` : 'All eligible previous year students have been re-admitted'}<br>
            • ${overallStats.totalNewAdmissions > 0 ? `${overallStats.totalNewAdmissions} new students have been admitted` : 'No new admissions recorded'}<br>
            • Overall growth: ${growthRate >= 0 ? '+' : ''}${growthRate}% compared to previous year enrollment
        `;

        overallSummarySection.appendChild(overallTitle);
        overallSummarySection.appendChild(statsGrid);
        overallSummarySection.appendChild(observations);
        content.appendChild(overallSummarySection);
    }

    // Create footer with timestamp
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: ${isMobile ? '8px 15px' : '10px 20px'};
        border-top: 1px solid var(--border-color);
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.75em;
        background-color: var(--bg-card);
        flex-shrink: 0;
    `;
    footer.textContent = `Summary generated on: ${new Date().toLocaleString()}`;

    popup.appendChild(header);
    popup.appendChild(content);
    popup.appendChild(footer);
    overlay.appendChild(popup);

    // Close functionality
    const closePopup = () => {
        document.body.removeChild(overlay);
    };

    closeBtn.onclick = closePopup;
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    };

    // Add escape key handler
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    document.body.appendChild(overlay);
}

// Student selection functionality
function clearSelection() {
    const studentCheckboxes = document.querySelectorAll('.student-checkbox');
    
    studentCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateSelectedButtons();
}

function updateSelectedButtons() {
    const selectedCheckboxes = document.querySelectorAll('.student-checkbox:checked');
    const exportSelectedBtn = document.getElementById('exportSelectedBtn');
    const saveSelectedBtn = document.getElementById('saveSelectedBtn');
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const saveAllBtn = document.getElementById('saveAllBtn');
    
    const hasSelected = selectedCheckboxes.length > 0;
    
    // Enable/disable selected buttons
    exportSelectedBtn.disabled = !hasSelected;
    saveSelectedBtn.disabled = !hasSelected;
    clearSelectionBtn.disabled = !hasSelected;
    
    // Disable/enable regular export buttons when selection is active
    exportAllBtn.disabled = hasSelected;
    saveAllBtn.disabled = hasSelected;
    
    // Update opacity for visual feedback
    if (hasSelected) {
        exportAllBtn.style.opacity = '0.4';
        saveAllBtn.style.opacity = '0.4';
    } else {
        exportAllBtn.style.opacity = '1';
        saveAllBtn.style.opacity = '1';
    }
}

function getSelectedStudents() {
    const selectedCheckboxes = document.querySelectorAll('.student-checkbox:checked');
    const selectedStudents = [];
    
    selectedCheckboxes.forEach(checkbox => {
        const index = parseInt(checkbox.getAttribute('data-index'));
        if (index >= 0 && index < filteredData.length) {
            selectedStudents.push(filteredData[index]);
        }
    });
    
    return selectedStudents;
}

function exportSelectedToCSV() {
    const selectedStudents = getSelectedStudents();
    
    if (selectedStudents.length === 0) {
        alert('No students selected');
        return;
    }
    
    const headers = ['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Status'];
    const csvContent = [
        headers.join(','),
        ...selectedStudents.map((student, index) => {
            const serialNumber = String(index + 1).padStart(2, '0');
            
            // Determine displayed admission type using mixed logic
            let displayedAdmType;
            const admCat = student['Adm Cat'] || '';
            const admTypeCol = student['Adm Type'] || '';
            
            if (admCat.trim() === 'SNQ') {
                displayedAdmType = 'SNQ';
            } else {
                if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                    displayedAdmType = admTypeCol;
                } else {
                    displayedAdmType = 'REGULAR';
                }
            }
            
            return [
                serialNumber,
                `"${student['Student Name'] || ''}"`,
                `"${student['Father Name'] || ''}"`,
                student['Year'] || '',
                student['Course'] || '',
                student['Reg No'] || '',
                displayedAdmType,
                student['Adm Cat'] || '',
                student['In/Out'] || ''
            ].join(',');
        })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SMP_Selected_Students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function saveSelectedToPDF() {
    const selectedStudents = getSelectedStudents();
    
    if (selectedStudents.length === 0) {
        alert('No students selected');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const courseFilter = document.getElementById('courseFilter').value || 'All Courses';
    const yearFilter = document.getElementById('yearFilter').value || 'All Years';
    const nameFilter = document.getElementById('nameFilter').value || 'No Name Filter';
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SMP Admn Stats 2025-26', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Selected Student Directory Report', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 105, 40, { align: 'center' });
    doc.text(`Selected Students: ${selectedStudents.length}`, 105, 46, { align: 'center' });
    
    // Filter info
    doc.setFontSize(8);
    doc.text(`Course: ${courseFilter} | Year: ${yearFilter} | Search: ${nameFilter}`, 105, 52, { align: 'center' });
    
    // Table data
    const tableData = selectedStudents.map((student, index) => {
        const serialNumber = String(index + 1).padStart(2, '0');
        
        // Determine displayed admission type using mixed logic
        let displayedAdmType;
        const admCat = student['Adm Cat'] || '';
        const admTypeCol = student['Adm Type'] || '';
        
        if (admCat.trim() === 'SNQ') {
            displayedAdmType = 'SNQ';
        } else {
            if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                displayedAdmType = admTypeCol;
            } else {
                displayedAdmType = 'REGULAR';
            }
        }
        
        return [
            serialNumber,
            student['Student Name'] || '',
            student['Father Name'] || '',
            student['Year'] || '',
            student['Course'] || '',
            student['Reg No'] || '',
            displayedAdmType,
            student['Adm Cat'] || '',
            student['In/Out'] || ''
        ];
    });
    
    doc.autoTable({
        head: [['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Status']],
        body: tableData,
        startY: 60,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 60, right: 10, bottom: 20, left: 10 },
        theme: 'striped'
    });
    
    doc.save(`SMP_Selected_Students_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ===== FEE DUES SELECTION FUNCTIONS =====

function clearDuesSelection() {
    const duesCheckboxes = document.querySelectorAll('.dues-checkbox');
    
    duesCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateDuesSelectedButtons();
}

function updateDuesSelectedButtons() {
    const selectedCheckboxes = document.querySelectorAll('.dues-checkbox:checked');
    const exportSelectedBtn = document.getElementById('exportDuesSelectedBtn');
    const saveSelectedBtn = document.getElementById('saveDuesSelectedBtn');
    const clearSelectionBtn = document.getElementById('clearDuesSelectionBtn');
    const exportAllBtn = document.getElementById('exportDuesAllBtn');
    const saveAllBtn = document.getElementById('saveDuesAllBtn');
    
    const hasSelected = selectedCheckboxes.length > 0;
    
    // Enable/disable selected buttons
    exportSelectedBtn.disabled = !hasSelected;
    saveSelectedBtn.disabled = !hasSelected;
    clearSelectionBtn.disabled = !hasSelected;
    
    // Disable/enable regular export buttons when selection is active
    exportAllBtn.disabled = hasSelected;
    saveAllBtn.disabled = hasSelected;
    
    // Update opacity for visual feedback
    if (hasSelected) {
        exportAllBtn.style.opacity = '0.4';
        saveAllBtn.style.opacity = '0.4';
    } else {
        exportAllBtn.style.opacity = '1';
        saveAllBtn.style.opacity = '1';
    }
}

function getSelectedDuesStudents() {
    const selectedCheckboxes = document.querySelectorAll('.dues-checkbox:checked');
    const selectedStudents = [];
    
    selectedCheckboxes.forEach(checkbox => {
        const index = parseInt(checkbox.getAttribute('data-index'));
        if (index >= 0 && index < filteredDuesData.length) {
            selectedStudents.push(filteredDuesData[index]);
        }
    });
    
    return selectedStudents;
}

function exportSelectedDuesToCSV() {
    const selectedStudents = getSelectedDuesStudents();
    
    if (selectedStudents.length === 0) {
        alert('No students selected');
        return;
    }
    
    const headers = ['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Status', 'SMP Alloted', 'SVK Alloted', 'SMP Paid', 'SVK Paid', 'SMP Due', 'SVK Due', 'Total Alloted', 'Total Paid', 'Total Dues'];
    const csvContent = [
        headers.join(','),
        ...selectedStudents.map((student, index) => {
            const serialNumber = String(index + 1).padStart(2, '0');
            
            return [
                serialNumber,
                `"${student['Student Name'] || ''}"`,
                `"${student['Father Name'] || ''}"`,
                student['Year'] || '',
                student['Course'] || '',
                student['Reg No'] || '',
                student['Adm Type'] || '',
                student['Adm Cat'] || '',
                student['In/Out'] || '',
                student['SMP Alloted'] || 0,
                student['SVK Alloted'] || 0,
                student['SMP Paid'] || 0,
                student['SVK Paid'] || 0,
                student['SMP Due'] || 0,
                student['SVK Due'] || 0,
                student['Total Alloted'] || 0,
                student['Total Paid'] || 0,
                student['Total Dues'] || 0
            ].join(',');
        })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SMP_Selected_Dues_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function saveSelectedDuesToPDF() {
    const selectedStudents = getSelectedDuesStudents();
    
    if (selectedStudents.length === 0) {
        alert('No students selected');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better fit
    
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Selected Fee Dues Report', 148, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 148, 40, { align: 'center' });
    doc.text(`Selected Students: ${selectedStudents.length}`, 148, 46, { align: 'center' });
    
    // Table data
    const tableData = selectedStudents.map((student, index) => {
        const serialNumber = String(index + 1).padStart(2, '0');
        
        return [
            serialNumber,
            student['Student Name'] || '',
            student['Year'] || '',
            student['Course'] || '',
            student['Reg No'] || '',
            '₹' + (student['SMP Alloted'] || 0).toLocaleString('en-IN'),
            '₹' + (student['SVK Alloted'] || 0).toLocaleString('en-IN'),
            '₹' + (student['SMP Paid'] || 0).toLocaleString('en-IN'),
            '₹' + (student['SVK Paid'] || 0).toLocaleString('en-IN'),
            '₹' + (student['SMP Due'] || 0).toLocaleString('en-IN'),
            '₹' + (student['SVK Due'] || 0).toLocaleString('en-IN'),
            '₹' + (student['Total Dues'] || 0).toLocaleString('en-IN')
        ];
    });
    
    doc.autoTable({
        head: [['Sl No', 'Student Name', 'Year', 'Course', 'Reg No', 'SMP Alloted', 'SVK Alloted', 'SMP Paid', 'SVK Paid', 'SMP Due', 'SVK Due', 'Total Dues']],
        body: tableData,
        startY: 60,
        styles: { fontSize: 6, cellPadding: 1 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 60, right: 10, bottom: 20, left: 10 },
        theme: 'striped'
    });
    
    doc.save(`SMP_Selected_Dues_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ===== NOT ADMITTED SELECTION FUNCTIONS =====

function clearNotAdmittedSelection() {
    const notAdmittedCheckboxes = document.querySelectorAll('.notadmitted-checkbox');
    
    notAdmittedCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateNotAdmittedSelectedButtons();
}

function updateNotAdmittedSelectedButtons() {
    const selectedCheckboxes = document.querySelectorAll('.notadmitted-checkbox:checked');
    const exportSelectedBtn = document.getElementById('exportNotAdmittedSelectedBtn');
    const saveSelectedBtn = document.getElementById('saveNotAdmittedSelectedBtn');
    const clearSelectionBtn = document.getElementById('clearNotAdmittedSelectionBtn');
    const exportAllBtn = document.getElementById('exportNotAdmittedAllBtn');
    const saveAllBtn = document.getElementById('saveNotAdmittedAllBtn');
    
    const hasSelected = selectedCheckboxes.length > 0;
    
    // Enable/disable selected buttons
    exportSelectedBtn.disabled = !hasSelected;
    saveSelectedBtn.disabled = !hasSelected;
    clearSelectionBtn.disabled = !hasSelected;
    
    // Disable/enable regular export buttons when selection is active
    exportAllBtn.disabled = hasSelected;
    saveAllBtn.disabled = hasSelected;
    
    // Update opacity for visual feedback
    if (hasSelected) {
        exportAllBtn.style.opacity = '0.4';
        saveAllBtn.style.opacity = '0.4';
    } else {
        exportAllBtn.style.opacity = '1';
        saveAllBtn.style.opacity = '1';
    }
}

function getSelectedNotAdmittedStudents() {
    const selectedCheckboxes = document.querySelectorAll('.notadmitted-checkbox:checked');
    const selectedStudents = [];
    
    selectedCheckboxes.forEach(checkbox => {
        const index = parseInt(checkbox.getAttribute('data-index'));
        if (index >= 0 && index < filteredNotAdmittedData.length) {
            selectedStudents.push(filteredNotAdmittedData[index]);
        }
    });
    
    return selectedStudents;
}

function exportSelectedNotAdmittedToCSV() {
    const selectedStudents = getSelectedNotAdmittedStudents();
    
    if (selectedStudents.length === 0) {
        alert('No students selected');
        return;
    }
    
    const headers = ['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Academic Year', 'Status'];
    const csvContent = [
        headers.join(','),
        ...selectedStudents.map((student, index) => {
            const serialNumber = String(index + 1).padStart(2, '0');
            
            return [
                serialNumber,
                `"${student['Student Name'] || ''}"`,
                `"${student['Father Name'] || ''}"`,
                student['Year'] || '',
                student['Course'] || '',
                student['Reg No'] || '',
                student['Adm Type'] || '',
                student['Adm Cat'] || student['Admn Cat'] || '',
                student['Acdmc Year'] || '',
                student['In/Out'] || 'Not Admitted'
            ].join(',');
        })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SMP_Selected_NotAdmitted_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function saveSelectedNotAdmittedToPDF() {
    const selectedStudents = getSelectedNotAdmittedStudents();
    
    if (selectedStudents.length === 0) {
        alert('No students selected');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SMP Admn Stats 2025-26', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Selected Not Admitted Students Report', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 105, 40, { align: 'center' });
    doc.text(`Selected Students: ${selectedStudents.length}`, 105, 46, { align: 'center' });
    
    // Table data
    const tableData = selectedStudents.map((student, index) => {
        const serialNumber = String(index + 1).padStart(2, '0');
        
        return [
            serialNumber,
            student['Student Name'] || '',
            student['Father Name'] || '',
            student['Year'] || '',
            student['Course'] || '',
            student['Reg No'] || '',
            student['Adm Type'] || '',
            student['Adm Cat'] || student['Admn Cat'] || '',
            student['Acdmc Year'] || '',
            student['In/Out'] || 'Not Admitted'
        ];
    });
    
    doc.autoTable({
        head: [['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Academic Year', 'Status']],
        body: tableData,
        startY: 60,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 60, right: 10, bottom: 20, left: 10 },
        theme: 'striped'
    });
    
    doc.save(`SMP_Selected_NotAdmitted_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ============================================
// FEE LIST FUNCTIONALITY
// ============================================

let feeListData = [];
let filteredFeeListData = [];

// Populate Fee List with all students data using same aggregation logic as Fee Dues List
function populateFeeList() {
    console.log('=== POPULATING FEE LIST ===');
    
    // Use the same grouping logic as processDuesData() but include ALL students
    const studentGroups = {};
    
    allStudentsData.forEach(student => {
        const regNo = student['Reg No'] || student['Registration No'] || '';
        const course = student['Course'] || '';
        
        if (!regNo || !course) return;
        
        // For EE course, use Reg No + Course as unique key to avoid conflicts
        // For other courses (CE, ME, EC, CS), use only Reg No
        let uniqueKey;
        if (course.toUpperCase() === 'EE') {
            uniqueKey = `${regNo}_${course}`; // EE students grouped by Reg No + Course
        } else {
            uniqueKey = regNo; // Other courses grouped by Reg No only
        }
        
        if (!studentGroups[uniqueKey]) {
            studentGroups[uniqueKey] = [];
        }
        studentGroups[uniqueKey].push(student);
    });
    
    console.log(`Found ${Object.keys(studentGroups).length} unique student groups for Fee List`);
    
    feeListData = [];
    
    Object.entries(studentGroups).forEach(([uniqueKey, records]) => {
        if (records.length === 0) return;
        
        // Use the first record for basic student info (should be same across installments)
        const baseStudent = records[0];
        const course = baseStudent['Course'] || '';
        const regNo = baseStudent['Reg No'] || '';
        
        // Parse financial fields with robust number extraction (same logic as processDuesData)
        const parseAmount = (value) => {
            if (!value || value === '') return 0;
            // Handle both string and number inputs
            const cleanValue = value.toString().replace(/[^\d.-]/g, '');
            const num = parseFloat(cleanValue);
            return isNaN(num) ? 0 : Math.abs(num); // Use absolute value to handle any negative signs
        };
        
        // Aggregate all payments across multiple installment records for this unique key
        let totalPaidSMP = 0;
        let totalPaidSVK = 0;
        
        // Sum all installment payments for this unique identifier
        records.forEach(record => {
            totalPaidSMP += parseAmount(record['SMP Paid']);
            totalPaidSVK += parseAmount(record['SVK Paid']);
        });
        
        // Get allotted amounts (should be same across all records for same student)
        const allotedSMP = parseAmount(baseStudent['Alloted Fee SMP']);
        const allotedSVK = parseAmount(baseStudent['Alloted Fee SVK']);
        
        // Calculate dues for each fee type
        const duesSMP = Math.max(0, allotedSMP - totalPaidSMP);
        const duesSVK = Math.max(0, allotedSVK - totalPaidSVK);
        
        const totalAlloted = allotedSMP + allotedSVK;
        const totalPaid = totalPaidSMP + totalPaidSVK;
        const totalDues = duesSMP + duesSVK;
        
        // Determine payment status
        let paymentStatus = 'Paid';
        if (totalDues > 0) {
            paymentStatus = totalPaid > 0 ? 'Partial' : 'Due';
        }
        
        // Mixed admission type logic (same as processDuesData)
        let normalizedAdmType;
        const admCat = baseStudent['Adm Cat'] || '';
        const admTypeCol = baseStudent['Adm Type'] || '';
        
        if (admCat.trim() === 'SNQ') {
            normalizedAdmType = 'SNQ';
        } else {
            // Use Adm Type for Regular, LTRL, RPTR
            if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                normalizedAdmType = admTypeCol;
            } else {
                normalizedAdmType = 'REGULAR';
            }
        }
        
        const feeListStudent = {
            'Student Name': baseStudent['Student Name'] || '',
            'Father Name': baseStudent['Father Name'] || '',
            'Year': baseStudent['Year'] || '',
            'Course': course,
            'Reg No': regNo,
            'Adm Type': normalizedAdmType,
            'Adm Cat': baseStudent['Adm Cat'] || '',
            'In/Out': baseStudent['In/Out'] || 'In',
            'Date': baseStudent['Date'] || '',
            'Rpt': baseStudent['Rpt'] || '',
            'SMP Alloted': allotedSMP,
            'SVK Alloted': allotedSVK,
            'SMP Paid': totalPaidSMP,
            'SVK Paid': totalPaidSVK,
            'SMP Due': duesSMP,
            'SVK Due': duesSVK,
            'Total Alloted': totalAlloted,
            'Total Paid': totalPaid,
            'Total Dues': totalDues,
            'Payment Status': paymentStatus,
            'Payment Records': records.length,
            'Unique Key': uniqueKey
        };
        
        // Include ALL students (both with and without dues) - this is the key difference from processDuesData
        feeListData.push(feeListStudent);
    });
    
    // Sort by course first, then by student name (same as processDuesData)
    feeListData.sort((a, b) => {
        const courseCompare = a['Course'].localeCompare(b['Course']);
        if (courseCompare !== 0) return courseCompare;
        
        const nameA = (a['Student Name'] || '').toLowerCase();
        const nameB = (b['Student Name'] || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    filteredFeeListData = [...feeListData];
    console.log('Fee List populated with', feeListData.length, 'students (aggregated from', allStudentsData.length, 'records)');
    console.log('Students with dues:', feeListData.filter(s => s['Total Dues'] > 0).length);
    console.log('Students fully paid:', feeListData.filter(s => s['Total Dues'] === 0).length);
    
    populateFeeListFilters();
    displayFeeList();
    generateFeeListMetrics();
}

// Populate filters for Fee List
function populateFeeListFilters() {
    const courses = [...new Set(feeListData.map(s => s['Course']))].sort();
    const years = [...new Set(feeListData.map(s => s['Year']))].sort();
    const admTypes = [...new Set(feeListData.map(s => s['Adm Type']).filter(type => type))].sort();

    const courseFilter = document.getElementById('feeListCourseFilter');
    const yearFilter = document.getElementById('feeListYearFilter');
    const admTypeFilter = document.getElementById('feeListAdmTypeFilter');

    courseFilter.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
        courseFilter.innerHTML += `<option value="${course}">${course}</option>`;
    });

    yearFilter.innerHTML = '<option value="">All Years</option>';
    years.forEach(year => {
        yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
    });

    admTypeFilter.innerHTML = '<option value="">All Types</option>';
    admTypes.forEach(admType => {
        admTypeFilter.innerHTML += `<option value="${admType}">${admType}</option>`;
    });
}

// Apply filters for Fee List
function applyFeeListFilters() {
    const courseFilter = document.getElementById('feeListCourseFilter').value;
    const yearFilter = document.getElementById('feeListYearFilter').value;
    const admTypeFilter = document.getElementById('feeListAdmTypeFilter').value;
    const statusFilter = document.getElementById('feeListStatusFilter').value;
    const nameFilter = document.getElementById('feeListNameFilter').value.toLowerCase();

    filteredFeeListData = feeListData.filter(student => {
        const matchesCourse = !courseFilter || student['Course'] === courseFilter;
        const matchesYear = !yearFilter || student['Year'] === yearFilter;
        const matchesAdmType = !admTypeFilter || student['Adm Type'] === admTypeFilter;
        const matchesStatus = !statusFilter || student['Payment Status'] === statusFilter;
        const matchesName = !nameFilter || 
            student['Student Name']?.toLowerCase().includes(nameFilter) ||
            student['Father Name']?.toLowerCase().includes(nameFilter) ||
            student['Reg No']?.toLowerCase().includes(nameFilter);

        return matchesCourse && matchesYear && matchesAdmType && matchesStatus && matchesName;
    });

    displayFeeList();
    generateFeeListMetrics();
}

// Display Fee List
function displayFeeList() {
    const tbody = document.querySelector('#feeListTable tbody');
    tbody.innerHTML = '';

    if (filteredFeeListData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="21" class="no-data">No students found</td></tr>';
        return;
    }

    filteredFeeListData.forEach((student, index) => {
        const serialNumber = String(index + 1).padStart(2, '0');
        const row = document.createElement('tr');
        
        const formatAmount = (amount) => {
            return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        };

        row.innerHTML = `
            <td class="checkbox-cell">
                <input type="checkbox" class="student-checkbox" data-student-id="${index}" 
                       onchange="updateFeeListSelectionButtons()">
            </td>
            <td>${serialNumber}</td>
            <td>${student['Student Name'] || ''}</td>
            <td>${student['Father Name'] || ''}</td>
            <td>${student['Year'] || ''}</td>
            <td class="${getCourseColorClass(student['Course'] || '')}">${student['Course'] || ''}</td>
            <td>${student['Reg No'] || ''}</td>
            <td class="admission-type ${getAdmissionTypeClass(student['Adm Type'])}">${student['Adm Type'] || ''}</td>
            <td>${student['Adm Cat'] || ''}</td>
            <td>${student['In/Out'] || ''}</td>
            <td>${student['Date'] || ''}</td>
            <td>${student['Rpt'] || ''}</td>
            <td class="amount">${formatAmount(student['SMP Alloted'])}</td>
            <td class="amount">${formatAmount(student['SVK Alloted'])}</td>
            <td class="amount">${formatAmount(student['SMP Paid'])}</td>
            <td class="amount">${formatAmount(student['SVK Paid'])}</td>
            <td class="amount ${student['SMP Due'] > 0 ? 'due-amount' : ''}">${formatAmount(student['SMP Due'])}</td>
            <td class="amount ${student['SVK Due'] > 0 ? 'due-amount' : ''}">${formatAmount(student['SVK Due'])}</td>
            <td class="amount">${formatAmount(student['Total Alloted'])}</td>
            <td class="amount">${formatAmount(student['Total Paid'])}</td>
            <td class="amount ${student['Total Dues'] > 0 ? 'due-amount' : ''}">${formatAmount(student['Total Dues'])}</td>
        `;

        tbody.appendChild(row);
    });
    
    // Add total row
    if (filteredFeeListData.length > 0) {
        const formatAmount = (amount) => {
            return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        };
        
        // Calculate totals
        const totals = {
            smpAlloted: filteredFeeListData.reduce((sum, s) => sum + s['SMP Alloted'], 0),
            svkAlloted: filteredFeeListData.reduce((sum, s) => sum + s['SVK Alloted'], 0),
            smpPaid: filteredFeeListData.reduce((sum, s) => sum + s['SMP Paid'], 0),
            svkPaid: filteredFeeListData.reduce((sum, s) => sum + s['SVK Paid'], 0),
            smpDue: filteredFeeListData.reduce((sum, s) => sum + s['SMP Due'], 0),
            svkDue: filteredFeeListData.reduce((sum, s) => sum + s['SVK Due'], 0),
            totalAlloted: filteredFeeListData.reduce((sum, s) => sum + s['Total Alloted'], 0),
            totalPaid: filteredFeeListData.reduce((sum, s) => sum + s['Total Paid'], 0),
            totalDues: filteredFeeListData.reduce((sum, s) => sum + s['Total Dues'], 0)
        };
        
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td class="checkbox-cell"></td>
            <td><strong>TOTAL</strong></td>
            <td colspan="10"><strong>Students: ${filteredFeeListData.length}</strong></td>
            <td class="amount total-amount"><strong>${formatAmount(totals.smpAlloted)}</strong></td>
            <td class="amount total-amount"><strong>${formatAmount(totals.svkAlloted)}</strong></td>
            <td class="amount total-amount"><strong>${formatAmount(totals.smpPaid)}</strong></td>
            <td class="amount total-amount"><strong>${formatAmount(totals.svkPaid)}</strong></td>
            <td class="amount total-amount ${totals.smpDue > 0 ? 'due-amount' : ''}"><strong>${formatAmount(totals.smpDue)}</strong></td>
            <td class="amount total-amount ${totals.svkDue > 0 ? 'due-amount' : ''}"><strong>${formatAmount(totals.svkDue)}</strong></td>
            <td class="amount total-amount"><strong>${formatAmount(totals.totalAlloted)}</strong></td>
            <td class="amount total-amount"><strong>${formatAmount(totals.totalPaid)}</strong></td>
            <td class="amount total-amount ${totals.totalDues > 0 ? 'due-amount' : ''}"><strong>${formatAmount(totals.totalDues)}</strong></td>
        `;
        
        tbody.appendChild(totalRow);
    }
}

// Generate metrics for Fee List
function generateFeeListMetrics() {
    const metricsGrid = document.getElementById('feeListMetricsGrid');
    metricsGrid.innerHTML = '';

    const totalStudents = filteredFeeListData.length;
    const fullyPaidStudents = filteredFeeListData.filter(s => s['Payment Status'] === 'Paid').length;
    const partiallyPaidStudents = filteredFeeListData.filter(s => s['Payment Status'] === 'Partial').length;
    const dueStudents = filteredFeeListData.filter(s => s['Payment Status'] === 'Due').length;
    
    const totalAlloted = filteredFeeListData.reduce((sum, s) => sum + s['Total Alloted'], 0);
    const totalPaid = filteredFeeListData.reduce((sum, s) => sum + s['Total Paid'], 0);
    const totalDues = filteredFeeListData.reduce((sum, s) => sum + s['Total Dues'], 0);

    const formatAmount = (amount) => {
        return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    const metrics = [
        { label: 'Total Students', value: totalStudents, color: 'var(--primary-color)' },
        { label: 'Fully Paid', value: fullyPaidStudents, color: 'var(--success-color)' },
        { label: 'Partially Paid', value: partiallyPaidStudents, color: 'var(--warning-color)' },
        { label: 'Dues Pending', value: dueStudents, color: 'var(--error-color)' },
        { label: 'Total Alloted', value: formatAmount(totalAlloted), color: 'var(--info-color)' },
        { label: 'Total Paid', value: formatAmount(totalPaid), color: 'var(--success-color)' },
        { label: 'Total Dues', value: formatAmount(totalDues), color: 'var(--error-color)' }
    ];

    metrics.forEach(metric => {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.innerHTML = `
            <h3 style="color: ${metric.color};">${metric.value}</h3>
            <p>${metric.label}</p>
        `;
        metricsGrid.appendChild(card);
    });
}

// Clear Fee List filters
function clearFeeListFilters() {
    document.getElementById('feeListCourseFilter').value = '';
    document.getElementById('feeListYearFilter').value = '';
    document.getElementById('feeListAdmTypeFilter').value = '';
    document.getElementById('feeListStatusFilter').value = '';
    document.getElementById('feeListNameFilter').value = '';
    filteredFeeListData = [...feeListData];
    displayFeeList();
    generateFeeListMetrics();
}

// Update selection buttons for Fee List
function updateFeeListSelectionButtons() {
    const checkboxes = document.querySelectorAll('#feeListTable .student-checkbox');
    const checkedBoxes = document.querySelectorAll('#feeListTable .student-checkbox:checked');
    
    const clearBtn = document.getElementById('clearFeeListSelectionBtn');
    const exportSelectedBtn = document.getElementById('exportFeeListSelectedBtn');
    const saveSelectedBtn = document.getElementById('saveFeeListSelectedBtn');
    
    const hasSelection = checkedBoxes.length > 0;
    
    clearBtn.disabled = !hasSelection;
    exportSelectedBtn.disabled = !hasSelection;
    saveSelectedBtn.disabled = !hasSelection;
}

// Clear Fee List selection
function clearFeeListSelection() {
    const checkboxes = document.querySelectorAll('#feeListTable .student-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    updateFeeListSelectionButtons();
}

// Export Fee List to CSV
function exportFeeListToCSV() {
    if (!confirm('📥 Export Fee List to CSV?')) return;
    
    const headers = [
        'Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Status', 'Date', 'Rpt',
        'SMP Alloted', 'SVK Alloted', 'SMP Paid', 'SVK Paid', 'SMP Due', 'SVK Due',
        'Total Alloted', 'Total Paid', 'Total Dues'
    ];
    
    const csvContent = [headers.join(',')];
    
    filteredFeeListData.forEach((student, index) => {
        const row = [
            String(index + 1).padStart(2, '0'),
            `"${student['Student Name'] || ''}"`,
            `"${student['Father Name'] || ''}"`,
            student['Year'] || '',
            student['Course'] || '',
            student['Reg No'] || '',
            student['Adm Type'] || '',
            student['Adm Cat'] || '',
            student['In/Out'] || '',
            student['Date'] || '',
            student['Rpt'] || '',
            student['SMP Alloted'] || 0,
            student['SVK Alloted'] || 0,
            student['SMP Paid'] || 0,
            student['SVK Paid'] || 0,
            student['SMP Due'] || 0,
            student['SVK Due'] || 0,
            student['Total Alloted'] || 0,
            student['Total Paid'] || 0,
            student['Total Dues'] || 0
        ];
        csvContent.push(row.join(','));
    });
    
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SMP_Fee_List_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Export selected Fee List to CSV
function exportSelectedFeeListToCSV() {
    const checkedBoxes = document.querySelectorAll('#feeListTable .student-checkbox:checked');
    if (checkedBoxes.length === 0) {
        alert('Please select students to export.');
        return;
    }
    
    if (!confirm(`📥 Export ${checkedBoxes.length} selected students to CSV?`)) return;
    
    const selectedStudents = Array.from(checkedBoxes).map(cb => {
        const index = parseInt(cb.getAttribute('data-student-id'));
        return filteredFeeListData[index];
    });
    
    const headers = [
        'Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Adm Type', 'Adm Cat', 'Status', 'Date', 'Rpt',
        'SMP Alloted', 'SVK Alloted', 'SMP Paid', 'SVK Paid', 'SMP Due', 'SVK Due',
        'Total Alloted', 'Total Paid', 'Total Dues'
    ];
    
    const csvContent = [headers.join(',')];
    
    selectedStudents.forEach((student, index) => {
        const row = [
            String(index + 1).padStart(2, '0'),
            `"${student['Student Name'] || ''}"`,
            `"${student['Father Name'] || ''}"`,
            student['Year'] || '',
            student['Course'] || '',
            student['Reg No'] || '',
            student['Adm Type'] || '',
            student['Adm Cat'] || '',
            student['In/Out'] || '',
            student['Date'] || '',
            student['Rpt'] || '',
            student['SMP Alloted'] || 0,
            student['SVK Alloted'] || 0,
            student['SMP Paid'] || 0,
            student['SVK Paid'] || 0,
            student['SMP Due'] || 0,
            student['SVK Due'] || 0,
            student['Total Alloted'] || 0,
            student['Total Paid'] || 0,
            student['Total Dues'] || 0
        ];
        csvContent.push(row.join(','));
    });
    
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SMP_Selected_Fee_List_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Save Fee List to PDF
function saveFeeListToPDF() {
    if (!confirm('📄 Save Fee List as PDF?')) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4 mode
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Fee List - Consolidated View', 148, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 148, 32, { align: 'center' });
    doc.text(`Total Students: ${filteredFeeListData.length}`, 148, 38, { align: 'center' });
    
    // Table data
    const tableData = filteredFeeListData.map((student, index) => {
        const serialNumber = String(index + 1).padStart(2, '0');
        const formatAmount = (amount) => '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
        
        return [
            serialNumber,
            student['Student Name'] || '',
            student['Father Name'] || '',
            student['Year'] || '',
            student['Course'] || '',
            student['Reg No'] || '',
            student['Adm Type'] || '',
            student['Adm Cat'] || '',
            student['In/Out'] || '',
            student['Date'] || '',
            student['Rpt'] || '',
            formatAmount(student['Total Alloted']),
            formatAmount(student['Total Paid']),
            formatAmount(student['Total Dues'])
        ];
    });
    
    doc.autoTable({
        head: [['Sl', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Type', 'Cat', 'Status', 'Date', 'Rpt', 'Total Alloted', 'Total Paid', 'Total Dues']],
        body: tableData,
        startY: 45,
        styles: { 
            fontSize: 7, 
            cellPadding: 2,
            overflow: 'ellipsize',
            cellWidth: 'wrap'
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 7
        },
        columnStyles: {
            0: { cellWidth: 10 },  // Sl No
            1: { cellWidth: 35 },  // Student Name (increased)
            2: { cellWidth: 25 },  // Father Name (increased)
            3: { cellWidth: 15 },  // Year (increased)
            4: { cellWidth: 12 },  // Course (increased)
            5: { cellWidth: 20 },  // Reg No (increased)
            6: { cellWidth: 15 },  // Adm Type (increased)
            7: { cellWidth: 12 },  // Adm Cat (increased)
            8: { cellWidth: 12 },  // Status (increased)
            9: { cellWidth: 20 },  // Date (increased)
            10: { cellWidth: 10 }, // Rpt (increased)
            11: { cellWidth: 28, halign: 'left' }, // Total Alloted (left aligned)
            12: { cellWidth: 28, halign: 'left' }, // Total Paid (left aligned)
            13: { cellWidth: 28, halign: 'left' }  // Total Dues (left aligned)
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 45, right: 5, bottom: 15, left: 5 },
        theme: 'striped'
    });
    
    doc.save(`SMP_Fee_List_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Save selected Fee List to PDF
function saveSelectedFeeListToPDF() {
    const checkedBoxes = document.querySelectorAll('#feeListTable .student-checkbox:checked');
    if (checkedBoxes.length === 0) {
        alert('Please select students to save as PDF.');
        return;
    }
    
    if (!confirm(`📄 Save ${checkedBoxes.length} selected students as PDF?`)) return;
    
    const selectedStudents = Array.from(checkedBoxes).map(cb => {
        const index = parseInt(cb.getAttribute('data-student-id'));
        return filteredFeeListData[index];
    });
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4 mode
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Selected Fee List Report', 148, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 148, 32, { align: 'center' });
    doc.text(`Selected Students: ${selectedStudents.length}`, 148, 38, { align: 'center' });
    
    // Table data
    const tableData = selectedStudents.map((student, index) => {
        const serialNumber = String(index + 1).padStart(2, '0');
        const formatAmount = (amount) => '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
        
        return [
            serialNumber,
            student['Student Name'] || '',
            student['Father Name'] || '',
            student['Year'] || '',
            student['Course'] || '',
            student['Reg No'] || '',
            student['Adm Type'] || '',
            student['Adm Cat'] || '',
            student['In/Out'] || '',
            student['Date'] || '',
            student['Rpt'] || '',
            formatAmount(student['Total Alloted']),
            formatAmount(student['Total Paid']),
            formatAmount(student['Total Dues'])
        ];
    });
    
    doc.autoTable({
        head: [['Sl', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Type', 'Cat', 'Status', 'Date', 'Rpt', 'Total Alloted', 'Total Paid', 'Total Dues']],
        body: tableData,
        startY: 45,
        styles: { 
            fontSize: 7, 
            cellPadding: 2,
            overflow: 'ellipsize',
            cellWidth: 'wrap'
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 7
        },
        columnStyles: {
            0: { cellWidth: 10 },  // Sl No
            1: { cellWidth: 35 },  // Student Name (increased)
            2: { cellWidth: 25 },  // Father Name (increased)
            3: { cellWidth: 15 },  // Year (increased)
            4: { cellWidth: 12 },  // Course (increased)
            5: { cellWidth: 20 },  // Reg No (increased)
            6: { cellWidth: 15 },  // Adm Type (increased)
            7: { cellWidth: 12 },  // Adm Cat (increased)
            8: { cellWidth: 12 },  // Status (increased)
            9: { cellWidth: 20 },  // Date (increased)
            10: { cellWidth: 10 }, // Rpt (increased)
            11: { cellWidth: 28, halign: 'left' }, // Total Alloted (left aligned)
            12: { cellWidth: 28, halign: 'left' }, // Total Paid (left aligned)
            13: { cellWidth: 28, halign: 'left' }  // Total Dues (left aligned)
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 45, right: 5, bottom: 15, left: 5 },
        theme: 'striped'
    });
    
    doc.save(`SMP_Selected_Fee_List_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Event listeners for Fee List
document.getElementById('feeListNameFilter').addEventListener('input', applyFeeListFilters);
document.getElementById('feeListCourseFilter').addEventListener('change', applyFeeListFilters);
document.getElementById('feeListYearFilter').addEventListener('change', applyFeeListFilters);
document.getElementById('feeListAdmTypeFilter').addEventListener('change', applyFeeListFilters);
document.getElementById('feeListStatusFilter').addEventListener('change', applyFeeListFilters);

// Apply uppercase conversion to Fee List search input
makeUppercaseOnInput(document.getElementById('feeListNameFilter'));

// Helper functions for styling
function getCourseColorClass(course) {
    if (!course) return '';
    return course.toLowerCase();
}

function getAdmissionTypeClass(admType) {
    if (!admType) return '';
    return 'admtype-' + admType.toLowerCase();
}