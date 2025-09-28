let studentsData = [];
let allStudentsData = []; // Store all students including those with dues
let filteredData = [];
let filteredDuesData = [];
let duesData = [];
let previousStudentsData = []; // Store previous year students
let notAdmittedData = [];
let filteredNotAdmittedData = [];
let examFeeData = []; // Store exam fee data
let filteredExamFeeData = [];
let examFeeStorage = {}; // Store exam fee payments locally
let selectedExamFeeStudent = null; // Currently selected student for context menu
let lastContextMenuPosition = { x: 0, y: 0 }; // Store context menu position
let examFeeDialogKeyHandler = null; // Store the Enter key handler reference
let popupTimer = null;
let searchPopupTimer = null;
let messageIndex = 0;
let paymentOfSharesData = []; // Store payment of shares data
const TOTAL_INTAKE_PER_COURSE = 63;

// JSONhost configuration for persistent storage
const JSONHOST_API_KEY = 'w1he0onjv4fssfinwxquhoxif3z1llcw'; // Replace with your JSONhost API token
const JSONHOST_JSON_ID = '1a167691ed974abc8def5c4d486b7a23'; // Replace with your JSON ID from JSONhost

// JSONHost.com configuration for exam fee data storage
const JSONHOST_EXAMFEE_API_KEY = '9c62stzkiuuzpikwh6ebhaluwrix08qz'; // Replace with your JSONHost.com API token
const JSONHOST_EXAMFEE_JSON_ID = '9c4b555c45279f66b2d218e38a64e8a1'; // Replace with your JSONHost.com JSON ID

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
function showSection(sectionName, event) {
    // If switching to fee list section, check access control FIRST
    if (sectionName === 'feelist') {
        const accessKey = prompt('🔐 Enter access key to view Fee List:');
        if (accessKey === null || accessKey === '' || accessKey !== 'teju2015') {
            alert('❌ Access denied. Invalid access key.');
            // Don't switch sections, exit immediately
            return;
        }
    }
    
    // If switching to fee statistics section, check access control FIRST
    if (sectionName === 'feestats') {
        const accessKey = prompt('🔐 Enter access key to view Fee Statistics:');
        if (accessKey === null || accessKey === '' || accessKey !== 'teju2015') {
            alert('❌ Access denied. Invalid access key.');
            // Don't switch sections, exit immediately
            return;
        }
    }
    
    // If switching to fee distribution section, check access control FIRST
    if (sectionName === 'feedistribution') {
        const accessKey = prompt('🔐 Enter access key to view Fee Distribution:');
        if (accessKey === null || accessKey === '' || accessKey !== 'teju2015') {
            alert('❌ Access denied. Invalid access key.');
            // Don't switch sections, exit immediately
            return;
        }
    }
    
    // If switching to exam fee section, check access control FIRST
    if (sectionName === 'examfee') {
        const accessKey = prompt('🔐 Enter access key to view Exam Fee:');
        if (accessKey === null || accessKey === '' || accessKey !== 'anni*exam') {
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
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // If switching to students section, display student list
    if (sectionName === 'students') {
        if (studentsData.length > 0) {
            displayStudentList();
        }
    }

    // If switching to dues section, display dues list
    if (sectionName === 'dues') {
        if (duesData.length > 0) {
            displayDuesList();
        }
    }

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
            closeSearchResultsPopup();
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
        
        // Parse CSV and process data
        parseCSV(csvText);
        updateLastModifiedDate();
        hideLoading();

        // Initialize dashboard after data is loaded and UI is visible
        displayDashboard();
        
        // Show data info popup after successful loading
        showDataInfoPopup();
        
        // Defer heavy processing to next tick for better perceived performance
        setTimeout(() => {
            // Load not admitted students data in background
            loadNotAdmittedData();
            // Load payment of shares data
            loadPaymentOfSharesData();
        }, 100);

    } catch (error) {
        console.error('Error loading CSV file:', error);
        showError('Could not load students.csv file. Make sure the file exists in the same directory.');
    }
}

// Load Payment of Shares data from CSV
async function loadPaymentOfSharesData() {
    try {
        const response = await fetch('Payment of Shares.csv');

        if (!response.ok) {
            console.warn('Payment of Shares.csv not found, payment analysis will not be available');
            return;
        }

        const csvText = await response.text();
        parsePaymentOfSharesCSV(csvText);

    } catch (error) {
        console.warn('Error loading Payment of Shares.csv:', error);
    }
}

// Parse Payment of Shares CSV data
function parsePaymentOfSharesCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        return;
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim());

    paymentOfSharesData = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            const values = parseCSVLine(line);
            const payment = {};

            headers.forEach((header, index) => {
                payment[header] = values[index] ? values[index].trim() : '';
            });

            // Convert payment amount to number
            if (payment['Payment Amt']) {
                payment['Payment Amt'] = parseFloat(payment['Payment Amt'].replace(/,/g, '')) || 0;
            }

            paymentOfSharesData.push(payment);

        } catch (error) {
            console.warn('Error parsing payment line:', line, error);
        }
    }

    console.log('Payment of Shares data loaded:', paymentOfSharesData.length, 'records');
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
    document.getElementById('dashboard').classList.remove('hidden');
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

// Automatic correction function for 1st Year SNQ students
function correctSNQFees(student) {
    // Check if this is a 1st Year SNQ student
    const year = student['Year'] || '';
    const admCat = student['Adm Cat'] || student['Adm Type'] || '';
    
    if (year === '1st Yr' && admCat === 'SNQ') {
        const allotedFeeSMP = student['Alloted Fee SMP'] || '';
        const smpPaid = student['SMP Paid'] || '';
        const studentName = student['Student Name'] || '';
        const regNo = student['Reg No'] || '';
        
        // Handle PRANATHI's special multi-installment case
        if (studentName === 'PRANATHI' && regNo === '6') {
            if (allotedFeeSMP === '6988') {
                // First installment record - adjust to 382
                console.log(`Correcting SNQ fees for PRANATHI (1st installment): ${student['Course']}`);
                
                const originalTotalPaid = parseFloat(student['Total Paid']) || 0;
                const originalSMPPaid = parseFloat(smpPaid) || 0;
                
                student['Alloted Fee SMP'] = '1370';
                student['SMP Paid'] = '382';  // First installment adjusted
                
                // Recalculate Total Paid: subtract the difference in SMP payment
                const smpReduction = originalSMPPaid - 382;
                const newTotalPaid = Math.max(0, originalTotalPaid - smpReduction);
                student['Total Paid'] = newTotalPaid.toString();
                
                console.log(`  PRANATHI 1st installment: Original SMP=${originalSMPPaid}, Corrected SMP=382, Total=${newTotalPaid}`);
                return student;
            } else if (smpPaid === '988') {
                // Second installment record - leave unchanged
                console.log(`PRANATHI 2nd installment (no change needed): SMP Paid=988`);
                return student;
            }
        }
        
        // Standard correction for other SNQ students
        if (allotedFeeSMP === '6988' || allotedFeeSMP === '13445') {
            console.log(`Correcting SNQ fees for student: ${studentName} (${student['Course']})`);
            
            // Store original values for calculation
            const originalAllotedSMP = parseFloat(allotedFeeSMP) || 0;
            const originalSMPPaid = parseFloat(smpPaid) || 0;
            const originalTotalPaid = parseFloat(student['Total Paid']) || 0;
            
            // Set corrected values
            student['Alloted Fee SMP'] = '1370';
            student['SMP Paid'] = '1370';
            
            // Recalculate Total Paid
            const feeReduction = originalAllotedSMP - 1370;
            const newTotalPaid = Math.max(0, originalTotalPaid - feeReduction);
            student['Total Paid'] = newTotalPaid.toString();
            
            console.log(`  Original: Alloted=${originalAllotedSMP}, Paid=${originalSMPPaid}, Total=${originalTotalPaid}`);
            console.log(`  Corrected: Alloted=1370, Paid=1370, Total=${newTotalPaid}`);
        }
    }
    
    return student;
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
            
            // Apply automatic correction for 1st Year SNQ students
            correctSNQFees(student);
            
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

    // Dashboard will be displayed after loading is complete
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
    generateCategoryTable();
    generateDatewiseReport();
    populateFilters();
    populateDuesFilters();

    // Initialize student list if on statistics page (default)
    if (studentsData.length > 0) {
        filteredData = [...studentsData];
    }

    // Ensure search is initialized after dashboard is visible
    setTimeout(() => {
        initializeGlobalSearch();
    }, 200);
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
        metricCard.className = `metric-card ${courseColors[course] || ''}`;
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
    totalCard.style.cursor = 'pointer';
    totalCard.innerHTML = `
        <div class="metric-number" style="color: var(--primary-color);">${studentsData.length}</div>
        <div class="metric-label">All Students</div>
        <div class="year-breakdown">
            <div class="year-item">1st Yr: <span style="color: var(--primary-color); font-weight: 600;">${totalFirstYr}</span></div>
            <div class="year-item">2nd Yr: <span style="color: var(--primary-color); font-weight: 600;">${totalSecondYr}</span></div>
            <div class="year-item">3rd Yr: <span style="color: var(--primary-color); font-weight: 600;">${totalThirdYr}</span></div>
        </div>
    `;

    // Add click event listener for all students breakdown popup
    totalCard.addEventListener('click', () => showAllStudentsBreakdown());
    metricsGrid.appendChild(totalCard);

    // Initialize global search functionality
    setTimeout(() => {
        initializeGlobalSearch();
    }, 100);
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
        <div class="breakdown-grid course-breakdown-grid">
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

// All Students breakdown popup function
function showAllStudentsBreakdown() {
    const popup = document.getElementById('courseBreakdownPopup');
    const title = document.getElementById('popupTitle');
    const subtitle = document.getElementById('popupSubtitle');
    const timer = document.getElementById('popupTimer');
    const card = document.getElementById('breakdownCard');

    // Set popup title and subtitle
    title.textContent = 'All Students - Year & Course Wise Statistics';
    subtitle.textContent = 'Detailed student distribution across years and courses';

    // Generate year and course breakdown data
    const breakdown = generateAllStudentsBreakdown();

    // Create table HTML
    let tableHTML = `
        <div class="breakdown-grid">
            <div class="breakdown-header">
                <div class="year-label">Year</div>
                <div style="text-align: center; font-weight: 600;">CE</div>
                <div style="text-align: center; font-weight: 600;">ME</div>
                <div style="text-align: center; font-weight: 600;">EC</div>
                <div style="text-align: center; font-weight: 600;">CS</div>
                <div style="text-align: center; font-weight: 600;">EE</div>
                <div style="text-align: center; font-weight: 600;">Total</div>
            </div>
            <div class="breakdown-divider"></div>
    `;

    const expectedYears = ['1st Yr', '2nd Yr', '3rd Yr'];
    let totalCE = 0, totalME = 0, totalEC = 0, totalCS = 0, totalEE = 0, grandTotal = 0;

    expectedYears.forEach(year => {
        const yearData = breakdown[year] || { CE: 0, ME: 0, EC: 0, CS: 0, EE: 0, total: 0 };

        tableHTML += `
            <div class="breakdown-row">
                <div class="year-label">${year}</div>
                <div class="breakdown-value ce">${yearData.CE}</div>
                <div class="breakdown-value me">${yearData.ME}</div>
                <div class="breakdown-value ec">${yearData.EC}</div>
                <div class="breakdown-value cs">${yearData.CS}</div>
                <div class="breakdown-value ee">${yearData.EE}</div>
                <div class="breakdown-value breakdown-total">${yearData.total}</div>
            </div>
        `;

        totalCE += yearData.CE;
        totalME += yearData.ME;
        totalEC += yearData.EC;
        totalCS += yearData.CS;
        totalEE += yearData.EE;
        grandTotal += yearData.total;
    });

    tableHTML += `
            <div class="breakdown-divider"></div>
            <div class="breakdown-row">
                <div class="year-label" style="font-weight: 700;">TOTAL</div>
                <div class="breakdown-value ce" style="font-weight: 700;">${totalCE}</div>
                <div class="breakdown-value me" style="font-weight: 700;">${totalME}</div>
                <div class="breakdown-value ec" style="font-weight: 700;">${totalEC}</div>
                <div class="breakdown-value cs" style="font-weight: 700;">${totalCS}</div>
                <div class="breakdown-value ee" style="font-weight: 700;">${totalEE}</div>
                <div class="breakdown-value breakdown-total" style="font-weight: 700;">${grandTotal}</div>
            </div>
        </div>
        <div class="breakdown-grand-total">
            Grand Total: ${grandTotal} Students
        </div>
    `;

    card.innerHTML = tableHTML;

    // Show popup
    popup.classList.add('show');

    // Start countdown timer (10 seconds)
    let timeLeft = 10;
    timer.textContent = `Auto-close in ${timeLeft} seconds`;

    // Clear any existing timer
    if (popupTimer) {
        clearInterval(popupTimer);
    }

    popupTimer = setInterval(() => {
        timeLeft--;
        timer.textContent = `Auto-close in ${timeLeft} seconds`;

        if (timeLeft <= 0) {
            clearInterval(popupTimer);
            popupTimer = null;
            closeCourseBreakdown();
        }
    }, 1000);
}

// Generate all students breakdown data
function generateAllStudentsBreakdown() {
    const breakdown = {};
    const expectedYears = ['1st Yr', '2nd Yr', '3rd Yr'];
    const expectedCourses = ['CE', 'ME', 'EC', 'CS', 'EE'];

    // Initialize structure
    expectedYears.forEach(year => {
        breakdown[year] = { CE: 0, ME: 0, EC: 0, CS: 0, EE: 0, total: 0 };
    });

    // Count students by year and course
    studentsData.forEach(student => {
        const year = student['Year'];
        const course = student['Course'];

        if (breakdown[year] && expectedCourses.includes(course)) {
            breakdown[year][course]++;
            breakdown[year].total++;
        }
    });

    return breakdown;
}

// Global Search Functions
function openSearchPopup() {
    const popup = document.getElementById('searchResultsPopup');
    popup.classList.add('show');

    // Focus on the search input
    setTimeout(() => {
        const searchInput = document.getElementById('popupSearchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.value = '';
        }
    }, 100);

    // Start auto-close timer
    startSearchPopupTimer();
}

function initializeGlobalSearch() {
    const searchInput = document.getElementById('popupSearchInput');
    if (!searchInput) return;

    // Simple event listener - no value manipulation
    searchInput.addEventListener('input', function() {
        const value = this.value;
        if (value.length >= 2) {
            performGlobalSearch(value.toUpperCase());
        } else {
            clearSearchResults();
        }
    });
}

function startSearchPopupTimer() {
    // Clear existing timer
    if (searchPopupTimer) {
        clearInterval(searchPopupTimer);
    }

    let timeLeft = 20;
    const timerElement = document.getElementById('searchPopupTimer');

    searchPopupTimer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Auto-close in ${timeLeft} seconds`;

        if (timeLeft <= 0) {
            closeSearchResultsPopup();
        }
    }, 1000);
}

function clearSearchResults() {
    const resultsContainer = document.getElementById('searchResultsBody');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="no-results">Type at least 2 characters to search</div>';
    }
}


function performGlobalSearch(searchTerm) {
    const results = [];

    // Search through all students data
    allStudentsData.forEach(student => {
        const studentName = (student['Student Name'] || '').toUpperCase();
        const fatherName = (student['Father Name'] || '').toUpperCase();
        const regNo = (student['Reg No'] || '').toUpperCase();

        // Check if search term matches any of the fields
        if (studentName.includes(searchTerm) ||
            fatherName.includes(searchTerm) ||
            regNo.includes(searchTerm)) {
            results.push(student);
        }
    });

    // Limit to 5 results
    const limitedResults = results.slice(0, 5);

    // Display results
    displaySearchResults(limitedResults, searchTerm);
}

function displaySearchResults(results, searchTerm) {
    const popup = document.getElementById('searchResultsPopup');
    const body = document.getElementById('searchResultsBody');
    const subtitle = document.getElementById('searchSubtitle');
    const timer = document.getElementById('searchPopupTimer');

    // Update subtitle
    subtitle.textContent = `Found ${results.length} result(s) for "${searchTerm}"`;

    // Clear previous results
    body.innerHTML = '';

    if (results.length === 0) {
        body.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <div>No students found matching your search</div>
            </div>
        `;
    } else {
        results.forEach(student => {
            const resultCard = createSearchResultCard(student, searchTerm);
            body.appendChild(resultCard);
        });
    }

    // Show popup
    popup.classList.add('show');

    // Start countdown timer (20 seconds)
    let timeLeft = 20;
    timer.textContent = `Auto-close in ${timeLeft} seconds`;

    // Clear any existing timer
    if (searchPopupTimer) {
        clearInterval(searchPopupTimer);
    }

    searchPopupTimer = setInterval(() => {
        timeLeft--;
        timer.textContent = `Auto-close in ${timeLeft} seconds`;

        if (timeLeft <= 0) {
            clearInterval(searchPopupTimer);
            searchPopupTimer = null;
            closeSearchResultsPopup();
        }
    }, 1000);
}

function createSearchResultCard(student, searchTerm) {
    const card = document.createElement('div');
    card.className = 'search-result-card compact';

    // Find all installment records for this student (same Reg No)
    const studentRegNo = student['Reg No'];
    const studentCourse = student['Course'];
    const allInstallments = allStudentsData.filter(s => s['Reg No'] === studentRegNo && s['Course'] === studentCourse);

    // Calculate total fees across all installments
    let totalAllotedSMP = 0;
    let totalAllotedSVK = 0;
    let totalPaidSMP = 0;
    let totalPaidSVK = 0;

    allInstallments.forEach(installment => {
        totalAllotedSMP += parseFloat(installment['Alloted Fee SMP']) || 0;
        totalAllotedSVK += parseFloat(installment['Alloted Fee SVK']) || 0;
        totalPaidSMP += parseFloat(installment['SMP Paid']) || 0;
        totalPaidSVK += parseFloat(installment['SVK Paid']) || 0;
    });

    const totalAlloted = totalAllotedSMP + totalAllotedSVK;
    const totalPaid = totalPaidSMP + totalPaidSVK;
    const totalDue = totalAlloted - totalPaid;
    const paymentPercentage = totalAlloted > 0 ? ((totalPaid / totalAlloted) * 100).toFixed(1) : '0.0';

    // Determine payment status class
    const paymentStatusClass = totalDue === 0 ? 'fee-fully-paid' : 'fee-has-dues';
    const paymentStatusText = totalDue === 0 ? 'Fully Paid' : `Due: ₹${totalDue.toLocaleString('en-IN')}`;

    // Highlight matching text
    const highlightMatch = (text, term) => {
        if (!text || !term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    };

    const studentName = highlightMatch(student['Student Name'] || '', searchTerm);
    const fatherName = highlightMatch(student['Father Name'] || '', searchTerm);
    const regNo = highlightMatch(student['Reg No'] || '', searchTerm);

    const courseClass = student['Course'] ? student['Course'].toLowerCase() : '';

    // Generate fee table HTML
    const feeTableRows = allInstallments.map((installment, index) => {
        const allotedSMP = parseFloat(installment['Alloted Fee SMP']) || 0;
        const allotedSVK = parseFloat(installment['Alloted Fee SVK']) || 0;
        const paidSMP = parseFloat(installment['SMP Paid']) || 0;
        const paidSVK = parseFloat(installment['SVK Paid']) || 0;
        const smpDue = Math.max(0, allotedSMP - paidSMP);
        const svkDue = Math.max(0, allotedSVK - paidSVK);
        const installmentTotal = allotedSMP + allotedSVK;
        const installmentPaid = paidSMP + paidSVK;
        const installmentDue = installmentTotal - installmentPaid;

        return `
            <tr class="${installmentDue > 0 ? 'has-dues' : 'fully-paid'}">
                <td>${installment['Date'] || 'N/A'}</td>
                <td>${installment['Rpt'] || 'N/A'}</td>
                <td>₹${allotedSMP.toLocaleString('en-IN')}</td>
                <td>₹${allotedSVK.toLocaleString('en-IN')}</td>
                <td>₹${paidSMP.toLocaleString('en-IN')}</td>
                <td>₹${paidSVK.toLocaleString('en-IN')}</td>
                <td class="${smpDue > 0 ? 'due-amount' : ''}">₹${smpDue.toLocaleString('en-IN')}</td>
                <td class="${svkDue > 0 ? 'due-amount' : ''}">₹${svkDue.toLocaleString('en-IN')}</td>
                <td>₹${installmentTotal.toLocaleString('en-IN')}</td>
                <td>₹${installmentPaid.toLocaleString('en-IN')}</td>
                <td class="${installmentDue > 0 ? 'due-amount' : ''}">₹${installmentDue.toLocaleString('en-IN')}</td>
            </tr>
        `;
    }).join('');

    card.innerHTML = `
        <div class="compact-result-header ${paymentStatusClass}">
            <div class="compact-student-info">
                <div class="compact-student-name">${studentName}</div>
                <div class="compact-student-details">${regNo} | ${student['Year'] || 'N/A'} | <span class="${courseClass}">${student['Course'] || 'N/A'}</span></div>
                <div class="compact-father-name">Father: ${fatherName}</div>
            </div>
            <div class="compact-fee-status">
                <div class="payment-status">${paymentStatusText}</div>
                <div class="payment-percentage">${paymentPercentage}%</div>
            </div>
        </div>
        <div class="compact-result-details">
            <!-- Student Details Section -->
            <div class="detail-section">
                <div class="detail-section-title">Student Information</div>
                <div class="detail-row">
                    <div class="detail-item">
                        <span class="detail-label">Category:</span>
                        <span class="detail-value">${student['Cat'] || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Adm Cat:</span>
                        <span class="detail-value">${student['Adm Cat'] || 'N/A'}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-item">
                        <span class="detail-label">Adm Type:</span>
                        <span class="detail-value">${student['Adm Type'] || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">${student['In/Out'] || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Fee Summary Table Section -->
            <div class="detail-section">
                <div class="detail-section-title">Fee Details (${allInstallments.length} Installment${allInstallments.length > 1 ? 's' : ''})</div>
                <div class="fee-summary-table-container">
                    <table class="fee-summary-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Rpt</th>
                                <th>Alot SMP</th>
                                <th>Alot SVK</th>
                                <th>Paid SMP</th>
                                <th>Paid SVK</th>
                                <th>SMP Due</th>
                                <th>SVK Due</th>
                                <th>Total Alot</th>
                                <th>Total Paid</th>
                                <th>Total Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${feeTableRows}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="2"><strong>Total</strong></td>
                                <td><strong>₹${totalAllotedSMP.toLocaleString('en-IN')}</strong></td>
                                <td><strong>₹${totalAllotedSVK.toLocaleString('en-IN')}</strong></td>
                                <td><strong>₹${totalPaidSMP.toLocaleString('en-IN')}</strong></td>
                                <td><strong>₹${totalPaidSVK.toLocaleString('en-IN')}</strong></td>
                                <td class="${totalDue > 0 ? 'due-amount' : ''}"><strong>₹${Math.max(0, totalAllotedSMP - totalPaidSMP).toLocaleString('en-IN')}</strong></td>
                                <td class="${totalDue > 0 ? 'due-amount' : ''}"><strong>₹${Math.max(0, totalAllotedSVK - totalPaidSVK).toLocaleString('en-IN')}</strong></td>
                                <td><strong>₹${totalAlloted.toLocaleString('en-IN')}</strong></td>
                                <td><strong>₹${totalPaid.toLocaleString('en-IN')}</strong></td>
                                <td class="${totalDue > 0 ? 'due-amount' : ''}"><strong>₹${totalDue.toLocaleString('en-IN')}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    `;

    return card;
}

function closeSearchResultsPopup() {
    const popup = document.getElementById('searchResultsPopup');
    popup.classList.remove('show');

    // Clear timer
    if (searchPopupTimer) {
        clearInterval(searchPopupTimer);
        searchPopupTimer = null;
    }

    // Clear search input
    const searchInput = document.getElementById('popupSearchInput');
    if (searchInput) {
        searchInput.value = '';
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

function generateCategoryTable() {
    const categorySummary = {};

    studentsData.forEach(student => {
        const year = student['Year'];
        const course = student['Course'];
        let category = student['Cat'] || 'GM'; // Use the 'Cat' column (column 7)

        // Normalize category values
        category = category.trim().toUpperCase();

        // Map various category codes to standard categories
        let normalizedCategory = 'GM'; // Default
        if (category === '2A' || category === '2AU') {
            normalizedCategory = '2A';
        } else if (category === '2B' || category === '2BU') {
            normalizedCategory = '2B';
        } else if (category === '3A' || category === '3AU') {
            normalizedCategory = '3A';
        } else if (category === '3B' || category === '3BU') {
            normalizedCategory = '3B';
        } else if (category === 'SC' || category === 'GMK') {
            normalizedCategory = 'SC';
        } else if (category === 'ST') {
            normalizedCategory = 'ST';
        } else if (category === 'GM' || category === 'GMR' || category === 'GMU') {
            normalizedCategory = 'GM';
        } else if (category === 'C1' || category === 'C1U') {
            normalizedCategory = 'GM'; // Treat C1 as GM
        } else {
            normalizedCategory = 'GM'; // Default any other categories to GM
        }

        if (!categorySummary[year]) {
            categorySummary[year] = {};
        }
        if (!categorySummary[year][course]) {
            categorySummary[year][course] = { GM: 0, '2A': 0, '2B': 0, '3A': 0, '3B': 0, SC: 0, ST: 0, total: 0 };
        }

        // Initialize category if not exists
        if (!categorySummary[year][course][normalizedCategory]) {
            categorySummary[year][course][normalizedCategory] = 0;
        }

        categorySummary[year][course][normalizedCategory]++;
        categorySummary[year][course].total++;
    });

    const tbody = document.querySelector('#categoryTable tbody');
    tbody.innerHTML = '';

    // Calculate grand totals
    const grandTotals = { GM: 0, '2A': 0, '2B': 0, '3A': 0, '3B': 0, SC: 0, ST: 0, total: 0 };
    const expectedYears = ['1st Yr', '2nd Yr', '3rd Yr'];
    const expectedCourses = ['CE', 'ME', 'EC', 'CS', 'EE'];
    const expectedCategories = ['GM', '2A', '2B', '3A', '3B', 'SC', 'ST'];

    expectedYears.forEach(year => {
        let yearTotals = { GM: 0, '2A': 0, '2B': 0, '3A': 0, '3B': 0, SC: 0, ST: 0, total: 0 };

        expectedCourses.forEach(course => {
            const categories = categorySummary[year]?.[course] || { GM: 0, '2A': 0, '2B': 0, '3A': 0, '3B': 0, SC: 0, ST: 0, total: 0 };

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${year}</strong></td>
                <td><strong>${course}</strong></td>
                <td>${categories.GM || 0}</td>
                <td>${categories['2A'] || 0}</td>
                <td>${categories['2B'] || 0}</td>
                <td>${categories['3A'] || 0}</td>
                <td>${categories['3B'] || 0}</td>
                <td>${categories.SC || 0}</td>
                <td>${categories.ST || 0}</td>
                <td><strong>${categories.total}</strong></td>
            `;
            tbody.appendChild(row);

            // Add to year totals
            expectedCategories.forEach(cat => {
                yearTotals[cat] += categories[cat] || 0;
            });
            yearTotals.total += categories.total;

            // Add to grand totals
            expectedCategories.forEach(cat => {
                grandTotals[cat] += categories[cat] || 0;
            });
            grandTotals.total += categories.total;
        });

        // Add subtotal row for each year
        const subtotalRow = document.createElement('tr');
        subtotalRow.className = 'subtotal-row';
        subtotalRow.innerHTML = `
            <td><strong>${year} SUBTOTAL</strong></td>
            <td><strong>All Courses</strong></td>
            <td><strong>${yearTotals.GM}</strong></td>
            <td><strong>${yearTotals['2A']}</strong></td>
            <td><strong>${yearTotals['2B']}</strong></td>
            <td><strong>${yearTotals['3A']}</strong></td>
            <td><strong>${yearTotals['3B']}</strong></td>
            <td><strong>${yearTotals.SC}</strong></td>
            <td><strong>${yearTotals.ST}</strong></td>
            <td><strong>${yearTotals.total}</strong></td>
        `;
        tbody.appendChild(subtotalRow);
    });

    // Add Grand Total row
    const grandTotalRow = document.createElement('tr');
    grandTotalRow.className = 'grand-total-row';
    grandTotalRow.innerHTML = `
        <td colspan="2"><strong>GRAND TOTAL</strong></td>
        <td><strong>${grandTotals.GM}</strong></td>
        <td><strong>${grandTotals['2A']}</strong></td>
        <td><strong>${grandTotals['2B']}</strong></td>
        <td><strong>${grandTotals['3A']}</strong></td>
        <td><strong>${grandTotals['3B']}</strong></td>
        <td><strong>${grandTotals.SC}</strong></td>
        <td><strong>${grandTotals.ST}</strong></td>
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

    // Collect categories with normalization
    const categoriesSet = new Set();
    studentsData.forEach(student => {
        let category = student['Cat'] || 'GM';
        category = category.trim().toUpperCase();
        let normalizedCategory = 'GM';
        if (category === '2A' || category === '2AU') {
            normalizedCategory = '2A';
        } else if (category === '2B' || category === '2BU') {
            normalizedCategory = '2B';
        } else if (category === '3A' || category === '3AU') {
            normalizedCategory = '3A';
        } else if (category === '3B' || category === '3BU') {
            normalizedCategory = '3B';
        } else if (category === 'SC' || category === 'GMK') {
            normalizedCategory = 'SC';
        } else if (category === 'ST') {
            normalizedCategory = 'ST';
        } else if (category === 'GM' || category === 'GMR' || category === 'GMU') {
            normalizedCategory = 'GM';
        } else if (category === 'C1' || category === 'C1U') {
            normalizedCategory = 'GM';
        } else {
            normalizedCategory = 'GM';
        }
        categoriesSet.add(normalizedCategory);
    });

    const categories = Array.from(categoriesSet).sort();

    const courseFilter = document.getElementById('courseFilter');
    const yearFilter = document.getElementById('yearFilter');
    const admTypeFilter = document.getElementById('admTypeFilter');
    const catFilter = document.getElementById('catFilter');

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

    catFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        catFilter.innerHTML += `<option value="${category}">${category}</option>`;
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
        tbody.innerHTML = '<tr><td colspan="11" class="no-data">No students found</td></tr>';
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
            <td>${student['Cat'] || ''}</td>
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
        metricCard.className = `metric-card ${courseColors[course] || ''}`;
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
    const catFilter = document.getElementById('catFilter').value;
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

        // Category filtering logic with normalization
        let matchesCat = true;
        if (catFilter) {
            let category = student['Cat'] || 'GM';
            category = category.trim().toUpperCase();
            let normalizedCategory = 'GM';
            if (category === '2A' || category === '2AU') {
                normalizedCategory = '2A';
            } else if (category === '2B' || category === '2BU') {
                normalizedCategory = '2B';
            } else if (category === '3A' || category === '3AU') {
                normalizedCategory = '3A';
            } else if (category === '3B' || category === '3BU') {
                normalizedCategory = '3B';
            } else if (category === 'SC' || category === 'GMK') {
                normalizedCategory = 'SC';
            } else if (category === 'ST') {
                normalizedCategory = 'ST';
            } else if (category === 'GM' || category === 'GMR' || category === 'GMU') {
                normalizedCategory = 'GM';
            } else if (category === 'C1' || category === 'C1U') {
                normalizedCategory = 'GM';
            } else {
                normalizedCategory = 'GM';
            }
            matchesCat = normalizedCategory === catFilter;
        }

        const matchesName = !nameFilter ||
            student['Student Name']?.toLowerCase().includes(nameFilter) ||
            student['Father Name']?.toLowerCase().includes(nameFilter) ||
            student['Reg No']?.toString().toLowerCase().includes(nameFilter);

        return matchesCourse && matchesYear && matchesAdmType && matchesCat && matchesName;
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
        metricCard.className = `metric-card ${courseColors[course] || ''}`;
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
    document.getElementById('catFilter').value = '';
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
    doc.setFont('times', 'bold');
    doc.text('SMP Admn Stats 2025-26', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Year, Course & Admission Type-wise Student Count', 105, 30, { align: 'center' });

    // Generation info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const genInfo = `Generated: ${currentDate}`;
    doc.text(genInfo, 105, 42, { align: 'center' });
    
    // Get table data
    const table = document.getElementById('summaryTable');
    const rows = table.querySelectorAll('tbody tr');
    
    if (rows.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Table headers with improved spacing
    const headers = ['Year', 'Course', 'Regular', 'LTRL', 'SNQ', 'RPTR', 'Total'];
    const startY = 55;

    // Optimized column widths for better spacing
    const colWidths = [30, 28, 25, 24, 24, 24, 25];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const startX = (210 - tableWidth) / 2; // Center the table on A4 width (210mm)

    doc.setFontSize(10);
    doc.setFont('times', 'bold');

    // Header background
    doc.setFillColor(67, 97, 238);
    doc.rect(startX, startY - 3, tableWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);

    let xPos = startX;
    headers.forEach((header, index) => {
        doc.text(header, xPos + (colWidths[index] / 2), startY + 4, { align: 'center' });
        xPos += colWidths[index];
    });

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    let currentY = startY + 15;
    const rowHeight = 8;
    const pageHeight = 270;
    
    rows.forEach((row, index) => {
        if (currentY > pageHeight) {
            doc.addPage();
            currentY = 20;
            
            // Repeat headers on new page
            doc.setFont('times', 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(15, currentY - 2, 190, 10, 'F'); // Increased for better space utilization
            
            xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos + (colWidths[i] / 2), currentY + 4, { align: 'center' });
                xPos += colWidths[i];
            });
            
            currentY += 12;
            doc.setFont(undefined, 'normal');
        }
        
        const cells = row.querySelectorAll('td');
        
        // Check if this is a subtotal or grand total row
        const isSubtotal = row.classList.contains('subtotal-row');
        const isGrandTotal = row.classList.contains('grand-total-row');
        
        if (isSubtotal || isGrandTotal) {
            doc.setFillColor(52, 152, 219);
            doc.rect(startX, currentY - 2, tableWidth, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('times', 'bold');
        } else if (index % 2 === 0) {
            doc.setFillColor(248, 249, 250);
            doc.rect(startX, currentY - 2, tableWidth, rowHeight, 'F');
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        }

        xPos = startX;
        
        // Handle Grand Total row special case with proper alignment
        if (isGrandTotal) {
            // For Grand Total row, manually construct the row data to match header alignment
            const grandTotalText = cells[0].textContent.trim(); // "GRAND TOTAL"
            const regularVal = cells[1].textContent.trim();
            const ltrlVal = cells[2].textContent.trim();
            const snqVal = cells[3].textContent.trim();
            const rptrVal = cells[4].textContent.trim();
            const totalVal = cells[5].textContent.trim();
            
            // Create properly aligned row data (7 columns to match headers)
            const alignedRowData = [
                '', // Year column - empty for grand total
                grandTotalText, // Course column - contains "GRAND TOTAL"
                regularVal,
                ltrlVal, 
                snqVal,
                rptrVal,
                totalVal
            ];

            alignedRowData.forEach((data, i) => {
                const text = String(data);
                doc.text(text, xPos + (colWidths[i] / 2), currentY + 5, { align: 'center' });
                xPos += colWidths[i];
            });
        } else {
            // Handle normal rows and subtotal rows
            const rowData = Array.from(cells).map(cell => cell.textContent.trim());
            rowData.forEach((data, i) => {
                const text = String(data);
                doc.text(text, xPos + (colWidths[i] / 2), currentY + 5, { align: 'center' });
                xPos += colWidths[i];
            });
        }

        currentY += rowHeight;
    });
    
    // Add page numbers and footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('SMP Admn Stats 2025-26 - Summary Report', 105, 285, { align: 'center' });
    }
    
    const fileName = `SMP_Summary_Report_${currentDate.replace(/-/g, '_')}.pdf`;
    doc.save(fileName);
}

function exportCategoryToPDF() {
    if (!confirm('📄 Export Year, Course & Cat wise Student Count as PDF?')) {
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better column fit
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);

    // Header
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Year, Course & Cat wise Student Count', 148, 30, { align: 'center' });

    // Generation info
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const genInfo = `Generated: ${currentDate}`;
    doc.text(genInfo, 148, 45, { align: 'center' });

    // Get table data
    const table = document.getElementById('categoryTable');
    const rows = table.querySelectorAll('tbody tr');

    if (rows.length === 0) {
        alert('No data to export');
        return;
    }

    // Table headers
    const headers = ['Year', 'Course', 'GM', '2A', '2B', '3A', '3B', 'SC', 'ST', 'Total'];
    const startY = 55;

    doc.setFontSize(9);
    doc.setFont('times', 'bold');

    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY - 2, 270, 10, 'F'); // Optimal width for landscape

    const colWidths = [30, 45, 26, 26, 26, 26, 26, 26, 26, 37]; // Balanced column widths
    let xPos = 15;

    headers.forEach((header, index) => {
        doc.text(header, xPos + 3, startY + 6);
        xPos += colWidths[index];
    });

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);

    let currentY = startY + 12;
    const rowHeight = 7;
    const pageHeight = 270;

    rows.forEach((row, index) => {
        if (currentY > pageHeight) {
            doc.addPage();
            currentY = 20;

            // Repeat headers on new page
            doc.setFont('times', 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(15, currentY - 2, 270, 10, 'F'); // Optimal width

            xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos + 3, currentY + 6);
                xPos += colWidths[i];
            });

            currentY += 12;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
        }

        const cells = row.querySelectorAll('td');

        // Check if this is a subtotal or grand total row
        const isSubtotal = row.classList.contains('subtotal-row');
        const isGrandTotal = row.classList.contains('grand-total-row');

        if (isSubtotal || isGrandTotal) {
            doc.setFillColor(67, 97, 238);
            doc.rect(15, currentY - 2, 270, rowHeight, 'F'); // Optimal width
            doc.setTextColor(255, 255, 255);
            doc.setFont('times', 'bold');
        } else if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, currentY - 2, 270, rowHeight, 'F'); // Optimal width
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        }

        xPos = 15;

        // Handle Grand Total row special case with proper alignment
        if (isGrandTotal) {
            // For Grand Total row, manually construct the row data to match header alignment
            const grandTotalText = cells[0].textContent.trim(); // "GRAND TOTAL"
            const gmVal = cells[1].textContent.trim();
            const a2Val = cells[2].textContent.trim();
            const b2Val = cells[3].textContent.trim();
            const a3Val = cells[4].textContent.trim();
            const b3Val = cells[5].textContent.trim();
            const scVal = cells[6].textContent.trim();
            const stVal = cells[7].textContent.trim();
            const totalVal = cells[8].textContent.trim();

            // Create properly aligned row data (10 columns to match headers)
            const alignedRowData = [
                '', // Year column - empty for grand total
                grandTotalText, // Course column - contains "GRAND TOTAL"
                gmVal,
                a2Val,
                b2Val,
                a3Val,
                b3Val,
                scVal,
                stVal,
                totalVal
            ];

            alignedRowData.forEach((data, i) => {
                const text = String(data);
                doc.text(text, xPos + 3, currentY + 4);
                xPos += colWidths[i];
            });
        } else {
            // Handle normal rows and subtotal rows
            const rowData = Array.from(cells).map(cell => cell.textContent.trim());
            rowData.forEach((data, i) => {
                const text = String(data);
                doc.text(text, xPos + 3, currentY + 4);
                xPos += colWidths[i];
            });
        }

        currentY += rowHeight;
    });

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Page ${i} of ${pageCount}`, 148, 205, { align: 'center' });
        doc.text('SMP Admn Stats 2025-26 - Category Report', 148, 200, { align: 'center' });
    }

    const fileName = `SMP_Category_Report_${currentDate.replace(/-/g, '_')}.pdf`;
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
    doc.setFont('times', 'bold');
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
    doc.setFont('times', 'bold');
    
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
            doc.setFont('times', 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(15, currentY - 2, 190, 10, 'F'); // Increased for better space utilization
            
            xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos + (colWidths[i] / 2), currentY + 4, { align: 'center' });
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
            doc.rect(15, currentY - 2, 270, rowHeight, 'F'); // Optimal width
            doc.setTextColor(255, 255, 255);
            doc.setFont('times', 'bold');
        } else if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, currentY - 2, 270, rowHeight, 'F'); // Optimal width
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        }
        
        xPos = 15;
        rowData.forEach((data, i) => {
            const text = String(data);
            doc.text(text, xPos + 3, currentY + 4);
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
    doc.setFont('times', 'bold');
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
        doc.setFontSize(10);
        doc.setFont('times', 'bold');
        doc.text(courseHeaders[courseFilter], 105, 55, { align: 'center' });
    }
    
    // Table headers
    const headers = ['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Cat', 'Adm Type', 'Adm Cat', 'Status'];
    const startY = courseFilter !== 'All Courses' ? 65 : 55;

    doc.setFontSize(9);
    doc.setFont('times', 'bold');

    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY - 2, 190, 10, 'F'); // Increased for better space utilization

    const colWidths = [12, 32, 32, 14, 14, 22, 14, 18, 18, 12]; // Increased portrait widths
    let xPos = 15;

    headers.forEach((header, index) => {
        doc.text(header, xPos + 2, startY + 6);
        xPos += colWidths[index];
    });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);

    let currentY = startY + 12;
    const rowHeight = 7;
    const pageHeight = 270;

    filteredData.forEach((student, index) => {
        if (currentY > pageHeight) {
            doc.addPage();
            currentY = 20;
            
            doc.setFont('times', 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(15, currentY - 2, 190, 10, 'F'); // Increased for better space utilization
            
            xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos + (colWidths[i] / 2), currentY + 4, { align: 'center' });
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
            (student['Student Name'] || '').substring(0, 25),
            (student['Father Name'] || '').substring(0, 25),
            student['Year'] || '',
            student['Course'] || '',
            (student['Reg No'] || '').substring(0, 18),
            (student['Cat'] || '').substring(0, 10),
            displayedAdmType.substring(0, 12),
            (student['Adm Cat'] || '').substring(0, 12),
            student['In/Out'] || ''
        ];
        
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, currentY - 2, 190, rowHeight, 'F'); // Increased for better space utilization
        }

        xPos = 15;
        rowData.forEach((data, i) => {
            const text = String(data);
            doc.text(text, xPos + 2, currentY + 4);
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
    doc.setFont('times', 'bold');
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
    doc.setFont('times', 'bold');
    doc.text(`Total Outstanding Dues: ₹${totalDuesAmount.toLocaleString('en-IN')}`, 148, 55, { align: 'center' });
    
    // Table headers
    const headers = ['Sl', 'Student Name', 'Father Name', 'Yr', 'Course', 'Reg No', 'Adm', 'Cat', 'Status', 'SMP All', 'SVK All', 'SMP Paid', 'SVK Paid', 'SMP Due', 'SVK Due', 'Tot All', 'Tot Paid', 'Tot Due'];
    const startY = 65;
    
    doc.setFontSize(7);
    doc.setFont('times', 'bold');
    
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
            
            doc.setFont('times', 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(15, currentY - 2, 266, 8, 'F');
            
            xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos + (colWidths[i] / 2), currentY + 4, { align: 'center' });
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
            doc.text(text, xPos + 3, currentY + 4);
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

    const headers = ['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Cat', 'Adm Type', 'Adm Cat', 'Status'];
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
                student['Cat'] || '',
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
document.getElementById('catFilter').addEventListener('change', applyFilters);

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
    
    doc.setFontSize(10);
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
    
    const headers = ['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Cat', 'Adm Type', 'Adm Cat', 'Status'];
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
                student['Cat'] || '',
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
    doc.setFont('times', 'bold');
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
            student['Cat'] || '',
            displayedAdmType,
            student['Adm Cat'] || '',
            student['In/Out'] || ''
        ];
    });

    doc.autoTable({
        head: [['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 'Cat', 'Adm Type', 'Adm Cat', 'Status']],
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
    doc.setFont('times', 'bold');
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
    doc.setFont('times', 'bold');
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
    const checkedBoxes = document.querySelectorAll('#feeListTable .student-checkbox:checked');
    
    const clearBtn = document.getElementById('clearFeeListSelectionBtn');
    const exportSelectedBtn = document.getElementById('exportFeeListSelectedBtn');
    const saveSelectedBtn = document.getElementById('saveFeeListSelectedBtn');
    const exportAllBtn = document.getElementById('exportFeeListAllBtn');
    const saveAllBtn = document.getElementById('saveFeeListAllBtn');
    
    const hasSelection = checkedBoxes.length > 0;
    
    // Enable/disable selected buttons
    clearBtn.disabled = !hasSelection;
    exportSelectedBtn.disabled = !hasSelection;
    saveSelectedBtn.disabled = !hasSelection;
    
    // Disable/enable regular export buttons when selection is active
    exportAllBtn.disabled = hasSelection;
    saveAllBtn.disabled = hasSelection;
    
    // Update opacity for visual feedback
    if (hasSelection) {
        exportAllBtn.style.opacity = '0.4';
        saveAllBtn.style.opacity = '0.4';
    } else {
        exportAllBtn.style.opacity = '1';
        saveAllBtn.style.opacity = '1';
    }
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
    doc.setFont('times', 'bold');
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
            fontSize: 6, 
            cellPadding: 1.5,
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
    doc.setFont('times', 'bold');
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
            fontSize: 6, 
            cellPadding: 1.5,
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

// ===========================================
// FEE STATISTICS FUNCTIONALITY
// ===========================================

let feeStatsData = [];
let filteredFeeStatsData = [];

// Initialize Fee Statistics when section is accessed
function initializeFeeStats() {
    console.log('=== INITIALIZING FEE STATISTICS ===');
    
    // Always ensure we have the latest fee list data
    if (feeListData.length === 0 && allStudentsData.length > 0) {
        console.log('Populating Fee List for Statistics...');
        populateFeeList();
    }
    
    // Force refresh of fee stats data to ensure accuracy
    populateFeeStats();
    populateFeeStatsFilters();
    displayFeeStats();
    generateFeeStatsMetrics();
}

function populateFeeStats() {
    console.log('Populating Fee Statistics from', feeListData.length, 'students');
    
    // Use EXACT same data as Fee List to ensure accuracy
    feeStatsData = [...feeListData];
    filteredFeeStatsData = [...feeStatsData];
    
    console.log('Fee Statistics populated with', feeStatsData.length, 'students');
    console.log('Fee Stats - Students with dues:', feeStatsData.filter(s => s['Total Dues'] > 0).length);
    console.log('Fee Stats - Students fully paid:', feeStatsData.filter(s => s['Total Dues'] === 0).length);
}

// Populate filters for Fee Statistics
function populateFeeStatsFilters() {
    if (feeStatsData.length === 0) return;
    
    const courses = [...new Set(feeStatsData.map(s => s['Course']))].sort();
    const years = [...new Set(feeStatsData.map(s => s['Year']))].sort();
    const admTypes = [...new Set(feeStatsData.map(s => s['Adm Type']).filter(type => type))].sort();

    const courseFilter = document.getElementById('feeStatsCourseFilter');
    const yearFilter = document.getElementById('feeStatsYearFilter');
    const admTypeFilter = document.getElementById('feeStatsAdmTypeFilter');

    // Clear existing options (except "All" option)
    courseFilter.innerHTML = '<option value="">All Courses</option>';
    yearFilter.innerHTML = '<option value="">All Years</option>';
    admTypeFilter.innerHTML = '<option value="">All Types</option>';

    // Populate course filter
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseFilter.appendChild(option);
    });

    // Populate year filter
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    // Populate admission type filter
    admTypes.forEach(admType => {
        const option = document.createElement('option');
        option.value = admType;
        option.textContent = admType;
        admTypeFilter.appendChild(option);
    });
}

// Apply filters to fee statistics data
function applyFeeStatsFilters() {
    const courseFilter = document.getElementById('feeStatsCourseFilter').value.toLowerCase();
    const yearFilter = document.getElementById('feeStatsYearFilter').value.toLowerCase();
    const admTypeFilter = document.getElementById('feeStatsAdmTypeFilter').value.toLowerCase();
    const tableFilter = document.getElementById('feeStatsTableFilter').value;

    filteredFeeStatsData = feeStatsData.filter(student => {
        const courseMatch = !courseFilter || student['Course'].toLowerCase().includes(courseFilter);
        const yearMatch = !yearFilter || student['Year'].toString().toLowerCase().includes(yearFilter);
        const admTypeMatch = !admTypeFilter || (student['Adm Type'] && student['Adm Type'].toLowerCase().includes(admTypeFilter));

        return courseMatch && yearMatch && admTypeMatch;
    });

    console.log('Filtered Fee Stats:', filteredFeeStatsData.length, 'students');
    
    displayFeeStats();
    generateFeeStatsMetrics();
    
    // Show/hide table sections based on filter
    showHideFeeStatsTables(tableFilter);
}

// Show/hide fee stats table sections based on filter
function showHideFeeStatsTables(tableFilter) {
    const summarySection = document.getElementById('feeStatsSummarySection');
    const yearwiseSection = document.getElementById('feeStatsYearwiseSection');
    const coursewiseSection = document.getElementById('feeStatsCoursewiseSection');
    const combinedSection = document.getElementById('feeStatsCombinedSection');
    const fullyPaidSection = document.getElementById('feeStatsFullyPaidSection');
    const partiallyPaidSection = document.getElementById('feeStatsPartiallyPaidSection');
    
    // Hide all sections first
    [summarySection, yearwiseSection, coursewiseSection, combinedSection, fullyPaidSection, partiallyPaidSection].forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    // Show sections based on filter
    switch(tableFilter) {
        case 'summary':
            if (summarySection) summarySection.style.display = 'block';
            break;
        case 'yearwise':
            if (yearwiseSection) yearwiseSection.style.display = 'block';
            break;
        case 'coursewise':
            if (coursewiseSection) coursewiseSection.style.display = 'block';
            break;
        case 'combined':
            if (combinedSection) combinedSection.style.display = 'block';
            break;
        case 'fullypaid':
            if (fullyPaidSection) fullyPaidSection.style.display = 'block';
            break;
        case 'partiallypaid':
            if (partiallyPaidSection) partiallyPaidSection.style.display = 'block';
            break;
        default: // 'all'
            [summarySection, yearwiseSection, coursewiseSection, combinedSection, fullyPaidSection, partiallyPaidSection].forEach(section => {
                if (section) section.style.display = 'block';
            });
    }
}

// Clear all fee statistics filters
function clearFeeStatsFilters() {
    document.getElementById('feeStatsCourseFilter').value = '';
    document.getElementById('feeStatsYearFilter').value = '';
    document.getElementById('feeStatsAdmTypeFilter').value = '';
    document.getElementById('feeStatsTableFilter').value = 'all';
    
    filteredFeeStatsData = [...feeStatsData];
    displayFeeStats();
    generateFeeStatsMetrics();
    showHideFeeStatsTables('all');
}

// Display fee statistics tables
function displayFeeStats() {
    displayFeeStatsSummary();
    displayFeeStatsYearwise();
    displayFeeStatsCoursewise();
    displayFeeStatsCombined();
    displayFeeStatsFullyPaid();
    displayFeeStatsPartiallyPaid();
}

// Display Fee Summary Table
function displayFeeStatsSummary() {
    const tbody = document.querySelector('#feeStatsSummaryTable tbody');
    tbody.innerHTML = '';

    const totalStats = calculateFeeStats(filteredFeeStatsData);
    const paidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] === 0).length;
    const partialStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0).length;
    const dueStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0).length;
    
    const summaryData = [
        {
            category: 'All Students',
            students: filteredFeeStatsData.length,
            ...totalStats
        },
        {
            category: 'Fully Paid',
            students: paidStudents,
            ...calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] === 0))
        },
        {
            category: 'Partially Paid',
            students: partialStudents,
            ...calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0))
        },
        {
            category: 'Dues Pending',
            students: dueStudents,
            ...calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0))
        }
    ];

    summaryData.forEach((data, index) => {
        const row = document.createElement('tr');
        if (index === 0) row.className = 'total-row';
        
        const collectionPercentage = data.totalAlloted > 0 ? ((data.totalPaid / data.totalAlloted) * 100).toFixed(1) : '0.0';
        
        row.innerHTML = `
            <td><strong>${data.category}</strong></td>
            <td>${data.students}</td>
            <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
            <td class="amount ${data.smpDue > 0 ? 'due-amount' : ''}">₹${data.smpDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.svkDue > 0 ? 'due-amount' : ''}">₹${data.svkDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.totalDue > 0 ? 'due-amount' : ''}">₹${data.totalDue.toLocaleString('en-IN')}</td>
            <td class="amount">${collectionPercentage}%</td>
        `;
        tbody.appendChild(row);
    });
}

// Display Year-wise Fee Statistics
function displayFeeStatsYearwise() {
    const tbody = document.querySelector('#feeStatsYearwiseTable tbody');
    tbody.innerHTML = '';

    const yearGroups = groupDataBy(filteredFeeStatsData, 'Year');
    const yearData = [];
    
    Object.keys(yearGroups).sort().forEach(year => {
        const yearStudents = yearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        yearData.push({
            year: year,
            students: yearStudents.length,
            ...stats
        });
    });

    yearData.forEach(data => {
        const row = document.createElement('tr');
        const collectionPercentage = data.totalAlloted > 0 ? ((data.totalPaid / data.totalAlloted) * 100).toFixed(1) : '0.0';
        
        row.innerHTML = `
            <td><strong>${data.year}</strong></td>
            <td>${data.students}</td>
            <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
            <td class="amount ${data.smpDue > 0 ? 'due-amount' : ''}">₹${data.smpDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.svkDue > 0 ? 'due-amount' : ''}">₹${data.svkDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.totalDue > 0 ? 'due-amount' : ''}">₹${data.totalDue.toLocaleString('en-IN')}</td>
            <td class="amount">${collectionPercentage}%</td>
        `;
        tbody.appendChild(row);
    });

    // Add total row
    if (yearData.length > 1) {
        const totalStats = calculateFeeStats(filteredFeeStatsData);
        const totalRow = document.createElement('tr');
        totalRow.className = 'grand-total-row';
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) : '0.0';
        
        totalRow.innerHTML = `
            <td><strong>TOTAL</strong></td>
            <td><strong>${filteredFeeStatsData.length}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>${totalCollectionPercentage}%</strong></td>
        `;
        tbody.appendChild(totalRow);
    }
}

// Display Course-wise Fee Statistics
function displayFeeStatsCoursewise() {
    const tbody = document.querySelector('#feeStatsCoursewiseTable tbody');
    tbody.innerHTML = '';

    const courseGroups = groupDataBy(filteredFeeStatsData, 'Course');
    const courseData = [];
    
    Object.keys(courseGroups).sort().forEach(course => {
        const courseStudents = courseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        courseData.push({
            course: course,
            students: courseStudents.length,
            ...stats
        });
    });

    courseData.forEach(data => {
        const row = document.createElement('tr');
        const collectionPercentage = data.totalAlloted > 0 ? ((data.totalPaid / data.totalAlloted) * 100).toFixed(1) : '0.0';
        
        row.innerHTML = `
            <td><strong>${data.course}</strong></td>
            <td>${data.students}</td>
            <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
            <td class="amount ${data.smpDue > 0 ? 'due-amount' : ''}">₹${data.smpDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.svkDue > 0 ? 'due-amount' : ''}">₹${data.svkDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.totalDue > 0 ? 'due-amount' : ''}">₹${data.totalDue.toLocaleString('en-IN')}</td>
            <td class="amount">${collectionPercentage}%</td>
        `;
        tbody.appendChild(row);
    });

    // Add total row
    if (courseData.length > 1) {
        const totalStats = calculateFeeStats(filteredFeeStatsData);
        const totalRow = document.createElement('tr');
        totalRow.className = 'grand-total-row';
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) : '0.0';
        
        totalRow.innerHTML = `
            <td><strong>TOTAL</strong></td>
            <td><strong>${filteredFeeStatsData.length}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>${totalCollectionPercentage}%</strong></td>
        `;
        tbody.appendChild(totalRow);
    }
}

// Display Combined Year & Course-wise Fee Statistics
function displayFeeStatsCombined() {
    const tbody = document.querySelector('#feeStatsCombinedTable tbody');
    tbody.innerHTML = '';

    const combinedGroups = {};
    
    filteredFeeStatsData.forEach(student => {
        const key = `${student['Year']}-${student['Course']}`;
        if (!combinedGroups[key]) {
            combinedGroups[key] = [];
        }
        combinedGroups[key].push(student);
    });

    const combinedData = [];
    Object.keys(combinedGroups).sort().forEach(key => {
        const [year, course] = key.split('-');
        const students = combinedGroups[key];
        const stats = calculateFeeStats(students);
        combinedData.push({
            year: year,
            course: course,
            students: students.length,
            ...stats
        });
    });

    // Group by year for subtotals
    const yearSubtotals = {};
    combinedData.forEach(data => {
        if (!yearSubtotals[data.year]) {
            yearSubtotals[data.year] = [];
        }
        yearSubtotals[data.year].push(data);
    });

    Object.keys(yearSubtotals).sort().forEach(year => {
        const yearData = yearSubtotals[year];
        
        yearData.forEach(data => {
            const row = document.createElement('tr');
            const collectionPercentage = data.totalAlloted > 0 ? ((data.totalPaid / data.totalAlloted) * 100).toFixed(1) : '0.0';
            
            row.innerHTML = `
                <td>${data.year}</td>
                <td><strong>${data.course}</strong></td>
                <td>${data.students}</td>
                <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
                <td class="amount ${data.smpDue > 0 ? 'due-amount' : ''}">₹${data.smpDue.toLocaleString('en-IN')}</td>
                <td class="amount ${data.svkDue > 0 ? 'due-amount' : ''}">₹${data.svkDue.toLocaleString('en-IN')}</td>
                <td class="amount ${data.totalDue > 0 ? 'due-amount' : ''}">₹${data.totalDue.toLocaleString('en-IN')}</td>
                <td class="amount">${collectionPercentage}%</td>
            `;
            tbody.appendChild(row);
        });

        // Add year subtotal if there are multiple courses
        if (yearData.length > 1) {
            const yearTotalStats = calculateFeeStats(filteredFeeStatsData.filter(s => s['Year'] === year));
            const subtotalRow = document.createElement('tr');
            subtotalRow.className = 'year-subtotal-row';
            const yearCollectionPercentage = yearTotalStats.totalAlloted > 0 ? ((yearTotalStats.totalPaid / yearTotalStats.totalAlloted) * 100).toFixed(1) : '0.0';
            
            subtotalRow.innerHTML = `
                <td><strong>${year} SUBTOTAL</strong></td>
                <td><strong>All Courses</strong></td>
                <td><strong>${filteredFeeStatsData.filter(s => s['Year'] === year).length}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.smpDue.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.svkDue.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.totalDue.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>${yearCollectionPercentage}%</strong></td>
            `;
            tbody.appendChild(subtotalRow);
        }
    });

    // Add grand total row
    if (combinedData.length > 1) {
        const totalStats = calculateFeeStats(filteredFeeStatsData);
        const totalRow = document.createElement('tr');
        totalRow.className = 'grand-total-row';
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) : '0.0';
        
        totalRow.innerHTML = `
            <td><strong>GRAND TOTAL</strong></td>
            <td><strong>All Years & Courses</strong></td>
            <td><strong>${filteredFeeStatsData.length}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>${totalCollectionPercentage}%</strong></td>
        `;
        tbody.appendChild(totalRow);
    }
}

// Display Fully Paid Students Tables
function displayFeeStatsFullyPaid() {
    displayFeeStatsYearwiseFullyPaid();
    displayFeeStatsCoursewiseFullyPaid();
    displayFeeStatsCombinedFullyPaid();
}

// Display Year-wise Fully Paid Students
function displayFeeStatsYearwiseFullyPaid() {
    const tbody = document.querySelector('#feeStatsYearwiseFullyPaidTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const fullyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] === 0);
    const yearGroups = groupDataBy(fullyPaidStudents, 'Year');
    const yearData = [];
    
    Object.keys(yearGroups).sort().forEach(year => {
        const yearStudents = yearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        yearData.push({
            year: year,
            students: yearStudents.length,
            ...stats
        });
    });

    yearData.forEach(data => {
        const row = document.createElement('tr');
        const collectionPercentage = '100.0'; // Always 100% for fully paid
        
        row.innerHTML = `
            <td><strong>${data.year}</strong></td>
            <td>${data.students}</td>
            <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
            <td class="amount">${collectionPercentage}%</td>
        `;
        tbody.appendChild(row);
    });

    // Add total row
    if (yearData.length > 1) {
        const totalStats = calculateFeeStats(fullyPaidStudents);
        const totalRow = document.createElement('tr');
        totalRow.className = 'grand-total-row';
        
        totalRow.innerHTML = `
            <td><strong>TOTAL</strong></td>
            <td><strong>${fullyPaidStudents.length}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>100.0%</strong></td>
        `;
        tbody.appendChild(totalRow);
    }
}

// Display Course-wise Fully Paid Students
function displayFeeStatsCoursewiseFullyPaid() {
    const tbody = document.querySelector('#feeStatsCoursewiseFullyPaidTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const fullyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] === 0);
    const courseGroups = groupDataBy(fullyPaidStudents, 'Course');
    const courseData = [];
    
    Object.keys(courseGroups).sort().forEach(course => {
        const courseStudents = courseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        courseData.push({
            course: course,
            students: courseStudents.length,
            ...stats
        });
    });

    courseData.forEach(data => {
        const row = document.createElement('tr');
        const collectionPercentage = '100.0'; // Always 100% for fully paid
        
        row.innerHTML = `
            <td><strong>${data.course}</strong></td>
            <td>${data.students}</td>
            <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
            <td class="amount">${collectionPercentage}%</td>
        `;
        tbody.appendChild(row);
    });

    // Add total row
    if (courseData.length > 1) {
        const totalStats = calculateFeeStats(fullyPaidStudents);
        const totalRow = document.createElement('tr');
        totalRow.className = 'grand-total-row';
        
        totalRow.innerHTML = `
            <td><strong>TOTAL</strong></td>
            <td><strong>${fullyPaidStudents.length}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>100.0%</strong></td>
        `;
        tbody.appendChild(totalRow);
    }
}

// Display Partially Paid Students Tables
function displayFeeStatsPartiallyPaid() {
    displayFeeStatsYearwisePartiallyPaid();
    displayFeeStatsCoursewisePartiallyPaid();
    displayFeeStatsCombinedPartiallyPaid();
}

// Display Year-wise Partially Paid Students
function displayFeeStatsYearwisePartiallyPaid() {
    const tbody = document.querySelector('#feeStatsYearwisePartiallyPaidTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const partiallyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0);
    const yearGroups = groupDataBy(partiallyPaidStudents, 'Year');
    const yearData = [];
    
    Object.keys(yearGroups).sort().forEach(year => {
        const yearStudents = yearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        yearData.push({
            year: year,
            students: yearStudents.length,
            ...stats
        });
    });

    yearData.forEach(data => {
        const row = document.createElement('tr');
        const collectionPercentage = data.totalAlloted > 0 ? ((data.totalPaid / data.totalAlloted) * 100).toFixed(1) : '0.0';
        
        row.innerHTML = `
            <td><strong>${data.year}</strong></td>
            <td>${data.students}</td>
            <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
            <td class="amount ${data.smpDue > 0 ? 'due-amount' : ''}">₹${data.smpDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.svkDue > 0 ? 'due-amount' : ''}">₹${data.svkDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.totalDue > 0 ? 'due-amount' : ''}">₹${data.totalDue.toLocaleString('en-IN')}</td>
            <td class="amount">${collectionPercentage}%</td>
        `;
        tbody.appendChild(row);
    });

    // Add total row
    if (yearData.length > 1) {
        const totalStats = calculateFeeStats(partiallyPaidStudents);
        const totalRow = document.createElement('tr');
        totalRow.className = 'grand-total-row';
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) : '0.0';
        
        totalRow.innerHTML = `
            <td><strong>TOTAL</strong></td>
            <td><strong>${partiallyPaidStudents.length}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>${totalCollectionPercentage}%</strong></td>
        `;
        tbody.appendChild(totalRow);
    }
}

// Display Course-wise Partially Paid Students
function displayFeeStatsCoursewisePartiallyPaid() {
    const tbody = document.querySelector('#feeStatsCoursewisePartiallyPaidTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const partiallyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0);
    const courseGroups = groupDataBy(partiallyPaidStudents, 'Course');
    const courseData = [];
    
    Object.keys(courseGroups).sort().forEach(course => {
        const courseStudents = courseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        courseData.push({
            course: course,
            students: courseStudents.length,
            ...stats
        });
    });

    courseData.forEach(data => {
        const row = document.createElement('tr');
        const collectionPercentage = data.totalAlloted > 0 ? ((data.totalPaid / data.totalAlloted) * 100).toFixed(1) : '0.0';
        
        row.innerHTML = `
            <td><strong>${data.course}</strong></td>
            <td>${data.students}</td>
            <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
            <td class="amount ${data.smpDue > 0 ? 'due-amount' : ''}">₹${data.smpDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.svkDue > 0 ? 'due-amount' : ''}">₹${data.svkDue.toLocaleString('en-IN')}</td>
            <td class="amount ${data.totalDue > 0 ? 'due-amount' : ''}">₹${data.totalDue.toLocaleString('en-IN')}</td>
            <td class="amount">${collectionPercentage}%</td>
        `;
        tbody.appendChild(row);
    });

    // Add total row
    if (courseData.length > 1) {
        const totalStats = calculateFeeStats(partiallyPaidStudents);
        const totalRow = document.createElement('tr');
        totalRow.className = 'grand-total-row';
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) : '0.0';
        
        totalRow.innerHTML = `
            <td><strong>TOTAL</strong></td>
            <td><strong>${partiallyPaidStudents.length}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>${totalCollectionPercentage}%</strong></td>
        `;
        tbody.appendChild(totalRow);
    }
}

// Display Combined Year & Course-wise Fully Paid Students
function displayFeeStatsCombinedFullyPaid() {
    const tbody = document.querySelector('#feeStatsCombinedFullyPaidTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const fullyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] === 0);
    const combinedGroups = {};
    
    fullyPaidStudents.forEach(student => {
        const key = `${student['Year']}-${student['Course']}`;
        if (!combinedGroups[key]) {
            combinedGroups[key] = [];
        }
        combinedGroups[key].push(student);
    });

    const combinedData = [];
    const yearSubtotals = {};
    
    Object.keys(combinedGroups).sort().forEach(key => {
        const [year, course] = key.split('-');
        const students = combinedGroups[key];
        const stats = calculateFeeStats(students);
        
        if (!yearSubtotals[year]) {
            yearSubtotals[year] = [];
        }
        yearSubtotals[year].push({
            year, course, students: students.length, ...stats
        });
    });

    Object.keys(yearSubtotals).sort().forEach(year => {
        const yearData = yearSubtotals[year];
        
        yearData.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.year}</td>
                <td><strong>${data.course}</strong></td>
                <td>${data.students}</td>
                <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
                <td class="amount">100.0%</td>
            `;
            tbody.appendChild(row);
        });

        // Add year subtotal if there are multiple courses
        if (yearData.length > 1) {
            const yearTotalStats = calculateFeeStats(fullyPaidStudents.filter(s => s['Year'] === year));
            const subtotalRow = document.createElement('tr');
            subtotalRow.className = 'year-subtotal-row';
            
            subtotalRow.innerHTML = `
                <td><strong>${year} SUBTOTAL</strong></td>
                <td><strong>All Courses</strong></td>
                <td><strong>${fullyPaidStudents.filter(s => s['Year'] === year).length}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>100.0%</strong></td>
            `;
            tbody.appendChild(subtotalRow);
        }
    });

    // Add grand total row
    if (Object.keys(combinedGroups).length > 1) {
        const totalStats = calculateFeeStats(fullyPaidStudents);
        const totalRow = document.createElement('tr');
        totalRow.className = 'grand-total-row';
        
        totalRow.innerHTML = `
            <td><strong>GRAND TOTAL</strong></td>
            <td><strong>All Years & Courses</strong></td>
            <td><strong>${fullyPaidStudents.length}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>100.0%</strong></td>
        `;
        tbody.appendChild(totalRow);
    }
}

// Display Combined Year & Course-wise Partially Paid Students
function displayFeeStatsCombinedPartiallyPaid() {
    const tbody = document.querySelector('#feeStatsCombinedPartiallyPaidTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const partiallyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0);
    const combinedGroups = {};
    
    partiallyPaidStudents.forEach(student => {
        const key = `${student['Year']}-${student['Course']}`;
        if (!combinedGroups[key]) {
            combinedGroups[key] = [];
        }
        combinedGroups[key].push(student);
    });

    const combinedData = [];
    const yearSubtotals = {};
    
    Object.keys(combinedGroups).sort().forEach(key => {
        const [year, course] = key.split('-');
        const students = combinedGroups[key];
        const stats = calculateFeeStats(students);
        
        if (!yearSubtotals[year]) {
            yearSubtotals[year] = [];
        }
        yearSubtotals[year].push({
            year, course, students: students.length, ...stats
        });
    });

    Object.keys(yearSubtotals).sort().forEach(year => {
        const yearData = yearSubtotals[year];
        
        yearData.forEach(data => {
            const row = document.createElement('tr');
            const collectionPercentage = data.totalAlloted > 0 ? ((data.totalPaid / data.totalAlloted) * 100).toFixed(1) : '0.0';
            
            row.innerHTML = `
                <td>${data.year}</td>
                <td><strong>${data.course}</strong></td>
                <td>${data.students}</td>
                <td class="amount">₹${data.smpAlloted.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.svkAlloted.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.totalAlloted.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.smpPaid.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.svkPaid.toLocaleString('en-IN')}</td>
                <td class="amount">₹${data.totalPaid.toLocaleString('en-IN')}</td>
                <td class="amount ${data.smpDue > 0 ? 'due-amount' : ''}">₹${data.smpDue.toLocaleString('en-IN')}</td>
                <td class="amount ${data.svkDue > 0 ? 'due-amount' : ''}">₹${data.svkDue.toLocaleString('en-IN')}</td>
                <td class="amount ${data.totalDue > 0 ? 'due-amount' : ''}">₹${data.totalDue.toLocaleString('en-IN')}</td>
                <td class="amount">${collectionPercentage}%</td>
            `;
            tbody.appendChild(row);
        });

        // Add year subtotal if there are multiple courses
        if (yearData.length > 1) {
            const yearTotalStats = calculateFeeStats(partiallyPaidStudents.filter(s => s['Year'] === year));
            const subtotalRow = document.createElement('tr');
            subtotalRow.className = 'year-subtotal-row';
            const yearCollectionPercentage = yearTotalStats.totalAlloted > 0 ? ((yearTotalStats.totalPaid / yearTotalStats.totalAlloted) * 100).toFixed(1) : '0.0';
            
            subtotalRow.innerHTML = `
                <td><strong>${year} SUBTOTAL</strong></td>
                <td><strong>All Courses</strong></td>
                <td><strong>${partiallyPaidStudents.filter(s => s['Year'] === year).length}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.smpDue.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.svkDue.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>₹${yearTotalStats.totalDue.toLocaleString('en-IN')}</strong></td>
                <td class="amount"><strong>${yearCollectionPercentage}%</strong></td>
            `;
            tbody.appendChild(subtotalRow);
        }
    });

    // Add grand total row
    if (Object.keys(combinedGroups).length > 1) {
        const totalStats = calculateFeeStats(partiallyPaidStudents);
        const totalRow = document.createElement('tr');
        totalRow.className = 'grand-total-row';
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) : '0.0';
        
        totalRow.innerHTML = `
            <td><strong>GRAND TOTAL</strong></td>
            <td><strong>All Years & Courses</strong></td>
            <td><strong>${partiallyPaidStudents.length}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalAlloted.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalPaid.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.smpDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.svkDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totalStats.totalDue.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>${totalCollectionPercentage}%</strong></td>
        `;
        tbody.appendChild(totalRow);
    }
}

// Helper function to calculate fee statistics for a group of students
function calculateFeeStats(students) {
    return {
        smpAlloted: students.reduce((sum, s) => sum + (s['SMP Alloted'] || 0), 0),
        svkAlloted: students.reduce((sum, s) => sum + (s['SVK Alloted'] || 0), 0),
        totalAlloted: students.reduce((sum, s) => sum + (s['Total Alloted'] || 0), 0),
        smpPaid: students.reduce((sum, s) => sum + (s['SMP Paid'] || 0), 0),
        svkPaid: students.reduce((sum, s) => sum + (s['SVK Paid'] || 0), 0),
        totalPaid: students.reduce((sum, s) => sum + (s['Total Paid'] || 0), 0),
        smpDue: students.reduce((sum, s) => sum + (s['SMP Due'] || 0), 0),
        svkDue: students.reduce((sum, s) => sum + (s['SVK Due'] || 0), 0),
        totalDue: students.reduce((sum, s) => sum + (s['Total Dues'] || 0), 0)
    };
}

// Helper function to group data by a specific field
function groupDataBy(data, field) {
    return data.reduce((groups, item) => {
        const key = item[field];
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

// Generate Fee Statistics Metrics
function generateFeeStatsMetrics() {
    const container = document.getElementById('feeStatsMetricsGrid');
    container.innerHTML = '';
    
    const totalStudents = filteredFeeStatsData.length;
    const fullyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] === 0).length;
    const partiallyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0).length;
    const dueStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0).length;
    
    const stats = calculateFeeStats(filteredFeeStatsData);
    const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) : '0.0';
    
    const formatAmount = (amount) => '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    
    const metrics = [
        { label: 'Total Students', value: totalStudents, color: 'var(--primary-color)' },
        { label: 'Fully Paid', value: fullyPaidStudents, color: 'var(--success-color)' },
        { label: 'Partially Paid', value: partiallyPaidStudents, color: 'var(--warning-color)' },
        { label: 'Dues Pending', value: dueStudents, color: 'var(--error-color)' },
        { label: 'Total Allotted', value: formatAmount(stats.totalAlloted), color: 'var(--info-color)' },
        { label: 'Total Collected', value: formatAmount(stats.totalPaid), color: 'var(--success-color)' },
        { label: 'Total Outstanding', value: formatAmount(stats.totalDue), color: 'var(--error-color)' },
        { label: 'Collection Rate', value: collectionPercentage + '%', color: 'var(--primary-color)' }
    ];

    metrics.forEach(metric => {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.innerHTML = `
            <div class="metric-value" style="color: ${metric.color}">${metric.value}</div>
            <div class="metric-label">${metric.label}</div>
        `;
        container.appendChild(card);
    });
}

// Export and PDF functions for Fee Statistics
function exportFeeStatsToCSV() {
    if (!confirm('📥 Export Fee Statistics to CSV?')) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    let csvContent = '';
    
    // === 1. SUMMARY TABLE ===
    csvContent += 'FEE COLLECTION SUMMARY,,,,,,,,,,,,\n';
    csvContent += 'Category,Students,SMP Allotted,SVK Allotted,Total Allotted,SMP Paid,SVK Paid,Total Paid,SMP Due,SVK Due,Total Due,Collection %\n';
    
    const totalStats = calculateFeeStats(filteredFeeStatsData);
    const summaryData = [
        {
            category: 'All Students',
            students: filteredFeeStatsData.length,
            ...totalStats
        },
        {
            category: 'Fully Paid',
            students: filteredFeeStatsData.filter(s => s['Total Dues'] === 0).length,
            ...calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] === 0))
        },
        {
            category: 'Partially Paid',
            students: filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0).length,
            ...calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0))
        },
        {
            category: 'Dues Pending',
            students: filteredFeeStatsData.filter(s => s['Total Dues'] > 0).length,
            ...calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0))
        }
    ];
    
    summaryData.forEach(data => {
        const collectionPercentage = data.totalAlloted > 0 ? ((data.totalPaid / data.totalAlloted) * 100).toFixed(1) : '0.0';
        csvContent += `${data.category},${data.students},${data.smpAlloted},${data.svkAlloted},${data.totalAlloted},${data.smpPaid},${data.svkPaid},${data.totalPaid},${data.smpDue},${data.svkDue},${data.totalDue},${collectionPercentage}%\n`;
    });
    
    csvContent += '\n\n';
    
    // === 2. YEAR-WISE TABLE ===
    csvContent += 'YEAR-WISE FEE COLLECTION STATISTICS,,,,,,,,,,,,\n';
    csvContent += 'Year,Students,SMP Allotted,SVK Allotted,Total Allotted,SMP Paid,SVK Paid,Total Paid,SMP Due,SVK Due,Total Due,Collection %\n';
    
    const yearGroups = groupDataBy(filteredFeeStatsData, 'Year');
    Object.keys(yearGroups).sort().forEach(year => {
        const yearStudents = yearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) : '0.0';
        csvContent += `${year},${yearStudents.length},${stats.smpAlloted},${stats.svkAlloted},${stats.totalAlloted},${stats.smpPaid},${stats.svkPaid},${stats.totalPaid},${stats.smpDue},${stats.svkDue},${stats.totalDue},${collectionPercentage}%\n`;
    });
    
    // Year-wise total
    if (Object.keys(yearGroups).length > 1) {
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) : '0.0';
        csvContent += `TOTAL,${filteredFeeStatsData.length},${totalStats.smpAlloted},${totalStats.svkAlloted},${totalStats.totalAlloted},${totalStats.smpPaid},${totalStats.svkPaid},${totalStats.totalPaid},${totalStats.smpDue},${totalStats.svkDue},${totalStats.totalDue},${totalCollectionPercentage}%\n`;
    }
    
    csvContent += '\n\n';
    
    // === 3. COURSE-WISE TABLE ===
    csvContent += 'COURSE-WISE FEE COLLECTION STATISTICS,,,,,,,,,,,,\n';
    csvContent += 'Course,Students,SMP Allotted,SVK Allotted,Total Allotted,SMP Paid,SVK Paid,Total Paid,SMP Due,SVK Due,Total Due,Collection %\n';
    
    const courseGroups = groupDataBy(filteredFeeStatsData, 'Course');
    Object.keys(courseGroups).sort().forEach(course => {
        const courseStudents = courseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) : '0.0';
        csvContent += `${course},${courseStudents.length},${stats.smpAlloted},${stats.svkAlloted},${stats.totalAlloted},${stats.smpPaid},${stats.svkPaid},${stats.totalPaid},${stats.smpDue},${stats.svkDue},${stats.totalDue},${collectionPercentage}%\n`;
    });
    
    // Course-wise total
    if (Object.keys(courseGroups).length > 1) {
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) : '0.0';
        csvContent += `TOTAL,${filteredFeeStatsData.length},${totalStats.smpAlloted},${totalStats.svkAlloted},${totalStats.totalAlloted},${totalStats.smpPaid},${totalStats.svkPaid},${totalStats.totalPaid},${totalStats.smpDue},${totalStats.svkDue},${totalStats.totalDue},${totalCollectionPercentage}%\n`;
    }
    
    csvContent += '\n\n';
    
    // === 4. COMBINED YEAR & COURSE-WISE TABLE ===
    csvContent += 'COMBINED YEAR & COURSE-WISE FEE STATISTICS,,,,,,,,,,,,,\n';
    csvContent += 'Year,Course,Students,SMP Allotted,SVK Allotted,Total Allotted,SMP Paid,SVK Paid,Total Paid,SMP Due,SVK Due,Total Due,Collection %\n';
    
    const combinedGroups = {};
    filteredFeeStatsData.forEach(student => {
        const key = `${student['Year']}-${student['Course']}`;
        if (!combinedGroups[key]) {
            combinedGroups[key] = [];
        }
        combinedGroups[key].push(student);
    });
    
    // Group by year for subtotals
    const yearSubtotals = {};
    Object.keys(combinedGroups).sort().forEach(key => {
        const [year, course] = key.split('-');
        const students = combinedGroups[key];
        const stats = calculateFeeStats(students);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) : '0.0';
        
        if (!yearSubtotals[year]) {
            yearSubtotals[year] = [];
        }
        yearSubtotals[year].push({
            year, course, students: students.length, ...stats, collectionPercentage
        });
    });
    
    Object.keys(yearSubtotals).sort().forEach(year => {
        const yearData = yearSubtotals[year];
        
        yearData.forEach(data => {
            csvContent += `${data.year},${data.course},${data.students},${data.smpAlloted},${data.svkAlloted},${data.totalAlloted},${data.smpPaid},${data.svkPaid},${data.totalPaid},${data.smpDue},${data.svkDue},${data.totalDue},${data.collectionPercentage}%\n`;
        });
        
        // Add year subtotal if there are multiple courses
        if (yearData.length > 1) {
            const yearTotalStats = calculateFeeStats(filteredFeeStatsData.filter(s => s['Year'] === year));
            const yearCollectionPercentage = yearTotalStats.totalAlloted > 0 ? ((yearTotalStats.totalPaid / yearTotalStats.totalAlloted) * 100).toFixed(1) : '0.0';
            csvContent += `${year} SUBTOTAL,All Courses,${filteredFeeStatsData.filter(s => s['Year'] === year).length},${yearTotalStats.smpAlloted},${yearTotalStats.svkAlloted},${yearTotalStats.totalAlloted},${yearTotalStats.smpPaid},${yearTotalStats.svkPaid},${yearTotalStats.totalPaid},${yearTotalStats.smpDue},${yearTotalStats.svkDue},${yearTotalStats.totalDue},${yearCollectionPercentage}%\n`;
        }
    });
    
    // Add grand total
    if (Object.keys(combinedGroups).length > 1) {
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) : '0.0';
        csvContent += `GRAND TOTAL,All Years & Courses,${filteredFeeStatsData.length},${totalStats.smpAlloted},${totalStats.svkAlloted},${totalStats.totalAlloted},${totalStats.smpPaid},${totalStats.svkPaid},${totalStats.totalPaid},${totalStats.smpDue},${totalStats.svkDue},${totalStats.totalDue},${totalCollectionPercentage}%\n`;
    }
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SMP_Fee_Statistics_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function saveFeeStatsToExcel() {
    if (!confirm('📊 Save Complete Fee Statistics as Excel file with multiple sheets? This will include all tables in separate sheets.')) return;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];
    
    // 1. Fee Collection Summary Sheet
    const totalStats = calculateFeeStats(filteredFeeStatsData);
    const summaryData = [
        ['Category', 'Total Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %'],
        [
            'All Students', filteredFeeStatsData.length,
            totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted,
            totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid,
            totalStats.smpDue, totalStats.svkDue, totalStats.totalDue,
            (totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%')
        ],
        [
            'Fully Paid', filteredFeeStatsData.filter(s => s['Total Dues'] === 0).length,
            ...Object.values(calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] === 0))),
            '100.0%'
        ],
        [
            'Partially Paid', filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0).length,
            ...Object.values(calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0))),
            ((calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0)).totalPaid / calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0)).totalAlloted) * 100).toFixed(1) + '%'
        ],
        [
            'Dues Pending', filteredFeeStatsData.filter(s => s['Total Dues'] > 0).length,
            ...Object.values(calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0))),
            ((calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0)).totalPaid / calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0)).totalAlloted) * 100).toFixed(1) + '%'
        ]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Fee Summary');
    
    // 2. Year-wise Fee Statistics Sheet
    const yearGroups = groupDataBy(filteredFeeStatsData, 'Year');
    const yearData = [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']];
    
    Object.keys(yearGroups).sort().forEach(year => {
        const yearStudents = yearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        yearData.push([
            year, yearStudents.length,
            stats.smpAlloted, stats.svkAlloted, stats.totalAlloted,
            stats.smpPaid, stats.svkPaid, stats.totalPaid,
            stats.smpDue, stats.svkDue, stats.totalDue,
            collectionPercentage
        ]);
    });
    
    // Add year-wise total row
    if (Object.keys(yearGroups).length > 1) {
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        yearData.push([
            'TOTAL', filteredFeeStatsData.length,
            totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted,
            totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid,
            totalStats.smpDue, totalStats.svkDue, totalStats.totalDue,
            totalCollectionPercentage
        ]);
    }
    
    const yearSheet = XLSX.utils.aoa_to_sheet(yearData);
    XLSX.utils.book_append_sheet(workbook, yearSheet, 'Year-wise Statistics');
    
    // 3. Course-wise Fee Statistics Sheet
    const courseGroups = groupDataBy(filteredFeeStatsData, 'Course');
    const courseData = [['Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']];
    
    Object.keys(courseGroups).sort().forEach(course => {
        const courseStudents = courseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        courseData.push([
            course, courseStudents.length,
            stats.smpAlloted, stats.svkAlloted, stats.totalAlloted,
            stats.smpPaid, stats.svkPaid, stats.totalPaid,
            stats.smpDue, stats.svkDue, stats.totalDue,
            collectionPercentage
        ]);
    });
    
    // Add course-wise total row
    if (Object.keys(courseGroups).length > 1) {
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        courseData.push([
            'TOTAL', filteredFeeStatsData.length,
            totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted,
            totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid,
            totalStats.smpDue, totalStats.svkDue, totalStats.totalDue,
            totalCollectionPercentage
        ]);
    }
    
    const courseSheet = XLSX.utils.aoa_to_sheet(courseData);
    XLSX.utils.book_append_sheet(workbook, courseSheet, 'Course-wise Statistics');
    
    // 4. Combined Year & Course-wise Sheet
    const combinedGroups = {};
    filteredFeeStatsData.forEach(student => {
        const key = `${student['Year']}-${student['Course']}`;
        if (!combinedGroups[key]) {
            combinedGroups[key] = [];
        }
        combinedGroups[key].push(student);
    });
    
    const combinedData = [['Year', 'Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']];
    const yearSubtotals = {};
    
    Object.keys(combinedGroups).sort().forEach(key => {
        const [year, course] = key.split('-');
        const students = combinedGroups[key];
        const stats = calculateFeeStats(students);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        
        if (!yearSubtotals[year]) {
            yearSubtotals[year] = [];
        }
        yearSubtotals[year].push({
            year, course, students: students.length, ...stats, collectionPercentage
        });
    });
    
    Object.keys(yearSubtotals).sort().forEach(year => {
        const yearCourseData = yearSubtotals[year];
        
        yearCourseData.forEach(data => {
            combinedData.push([
                data.year, data.course, data.students,
                data.smpAlloted, data.svkAlloted, data.totalAlloted,
                data.smpPaid, data.svkPaid, data.totalPaid,
                data.smpDue, data.svkDue, data.totalDue,
                data.collectionPercentage
            ]);
        });
        
        // Add year subtotal if there are multiple courses
        if (yearCourseData.length > 1) {
            const yearTotalStats = calculateFeeStats(filteredFeeStatsData.filter(s => s['Year'] === year));
            const yearCollectionPercentage = yearTotalStats.totalAlloted > 0 ? ((yearTotalStats.totalPaid / yearTotalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
            combinedData.push([
                `${year} SUBTOTAL`, 'All Courses', filteredFeeStatsData.filter(s => s['Year'] === year).length,
                yearTotalStats.smpAlloted, yearTotalStats.svkAlloted, yearTotalStats.totalAlloted,
                yearTotalStats.smpPaid, yearTotalStats.svkPaid, yearTotalStats.totalPaid,
                yearTotalStats.smpDue, yearTotalStats.svkDue, yearTotalStats.totalDue,
                yearCollectionPercentage
            ]);
        }
    });
    
    // Add grand total
    if (Object.keys(combinedGroups).length > 1) {
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        combinedData.push([
            'GRAND TOTAL', 'All Years & Courses', filteredFeeStatsData.length,
            totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted,
            totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid,
            totalStats.smpDue, totalStats.svkDue, totalStats.totalDue,
            totalCollectionPercentage
        ]);
    }
    
    const combinedSheet = XLSX.utils.aoa_to_sheet(combinedData);
    XLSX.utils.book_append_sheet(workbook, combinedSheet, 'Combined Statistics');
    
    // 5. Fully Paid Students Sheet
    const fullyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] === 0);
    const fullyPaidYearGroups = groupDataBy(fullyPaidStudents, 'Year');
    const fullyPaidData = [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'Collection %']];
    
    Object.keys(fullyPaidYearGroups).sort().forEach(year => {
        const yearStudents = fullyPaidYearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        fullyPaidData.push([
            year, yearStudents.length,
            stats.smpAlloted, stats.svkAlloted, stats.totalAlloted,
            stats.smpPaid, stats.svkPaid, stats.totalPaid,
            '100.0%'
        ]);
    });
    
    if (Object.keys(fullyPaidYearGroups).length > 1) {
        const fullyPaidTotalStats = calculateFeeStats(fullyPaidStudents);
        fullyPaidData.push([
            'TOTAL', fullyPaidStudents.length,
            fullyPaidTotalStats.smpAlloted, fullyPaidTotalStats.svkAlloted, fullyPaidTotalStats.totalAlloted,
            fullyPaidTotalStats.smpPaid, fullyPaidTotalStats.svkPaid, fullyPaidTotalStats.totalPaid,
            '100.0%'
        ]);
    }
    
    const fullyPaidSheet = XLSX.utils.aoa_to_sheet(fullyPaidData);
    XLSX.utils.book_append_sheet(workbook, fullyPaidSheet, 'Fully Paid Students');
    
    // 6. Partially Paid Students Sheet
    const partiallyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0);
    const partiallyPaidYearGroups = groupDataBy(partiallyPaidStudents, 'Year');
    const partiallyPaidData = [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']];
    
    Object.keys(partiallyPaidYearGroups).sort().forEach(year => {
        const yearStudents = partiallyPaidYearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        partiallyPaidData.push([
            year, yearStudents.length,
            stats.smpAlloted, stats.svkAlloted, stats.totalAlloted,
            stats.smpPaid, stats.svkPaid, stats.totalPaid,
            stats.smpDue, stats.svkDue, stats.totalDue,
            collectionPercentage
        ]);
    });
    
    if (Object.keys(partiallyPaidYearGroups).length > 1) {
        const partiallyPaidTotalStats = calculateFeeStats(partiallyPaidStudents);
        const totalCollectionPercentage = partiallyPaidTotalStats.totalAlloted > 0 ? ((partiallyPaidTotalStats.totalPaid / partiallyPaidTotalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        partiallyPaidData.push([
            'TOTAL', partiallyPaidStudents.length,
            partiallyPaidTotalStats.smpAlloted, partiallyPaidTotalStats.svkAlloted, partiallyPaidTotalStats.totalAlloted,
            partiallyPaidTotalStats.smpPaid, partiallyPaidTotalStats.svkPaid, partiallyPaidTotalStats.totalPaid,
            partiallyPaidTotalStats.smpDue, partiallyPaidTotalStats.svkDue, partiallyPaidTotalStats.totalDue,
            totalCollectionPercentage
        ]);
    }
    
    const partiallyPaidSheet = XLSX.utils.aoa_to_sheet(partiallyPaidData);
    XLSX.utils.book_append_sheet(workbook, partiallyPaidSheet, 'Partially Paid Students');
    
    // Save the workbook
    XLSX.writeFile(workbook, `SMP_Complete_Fee_Statistics_${timestamp}.xlsx`);
    showToast('✅ Excel file exported successfully with multiple sheets!', 'success');
}

// Individual Excel Export Functions for Fee Statistics Tables
function exportFeeStatsSummaryToExcel() {
    if (!confirm('📊 Export Fee Collection Summary to Excel?')) return;
    
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];
    
    const totalStats = calculateFeeStats(filteredFeeStatsData);
    const summaryData = [
        ['Category', 'Total Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %'],
        [
            'All Students', filteredFeeStatsData.length,
            totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted,
            totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid,
            totalStats.smpDue, totalStats.svkDue, totalStats.totalDue,
            (totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%')
        ],
        [
            'Fully Paid', filteredFeeStatsData.filter(s => s['Total Dues'] === 0).length,
            ...Object.values(calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] === 0))),
            '100.0%'
        ],
        [
            'Partially Paid', filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0).length,
            ...Object.values(calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0))),
            ((calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0)).totalPaid / calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0)).totalAlloted) * 100).toFixed(1) + '%'
        ],
        [
            'Dues Pending', filteredFeeStatsData.filter(s => s['Total Dues'] > 0).length,
            ...Object.values(calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0))),
            ((calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0)).totalPaid / calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0)).totalAlloted) * 100).toFixed(1) + '%'
        ]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Fee Summary');
    XLSX.writeFile(workbook, `SMP_Fee_Summary_${timestamp}.xlsx`);
    showToast('✅ Fee Summary exported to Excel!', 'success');
}

function exportFeeStatsYearwiseToExcel() {
    if (!confirm('📅 Export Year-wise Fee Statistics to Excel?')) return;
    
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];
    
    const yearGroups = groupDataBy(filteredFeeStatsData, 'Year');
    const yearData = [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']];
    
    Object.keys(yearGroups).sort().forEach(year => {
        const yearStudents = yearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        yearData.push([
            year, yearStudents.length,
            stats.smpAlloted, stats.svkAlloted, stats.totalAlloted,
            stats.smpPaid, stats.svkPaid, stats.totalPaid,
            stats.smpDue, stats.svkDue, stats.totalDue,
            collectionPercentage
        ]);
    });
    
    if (Object.keys(yearGroups).length > 1) {
        const totalStats = calculateFeeStats(filteredFeeStatsData);
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        yearData.push([
            'TOTAL', filteredFeeStatsData.length,
            totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted,
            totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid,
            totalStats.smpDue, totalStats.svkDue, totalStats.totalDue,
            totalCollectionPercentage
        ]);
    }
    
    const yearSheet = XLSX.utils.aoa_to_sheet(yearData);
    XLSX.utils.book_append_sheet(workbook, yearSheet, 'Year-wise Statistics');
    XLSX.writeFile(workbook, `SMP_Year_wise_Fee_Statistics_${timestamp}.xlsx`);
    showToast('✅ Year-wise Statistics exported to Excel!', 'success');
}

function exportFeeStatsCoursewiseToExcel() {
    if (!confirm('🎓 Export Course-wise Fee Statistics to Excel?')) return;
    
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];
    
    const courseGroups = groupDataBy(filteredFeeStatsData, 'Course');
    const courseData = [['Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']];
    
    Object.keys(courseGroups).sort().forEach(course => {
        const courseStudents = courseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        courseData.push([
            course, courseStudents.length,
            stats.smpAlloted, stats.svkAlloted, stats.totalAlloted,
            stats.smpPaid, stats.svkPaid, stats.totalPaid,
            stats.smpDue, stats.svkDue, stats.totalDue,
            collectionPercentage
        ]);
    });
    
    if (Object.keys(courseGroups).length > 1) {
        const totalStats = calculateFeeStats(filteredFeeStatsData);
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        courseData.push([
            'TOTAL', filteredFeeStatsData.length,
            totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted,
            totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid,
            totalStats.smpDue, totalStats.svkDue, totalStats.totalDue,
            totalCollectionPercentage
        ]);
    }
    
    const courseSheet = XLSX.utils.aoa_to_sheet(courseData);
    XLSX.utils.book_append_sheet(workbook, courseSheet, 'Course-wise Statistics');
    XLSX.writeFile(workbook, `SMP_Course_wise_Fee_Statistics_${timestamp}.xlsx`);
    showToast('✅ Course-wise Statistics exported to Excel!', 'success');
}

function exportFeeStatsCombinedToExcel() {
    if (!confirm('🔢 Export Combined Year & Course-wise Fee Statistics to Excel?')) return;
    
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];
    
    const combinedGroups = {};
    filteredFeeStatsData.forEach(student => {
        const key = `${student['Year']}-${student['Course']}`;
        if (!combinedGroups[key]) {
            combinedGroups[key] = [];
        }
        combinedGroups[key].push(student);
    });
    
    const combinedData = [['Year', 'Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']];
    const yearSubtotals = {};
    
    Object.keys(combinedGroups).sort().forEach(key => {
        const [year, course] = key.split('-');
        const students = combinedGroups[key];
        const stats = calculateFeeStats(students);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        
        if (!yearSubtotals[year]) {
            yearSubtotals[year] = [];
        }
        yearSubtotals[year].push({
            year, course, students: students.length, ...stats, collectionPercentage
        });
    });
    
    Object.keys(yearSubtotals).sort().forEach(year => {
        const yearCourseData = yearSubtotals[year];
        
        yearCourseData.forEach(data => {
            combinedData.push([
                data.year, data.course, data.students,
                data.smpAlloted, data.svkAlloted, data.totalAlloted,
                data.smpPaid, data.svkPaid, data.totalPaid,
                data.smpDue, data.svkDue, data.totalDue,
                data.collectionPercentage
            ]);
        });
        
        if (yearCourseData.length > 1) {
            const yearTotalStats = calculateFeeStats(filteredFeeStatsData.filter(s => s['Year'] === year));
            const yearCollectionPercentage = yearTotalStats.totalAlloted > 0 ? ((yearTotalStats.totalPaid / yearTotalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
            combinedData.push([
                `${year} SUBTOTAL`, 'All Courses', filteredFeeStatsData.filter(s => s['Year'] === year).length,
                yearTotalStats.smpAlloted, yearTotalStats.svkAlloted, yearTotalStats.totalAlloted,
                yearTotalStats.smpPaid, yearTotalStats.svkPaid, yearTotalStats.totalPaid,
                yearTotalStats.smpDue, yearTotalStats.svkDue, yearTotalStats.totalDue,
                yearCollectionPercentage
            ]);
        }
    });
    
    if (Object.keys(combinedGroups).length > 1) {
        const totalStats = calculateFeeStats(filteredFeeStatsData);
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        combinedData.push([
            'GRAND TOTAL', 'All Years & Courses', filteredFeeStatsData.length,
            totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted,
            totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid,
            totalStats.smpDue, totalStats.svkDue, totalStats.totalDue,
            totalCollectionPercentage
        ]);
    }
    
    const combinedSheet = XLSX.utils.aoa_to_sheet(combinedData);
    XLSX.utils.book_append_sheet(workbook, combinedSheet, 'Combined Statistics');
    XLSX.writeFile(workbook, `SMP_Combined_Fee_Statistics_${timestamp}.xlsx`);
    showToast('✅ Combined Statistics exported to Excel!', 'success');
}

function exportFeeStatsFullyPaidToExcel() {
    if (!confirm('✅ Export Fully Paid Students Statistics to Excel?')) return;
    
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];
    
    const fullyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] === 0);
    const fullyPaidYearGroups = groupDataBy(fullyPaidStudents, 'Year');
    const fullyPaidData = [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'Collection %']];
    
    Object.keys(fullyPaidYearGroups).sort().forEach(year => {
        const yearStudents = fullyPaidYearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        fullyPaidData.push([
            year, yearStudents.length,
            stats.smpAlloted, stats.svkAlloted, stats.totalAlloted,
            stats.smpPaid, stats.svkPaid, stats.totalPaid,
            '100.0%'
        ]);
    });
    
    if (Object.keys(fullyPaidYearGroups).length > 1) {
        const fullyPaidTotalStats = calculateFeeStats(fullyPaidStudents);
        fullyPaidData.push([
            'TOTAL', fullyPaidStudents.length,
            fullyPaidTotalStats.smpAlloted, fullyPaidTotalStats.svkAlloted, fullyPaidTotalStats.totalAlloted,
            fullyPaidTotalStats.smpPaid, fullyPaidTotalStats.svkPaid, fullyPaidTotalStats.totalPaid,
            '100.0%'
        ]);
    }
    
    const fullyPaidSheet = XLSX.utils.aoa_to_sheet(fullyPaidData);
    XLSX.utils.book_append_sheet(workbook, fullyPaidSheet, 'Fully Paid Students');
    XLSX.writeFile(workbook, `SMP_Fully_Paid_Students_${timestamp}.xlsx`);
    showToast('✅ Fully Paid Students exported to Excel!', 'success');
}

function exportFeeStatsPartiallyPaidToExcel() {
    if (!confirm('⚠️ Export Partially Paid Students Statistics to Excel?')) return;
    
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];
    
    const partiallyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0);
    const partiallyPaidYearGroups = groupDataBy(partiallyPaidStudents, 'Year');
    const partiallyPaidData = [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']];
    
    Object.keys(partiallyPaidYearGroups).sort().forEach(year => {
        const yearStudents = partiallyPaidYearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        partiallyPaidData.push([
            year, yearStudents.length,
            stats.smpAlloted, stats.svkAlloted, stats.totalAlloted,
            stats.smpPaid, stats.svkPaid, stats.totalPaid,
            stats.smpDue, stats.svkDue, stats.totalDue,
            collectionPercentage
        ]);
    });
    
    if (Object.keys(partiallyPaidYearGroups).length > 1) {
        const partiallyPaidTotalStats = calculateFeeStats(partiallyPaidStudents);
        const totalCollectionPercentage = partiallyPaidTotalStats.totalAlloted > 0 ? ((partiallyPaidTotalStats.totalPaid / partiallyPaidTotalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        partiallyPaidData.push([
            'TOTAL', partiallyPaidStudents.length,
            partiallyPaidTotalStats.smpAlloted, partiallyPaidTotalStats.svkAlloted, partiallyPaidTotalStats.totalAlloted,
            partiallyPaidTotalStats.smpPaid, partiallyPaidTotalStats.svkPaid, partiallyPaidTotalStats.totalPaid,
            partiallyPaidTotalStats.smpDue, partiallyPaidTotalStats.svkDue, partiallyPaidTotalStats.totalDue,
            totalCollectionPercentage
        ]);
    }
    
    const partiallyPaidSheet = XLSX.utils.aoa_to_sheet(partiallyPaidData);
    XLSX.utils.book_append_sheet(workbook, partiallyPaidSheet, 'Partially Paid Students');
    XLSX.writeFile(workbook, `SMP_Partially_Paid_Students_${timestamp}.xlsx`);
    showToast('✅ Partially Paid Students exported to Excel!', 'success');
}

// Individual PDF Export Functions for Fee Statistics Tables (Following Fee List Logic)
function exportFeeStatsSummaryToPDF() {
    if (!confirm('📊 Export Fee Collection Summary to PDF?')) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4 mode
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Fee Collection Summary', 148, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 148, 32, { align: 'center' });
    doc.text(`Total Students: ${filteredFeeStatsData.length}`, 148, 38, { align: 'center' });
    
    // Table data
    const totalStats = calculateFeeStats(filteredFeeStatsData);
    const tableData = [
        ['All Students', filteredFeeStatsData.length, totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted, totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid, totalStats.smpDue, totalStats.svkDue, totalStats.totalDue, (totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%')],
        ['Fully Paid', filteredFeeStatsData.filter(s => s['Total Dues'] === 0).length, ...Object.values(calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] === 0))), '100.0%'],
        ['Partially Paid', filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0).length, ...Object.values(calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0))), ((calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0)).totalPaid / calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0)).totalAlloted) * 100).toFixed(1) + '%'],
        ['Dues Pending', filteredFeeStatsData.filter(s => s['Total Dues'] > 0).length, ...Object.values(calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0))), ((calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0)).totalPaid / calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0)).totalAlloted) * 100).toFixed(1) + '%']
    ];
    
    doc.autoTable({
        head: [['Category', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 2, font: 'times', textColor: [0, 0, 0] },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 10, right: 10 }
    });
    
    doc.save(`SMP_Fee_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('✅ Fee Summary PDF saved!', 'success');
}

function exportFeeStatsYearwiseToPDF() {
    if (!confirm('📅 Export Year-wise Fee Statistics to PDF?')) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Year-wise Fee Collection Statistics', 148, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 148, 32, { align: 'center' });
    doc.text(`Total Students: ${filteredFeeStatsData.length}`, 148, 38, { align: 'center' });
    
    const yearGroups = groupDataBy(filteredFeeStatsData, 'Year');
    const tableData = [];
    
    Object.keys(yearGroups).sort().forEach(year => {
        const yearStudents = yearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        tableData.push([year, yearStudents.length, stats.smpAlloted, stats.svkAlloted, stats.totalAlloted, stats.smpPaid, stats.svkPaid, stats.totalPaid, stats.smpDue, stats.svkDue, stats.totalDue, collectionPercentage]);
    });
    
    if (Object.keys(yearGroups).length > 1) {
        const totalStats = calculateFeeStats(filteredFeeStatsData);
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        tableData.push(['TOTAL', filteredFeeStatsData.length, totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted, totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid, totalStats.smpDue, totalStats.svkDue, totalStats.totalDue, totalCollectionPercentage]);
    }
    
    doc.autoTable({
        head: [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 2, font: 'times', textColor: [0, 0, 0] },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            if (data.row.index === tableData.length - 1 && tableData.length > 1 && data.cell.text[0] === 'TOTAL') {
                data.cell.styles.fillColor = [41, 128, 185];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 10, right: 10 }
    });
    
    doc.save(`SMP_Year_wise_Fee_Statistics_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('✅ Year-wise Statistics PDF saved!', 'success');
}

function exportFeeStatsCoursewiseToPDF() {
    if (!confirm('🎓 Export Course-wise Fee Statistics to PDF?')) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Course-wise Fee Collection Statistics', 148, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 148, 32, { align: 'center' });
    doc.text(`Total Students: ${filteredFeeStatsData.length}`, 148, 38, { align: 'center' });
    
    const courseGroups = groupDataBy(filteredFeeStatsData, 'Course');
    const tableData = [];
    
    Object.keys(courseGroups).sort().forEach(course => {
        const courseStudents = courseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        tableData.push([course, courseStudents.length, stats.smpAlloted, stats.svkAlloted, stats.totalAlloted, stats.smpPaid, stats.svkPaid, stats.totalPaid, stats.smpDue, stats.svkDue, stats.totalDue, collectionPercentage]);
    });
    
    if (Object.keys(courseGroups).length > 1) {
        const totalStats = calculateFeeStats(filteredFeeStatsData);
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        tableData.push(['TOTAL', filteredFeeStatsData.length, totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted, totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid, totalStats.smpDue, totalStats.svkDue, totalStats.totalDue, totalCollectionPercentage]);
    }
    
    doc.autoTable({
        head: [['Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 2, font: 'times', textColor: [0, 0, 0] },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            if (data.row.index === tableData.length - 1 && tableData.length > 1 && data.cell.text[0] === 'TOTAL') {
                data.cell.styles.fillColor = [41, 128, 185];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 10, right: 10 }
    });
    
    doc.save(`SMP_Course_wise_Fee_Statistics_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('✅ Course-wise Statistics PDF saved!', 'success');
}

function exportFeeStatsCombinedToPDF() {
    if (!confirm('🔢 Export Combined Year & Course-wise Fee Statistics to PDF?')) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Combined Year & Course-wise Fee Statistics', 148, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 148, 32, { align: 'center' });
    doc.text(`Total Students: ${filteredFeeStatsData.length}`, 148, 38, { align: 'center' });
    
    const combinedGroups = {};
    filteredFeeStatsData.forEach(student => {
        const key = `${student['Year']}-${student['Course']}`;
        if (!combinedGroups[key]) {
            combinedGroups[key] = [];
        }
        combinedGroups[key].push(student);
    });
    
    const tableData = [];
    const yearSubtotals = {};
    
    Object.keys(combinedGroups).sort().forEach(key => {
        const [year, course] = key.split('-');
        const students = combinedGroups[key];
        const stats = calculateFeeStats(students);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        
        if (!yearSubtotals[year]) {
            yearSubtotals[year] = [];
        }
        yearSubtotals[year].push({
            year, course, students: students.length, ...stats, collectionPercentage
        });
    });
    
    Object.keys(yearSubtotals).sort().forEach(year => {
        const yearCourseData = yearSubtotals[year];
        
        yearCourseData.forEach(data => {
            tableData.push([data.year, data.course, data.students, data.smpAlloted, data.svkAlloted, data.totalAlloted, data.smpPaid, data.svkPaid, data.totalPaid, data.smpDue, data.svkDue, data.totalDue, data.collectionPercentage]);
        });
        
        if (yearCourseData.length > 1) {
            const yearTotalStats = calculateFeeStats(filteredFeeStatsData.filter(s => s['Year'] === year));
            const yearCollectionPercentage = yearTotalStats.totalAlloted > 0 ? ((yearTotalStats.totalPaid / yearTotalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
            tableData.push([`${year} SUBTOTAL`, 'All Courses', filteredFeeStatsData.filter(s => s['Year'] === year).length, yearTotalStats.smpAlloted, yearTotalStats.svkAlloted, yearTotalStats.totalAlloted, yearTotalStats.smpPaid, yearTotalStats.svkPaid, yearTotalStats.totalPaid, yearTotalStats.smpDue, yearTotalStats.svkDue, yearTotalStats.totalDue, yearCollectionPercentage]);
        }
    });
    
    if (Object.keys(combinedGroups).length > 1) {
        const totalStats = calculateFeeStats(filteredFeeStatsData);
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        tableData.push(['GRAND TOTAL', 'All Years & Courses', filteredFeeStatsData.length, totalStats.smpAlloted, totalStats.svkAlloted, totalStats.totalAlloted, totalStats.smpPaid, totalStats.svkPaid, totalStats.totalPaid, totalStats.smpDue, totalStats.svkDue, totalStats.totalDue, totalCollectionPercentage]);
    }
    
    doc.autoTable({
        head: [['Year', 'Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 7, cellPadding: 1.5, font: 'times', textColor: [0, 0, 0] },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            const cellText = data.cell.text[0];
            if (cellText && (cellText.includes('SUBTOTAL') || cellText.includes('GRAND TOTAL'))) {
                if (cellText.includes('GRAND TOTAL')) {
                    data.cell.styles.fillColor = [41, 128, 185];
                    data.cell.styles.textColor = [255, 255, 255];
                } else {
                    data.cell.styles.fillColor = [76, 175, 80];
                    data.cell.styles.textColor = [255, 255, 255];
                }
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 8, right: 8 }
    });
    
    doc.save(`SMP_Combined_Fee_Statistics_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('✅ Combined Statistics PDF saved!', 'success');
}

function exportFeeStatsFullyPaidToPDF() {
    if (!confirm('✅ Export Fully Paid Students Statistics to PDF?')) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Fully Paid Students Statistics', 148, 25, { align: 'center' });
    
    const fullyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] === 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 148, 32, { align: 'center' });
    doc.text(`Fully Paid Students: ${fullyPaidStudents.length}`, 148, 38, { align: 'center' });
    
    const fullyPaidYearGroups = groupDataBy(fullyPaidStudents, 'Year');
    const tableData = [];
    
    Object.keys(fullyPaidYearGroups).sort().forEach(year => {
        const yearStudents = fullyPaidYearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        tableData.push([year, yearStudents.length, stats.smpAlloted, stats.svkAlloted, stats.totalAlloted, stats.smpPaid, stats.svkPaid, stats.totalPaid, '100.0%']);
    });
    
    if (Object.keys(fullyPaidYearGroups).length > 1) {
        const fullyPaidTotalStats = calculateFeeStats(fullyPaidStudents);
        tableData.push(['TOTAL', fullyPaidStudents.length, fullyPaidTotalStats.smpAlloted, fullyPaidTotalStats.svkAlloted, fullyPaidTotalStats.totalAlloted, fullyPaidTotalStats.smpPaid, fullyPaidTotalStats.svkPaid, fullyPaidTotalStats.totalPaid, '100.0%']);
    }
    
    doc.autoTable({
        head: [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'Collection %']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 2, font: 'times', textColor: [0, 0, 0] },
        headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            if (data.row.index === tableData.length - 1 && tableData.length > 1 && data.cell.text[0] === 'TOTAL') {
                data.cell.styles.fillColor = [76, 175, 80];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 10, right: 10 }
    });
    
    doc.save(`SMP_Fully_Paid_Students_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('✅ Fully Paid Students PDF saved!', 'success');
}

function exportFeeStatsPartiallyPaidToPDF() {
    if (!confirm('⚠️ Export Partially Paid Students Statistics to PDF?')) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('SMP Admn Stats 2025-26', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Partially Paid Students Statistics', 148, 25, { align: 'center' });
    
    const partiallyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${currentDate}`, 148, 32, { align: 'center' });
    doc.text(`Partially Paid Students: ${partiallyPaidStudents.length}`, 148, 38, { align: 'center' });
    
    const partiallyPaidYearGroups = groupDataBy(partiallyPaidStudents, 'Year');
    const tableData = [];
    
    Object.keys(partiallyPaidYearGroups).sort().forEach(year => {
        const yearStudents = partiallyPaidYearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        tableData.push([year, yearStudents.length, stats.smpAlloted, stats.svkAlloted, stats.totalAlloted, stats.smpPaid, stats.svkPaid, stats.totalPaid, stats.smpDue, stats.svkDue, stats.totalDue, collectionPercentage]);
    });
    
    if (Object.keys(partiallyPaidYearGroups).length > 1) {
        const partiallyPaidTotalStats = calculateFeeStats(partiallyPaidStudents);
        const totalCollectionPercentage = partiallyPaidTotalStats.totalAlloted > 0 ? ((partiallyPaidTotalStats.totalPaid / partiallyPaidTotalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        tableData.push(['TOTAL', partiallyPaidStudents.length, partiallyPaidTotalStats.smpAlloted, partiallyPaidTotalStats.svkAlloted, partiallyPaidTotalStats.totalAlloted, partiallyPaidTotalStats.smpPaid, partiallyPaidTotalStats.svkPaid, partiallyPaidTotalStats.totalPaid, partiallyPaidTotalStats.smpDue, partiallyPaidTotalStats.svkDue, partiallyPaidTotalStats.totalDue, totalCollectionPercentage]);
    }
    
    doc.autoTable({
        head: [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 2, font: 'times', textColor: [0, 0, 0] },
        headStyles: { fillColor: [255, 152, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            if (data.row.index === tableData.length - 1 && tableData.length > 1 && data.cell.text[0] === 'TOTAL') {
                data.cell.styles.fillColor = [255, 152, 0];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 10, right: 10 }
    });
    
    doc.save(`SMP_Partially_Paid_Students_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('✅ Partially Paid Students PDF saved!', 'success');
}

function saveFeeStatsToPDF() {
    if (!confirm('📄 Save Complete Fee Statistics Report as PDF? This will include all tables with detailed analytics.')) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    
    // Set default font to Times for better space utilization
    doc.setFont('times', 'normal');
    
    // Available width calculation: 297mm - 28mm margins = 269mm usable width
    
    // Helper function to add page header
    function addPageHeader(doc, title, pageNum) {
        doc.setFontSize(10);
        doc.setFont('times', 'bold');
        doc.text('SMP Fee Collection Statistics Report - 2025-26', 148, 15, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('times', 'normal');
        const currentDate = new Date().toLocaleDateString();
        doc.text(`Generated on: ${currentDate}`, 148, 22, { align: 'center' });
        
        if (title) {
            doc.setFontSize(9);
            doc.setFont('times', 'bold');
            doc.text(title, 148, 30, { align: 'center' });
        }
        
        // Page number
        doc.setFontSize(7);
        doc.setFont('times', 'normal');
        doc.text(`Page ${pageNum}`, 280, 200, { align: 'right' });
        
        return 35;
    }
    
    // Helper function to format currency for PDF
    function formatCurrency(amount) {
        return '₹' + amount.toLocaleString('en-IN');
    }
    
    // Helper function to check if new page is needed with improved spacing
    function checkPageSpace(doc, currentY, requiredSpace = 60) {
        if (currentY > 190 - requiredSpace) {
            doc.addPage();
            return addPageHeader(doc, '', doc.internal.getNumberOfPages());
        }
        return currentY;
    }
    
    // Helper function to ensure table fits with subtotals on same page
    function checkTablePageSpace(doc, currentY, estimatedTableHeight = 80) {
        if (currentY > 190 - estimatedTableHeight) {
            doc.addPage();
            return addPageHeader(doc, '', doc.internal.getNumberOfPages());
        }
        return currentY;
    }
    
    let pageNum = 1;
    let currentY = addPageHeader(doc, 'Complete Fee Analytics Report', pageNum);
    
    // =====================================
    // 1. FEE COLLECTION SUMMARY TABLE
    // =====================================
    currentY = checkTablePageSpace(doc, currentY, 100);
    
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('1. Fee Collection Summary', 14, currentY);
    currentY += 8;
    
    const totalStats = calculateFeeStats(filteredFeeStatsData);
    const summaryData = [
        {
            category: 'All Students',
            students: filteredFeeStatsData.length,
            ...totalStats
        },
        {
            category: 'Fully Paid',
            students: filteredFeeStatsData.filter(s => s['Total Dues'] === 0).length,
            ...calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] === 0))
        },
        {
            category: 'Partially Paid',
            students: filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0).length,
            ...calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0))
        },
        {
            category: 'Dues Pending',
            students: filteredFeeStatsData.filter(s => s['Total Dues'] > 0).length,
            ...calculateFeeStats(filteredFeeStatsData.filter(s => s['Total Dues'] > 0))
        }
    ].map(data => {
        const collectionPercentage = data.totalAlloted > 0 ? ((data.totalPaid / data.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        return [
            data.category, data.students.toString(),
            formatCurrency(data.smpAlloted), formatCurrency(data.svkAlloted), formatCurrency(data.totalAlloted),
            formatCurrency(data.smpPaid), formatCurrency(data.svkPaid), formatCurrency(data.totalPaid),
            formatCurrency(data.smpDue), formatCurrency(data.svkDue), formatCurrency(data.totalDue),
            collectionPercentage
        ];
    });
    
    doc.autoTable({
        head: [['Category', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: summaryData,
        startY: currentY,
        styles: { 
            fontSize: 8, 
            cellPadding: 2,
            halign: 'center',
            minCellHeight: 8,
            font: 'times',
            textColor: [0, 0, 0]
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold',
            fontSize: 8,
            minCellHeight: 9
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 28 },     // Category
            1: { halign: 'center', cellWidth: 22 },   // Students
            2: { halign: 'center', cellWidth: 26 },   // SMP Allotted
            3: { halign: 'center', cellWidth: 26 },   // SVK Allotted  
            4: { halign: 'center', cellWidth: 28 },   // Total Allotted
            5: { halign: 'center', cellWidth: 26 },   // SMP Paid
            6: { halign: 'center', cellWidth: 26 },   // SVK Paid
            7: { halign: 'center', cellWidth: 28 },   // Total Paid
            8: { halign: 'center', cellWidth: 26 },   // SMP Due
            9: { halign: 'center', cellWidth: 26 },   // SVK Due
            10: { halign: 'center', cellWidth: 28 },  // Total Due
            11: { halign: 'center', cellWidth: 24 }   // Collection %
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 10, right: 10 }
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
    
    // =====================================
    // 2. YEAR-WISE FEE STATISTICS  
    // =====================================
    currentY = checkTablePageSpace(doc, currentY, 90);
    
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('2. Year-wise Fee Collection Statistics', 14, currentY);
    currentY += 8;
    
    const yearGroups = groupDataBy(filteredFeeStatsData, 'Year');
    const yearData = [];
    
    Object.keys(yearGroups).sort().forEach(year => {
        const yearStudents = yearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        yearData.push([
            year, yearStudents.length.toString(),
            formatCurrency(stats.smpAlloted), formatCurrency(stats.svkAlloted), formatCurrency(stats.totalAlloted),
            formatCurrency(stats.smpPaid), formatCurrency(stats.svkPaid), formatCurrency(stats.totalPaid),
            formatCurrency(stats.smpDue), formatCurrency(stats.svkDue), formatCurrency(stats.totalDue),
            collectionPercentage
        ]);
    });
    
    // Add year-wise total row
    if (Object.keys(yearGroups).length > 1) {
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        yearData.push([
            'TOTAL', filteredFeeStatsData.length.toString(),
            formatCurrency(totalStats.smpAlloted), formatCurrency(totalStats.svkAlloted), formatCurrency(totalStats.totalAlloted),
            formatCurrency(totalStats.smpPaid), formatCurrency(totalStats.svkPaid), formatCurrency(totalStats.totalPaid),
            formatCurrency(totalStats.smpDue), formatCurrency(totalStats.svkDue), formatCurrency(totalStats.totalDue),
            totalCollectionPercentage
        ]);
    }
    
    doc.autoTable({
        head: [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: yearData,
        startY: currentY,
        styles: { 
            fontSize: 8, 
            cellPadding: 2,
            halign: 'center',
            minCellHeight: 8,
            font: 'times',
            textColor: [0, 0, 0]
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold',
            fontSize: 8,
            minCellHeight: 9
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 28 },     // Year
            1: { halign: 'center', cellWidth: 22 },   // Students
            2: { halign: 'center', cellWidth: 26 },   // SMP Allotted
            3: { halign: 'center', cellWidth: 26 },   // SVK Allotted  
            4: { halign: 'center', cellWidth: 28 },   // Total Allotted
            5: { halign: 'center', cellWidth: 26 },   // SMP Paid
            6: { halign: 'center', cellWidth: 26 },   // SVK Paid
            7: { halign: 'center', cellWidth: 28 },   // Total Paid
            8: { halign: 'center', cellWidth: 26 },   // SMP Due
            9: { halign: 'center', cellWidth: 26 },   // SVK Due
            10: { halign: 'center', cellWidth: 28 },  // Total Due
            11: { halign: 'center', cellWidth: 24 }   // Collection %
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            // Highlight total row
            if (data.row.index === yearData.length - 1 && yearData.length > 1) {
                data.cell.styles.fillColor = [41, 128, 185];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 9;
                data.cell.styles.fontSize = 9;
            }
        },
        margin: { left: 10, right: 10 }
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
    
    // =====================================
    // 3. COURSE-WISE FEE STATISTICS
    // =====================================
    currentY = checkTablePageSpace(doc, currentY, 90);
    
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('3. Course-wise Fee Collection Statistics', 14, currentY);
    currentY += 8;
    
    const courseGroups = groupDataBy(filteredFeeStatsData, 'Course');
    const courseData = [];
    
    Object.keys(courseGroups).sort().forEach(course => {
        const courseStudents = courseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        courseData.push([
            course, courseStudents.length.toString(),
            formatCurrency(stats.smpAlloted), formatCurrency(stats.svkAlloted), formatCurrency(stats.totalAlloted),
            formatCurrency(stats.smpPaid), formatCurrency(stats.svkPaid), formatCurrency(stats.totalPaid),
            formatCurrency(stats.smpDue), formatCurrency(stats.svkDue), formatCurrency(stats.totalDue),
            collectionPercentage
        ]);
    });
    
    // Add course-wise total row
    if (Object.keys(courseGroups).length > 1) {
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        courseData.push([
            'TOTAL', filteredFeeStatsData.length.toString(),
            formatCurrency(totalStats.smpAlloted), formatCurrency(totalStats.svkAlloted), formatCurrency(totalStats.totalAlloted),
            formatCurrency(totalStats.smpPaid), formatCurrency(totalStats.svkPaid), formatCurrency(totalStats.totalPaid),
            formatCurrency(totalStats.smpDue), formatCurrency(totalStats.svkDue), formatCurrency(totalStats.totalDue),
            totalCollectionPercentage
        ]);
    }
    
    doc.autoTable({
        head: [['Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: courseData,
        startY: currentY,
        styles: { 
            fontSize: 8, 
            cellPadding: 2,
            halign: 'center',
            minCellHeight: 8,
            font: 'times',
            textColor: [0, 0, 0]
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold',
            fontSize: 8,
            minCellHeight: 9
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 28 },     // Course
            1: { halign: 'center', cellWidth: 22 },   // Students
            2: { halign: 'center', cellWidth: 26 },   // SMP Allotted
            3: { halign: 'center', cellWidth: 26 },   // SVK Allotted  
            4: { halign: 'center', cellWidth: 28 },   // Total Allotted
            5: { halign: 'center', cellWidth: 26 },   // SMP Paid
            6: { halign: 'center', cellWidth: 26 },   // SVK Paid
            7: { halign: 'center', cellWidth: 28 },   // Total Paid
            8: { halign: 'center', cellWidth: 26 },   // SMP Due
            9: { halign: 'center', cellWidth: 26 },   // SVK Due
            10: { halign: 'center', cellWidth: 28 },  // Total Due
            11: { halign: 'center', cellWidth: 24 }   // Collection %
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            // Highlight total row
            if (data.row.index === courseData.length - 1 && courseData.length > 1) {
                data.cell.styles.fillColor = [41, 128, 185];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 9;
            }
        },
        margin: { left: 10, right: 10 }
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
    
    // =====================================
    // 4. COMBINED YEAR & COURSE-WISE STATISTICS
    // =====================================
    currentY = checkTablePageSpace(doc, currentY, 120); // Larger space for complex table
    
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('4. Combined Year & Course-wise Fee Statistics', 14, currentY);
    currentY += 8;
    
    const combinedGroups = {};
    filteredFeeStatsData.forEach(student => {
        const key = `${student['Year']}-${student['Course']}`;
        if (!combinedGroups[key]) {
            combinedGroups[key] = [];
        }
        combinedGroups[key].push(student);
    });
    
    const combinedData = [];
    const yearSubtotals = {};
    
    Object.keys(combinedGroups).sort().forEach(key => {
        const [year, course] = key.split('-');
        const students = combinedGroups[key];
        const stats = calculateFeeStats(students);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        
        if (!yearSubtotals[year]) {
            yearSubtotals[year] = [];
        }
        yearSubtotals[year].push({
            year, course, students: students.length, ...stats, collectionPercentage
        });
    });
    
    Object.keys(yearSubtotals).sort().forEach(year => {
        const yearData = yearSubtotals[year];
        
        yearData.forEach(data => {
            combinedData.push([
                data.year, data.course, data.students.toString(),
                formatCurrency(data.smpAlloted), formatCurrency(data.svkAlloted), formatCurrency(data.totalAlloted),
                formatCurrency(data.smpPaid), formatCurrency(data.svkPaid), formatCurrency(data.totalPaid),
                formatCurrency(data.smpDue), formatCurrency(data.svkDue), formatCurrency(data.totalDue),
                data.collectionPercentage
            ]);
        });
        
        // Add year subtotal if there are multiple courses
        if (yearData.length > 1) {
            const yearTotalStats = calculateFeeStats(filteredFeeStatsData.filter(s => s['Year'] === year));
            const yearCollectionPercentage = yearTotalStats.totalAlloted > 0 ? ((yearTotalStats.totalPaid / yearTotalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
            combinedData.push([
                `${year} SUBTOTAL`, 'All Courses', filteredFeeStatsData.filter(s => s['Year'] === year).length.toString(),
                formatCurrency(yearTotalStats.smpAlloted), formatCurrency(yearTotalStats.svkAlloted), formatCurrency(yearTotalStats.totalAlloted),
                formatCurrency(yearTotalStats.smpPaid), formatCurrency(yearTotalStats.svkPaid), formatCurrency(yearTotalStats.totalPaid),
                formatCurrency(yearTotalStats.smpDue), formatCurrency(yearTotalStats.svkDue), formatCurrency(yearTotalStats.totalDue),
                yearCollectionPercentage
            ]);
        }
    });
    
    // Add grand total
    if (Object.keys(combinedGroups).length > 1) {
        const totalCollectionPercentage = totalStats.totalAlloted > 0 ? ((totalStats.totalPaid / totalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        combinedData.push([
            'GRAND TOTAL', 'All Years & Courses', filteredFeeStatsData.length.toString(),
            formatCurrency(totalStats.smpAlloted), formatCurrency(totalStats.svkAlloted), formatCurrency(totalStats.totalAlloted),
            formatCurrency(totalStats.smpPaid), formatCurrency(totalStats.svkPaid), formatCurrency(totalStats.totalPaid),
            formatCurrency(totalStats.smpDue), formatCurrency(totalStats.svkDue), formatCurrency(totalStats.totalDue),
            totalCollectionPercentage
        ]);
    }
    
    doc.autoTable({
        head: [['Year', 'Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: combinedData,
        startY: currentY,
        styles: { 
            fontSize: 7, 
            cellPadding: 1.5,
            halign: 'center',
            minCellHeight: 7,
            font: 'times',
            textColor: [0, 0, 0]
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold',
            fontSize: 7,
            minCellHeight: 8
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 22 },     // Year
            1: { halign: 'center', cellWidth: 20 },   // Course
            2: { halign: 'center', cellWidth: 18 },   // Students
            3: { halign: 'center', cellWidth: 22 },   // SMP Allotted
            4: { halign: 'center', cellWidth: 22 },   // SVK Allotted
            5: { halign: 'center', cellWidth: 24 },   // Total Allotted
            6: { halign: 'center', cellWidth: 22 },   // SMP Paid
            7: { halign: 'center', cellWidth: 22 },   // SVK Paid
            8: { halign: 'center', cellWidth: 24 },   // Total Paid
            9: { halign: 'center', cellWidth: 22 },   // SMP Due
            10: { halign: 'center', cellWidth: 22 },  // SVK Due
            11: { halign: 'center', cellWidth: 24 },  // Total Due
            12: { halign: 'center', cellWidth: 20 }   // Collection %
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            // Highlight subtotal and grand total rows
            const cellText = data.cell.text[0];
            if (cellText && (cellText.includes('SUBTOTAL') || cellText.includes('GRAND TOTAL'))) {
                if (cellText.includes('GRAND TOTAL')) {
                    data.cell.styles.fillColor = [41, 128, 185];
                    data.cell.styles.textColor = [255, 255, 255];
                } else {
                    data.cell.styles.fillColor = [100, 150, 200];
                    data.cell.styles.textColor = [255, 255, 255];
                }
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 9;
            }
        },
        margin: { left: 8, right: 8 }
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
    
    // =====================================
    // 5. FULLY PAID STUDENTS STATISTICS
    // =====================================
    doc.addPage();
    pageNum++;
    currentY = addPageHeader(doc, 'Fully Paid Students Analysis', pageNum);
    
    const fullyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] === 0);
    
    // Year-wise Fully Paid
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('5A. Year-wise Fully Paid Students', 14, currentY);
    currentY += 8;
    
    const fullyPaidYearGroups = groupDataBy(fullyPaidStudents, 'Year');
    const fullyPaidYearData = [];
    
    Object.keys(fullyPaidYearGroups).sort().forEach(year => {
        const yearStudents = fullyPaidYearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        fullyPaidYearData.push([
            year, yearStudents.length.toString(),
            formatCurrency(stats.smpAlloted), formatCurrency(stats.svkAlloted), formatCurrency(stats.totalAlloted),
            formatCurrency(stats.smpPaid), formatCurrency(stats.svkPaid), formatCurrency(stats.totalPaid),
            '100.0%'
        ]);
    });
    
    // Add total row for fully paid
    if (Object.keys(fullyPaidYearGroups).length > 1) {
        const fullyPaidTotalStats = calculateFeeStats(fullyPaidStudents);
        fullyPaidYearData.push([
            'TOTAL', fullyPaidStudents.length.toString(),
            formatCurrency(fullyPaidTotalStats.smpAlloted), formatCurrency(fullyPaidTotalStats.svkAlloted), formatCurrency(fullyPaidTotalStats.totalAlloted),
            formatCurrency(fullyPaidTotalStats.smpPaid), formatCurrency(fullyPaidTotalStats.svkPaid), formatCurrency(fullyPaidTotalStats.totalPaid),
            '100.0%'
        ]);
    }
    
    doc.autoTable({
        head: [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'Collection %']],
        body: fullyPaidYearData,
        startY: currentY,
        styles: { 
            fontSize: 6, 
            cellPadding: 1.5,
            halign: 'center',
            minCellHeight: 6,
            font: 'times'
        },
        headStyles: { 
            fillColor: [76, 175, 80], 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 6,
            minCellHeight: 7
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 30 },     // Year
            1: { halign: 'center', cellWidth: 24 },   // Students
            2: { halign: 'center', cellWidth: 32 },   // SMP Allotted
            3: { halign: 'center', cellWidth: 32 },   // SVK Allotted
            4: { halign: 'center', cellWidth: 36 },   // Total Allotted
            5: { halign: 'center', cellWidth: 32 },   // SMP Paid
            6: { halign: 'center', cellWidth: 32 },   // SVK Paid
            7: { halign: 'center', cellWidth: 36 },   // Total Paid
            8: { halign: 'center', cellWidth: 28 }    // Collection %
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            if (data.row.index === fullyPaidYearData.length - 1 && fullyPaidYearData.length > 1) {
                data.cell.styles.fillColor = [76, 175, 80];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 9;
            }
        },
        margin: { left: 8, right: 8 }
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
    
    // Course-wise Fully Paid
    currentY = checkTablePageSpace(doc, currentY, 90);
    
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('5B. Course-wise Fully Paid Students', 14, currentY);
    currentY += 8;
    
    const fullyPaidCourseGroups = groupDataBy(fullyPaidStudents, 'Course');
    const fullyPaidCourseData = [];
    
    Object.keys(fullyPaidCourseGroups).sort().forEach(course => {
        const courseStudents = fullyPaidCourseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        fullyPaidCourseData.push([
            course, courseStudents.length.toString(),
            formatCurrency(stats.smpAlloted), formatCurrency(stats.svkAlloted), formatCurrency(stats.totalAlloted),
            formatCurrency(stats.smpPaid), formatCurrency(stats.svkPaid), formatCurrency(stats.totalPaid),
            '100.0%'
        ]);
    });
    
    // Add total row for fully paid courses
    if (Object.keys(fullyPaidCourseGroups).length > 1) {
        const fullyPaidTotalStats = calculateFeeStats(fullyPaidStudents);
        fullyPaidCourseData.push([
            'TOTAL', fullyPaidStudents.length.toString(),
            formatCurrency(fullyPaidTotalStats.smpAlloted), formatCurrency(fullyPaidTotalStats.svkAlloted), formatCurrency(fullyPaidTotalStats.totalAlloted),
            formatCurrency(fullyPaidTotalStats.smpPaid), formatCurrency(fullyPaidTotalStats.svkPaid), formatCurrency(fullyPaidTotalStats.totalPaid),
            '100.0%'
        ]);
    }
    
    doc.autoTable({
        head: [['Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'Collection %']],
        body: fullyPaidCourseData,
        startY: currentY,
        styles: { 
            fontSize: 6, 
            cellPadding: 1.5,
            halign: 'center',
            minCellHeight: 6,
            font: 'times'
        },
        headStyles: { 
            fillColor: [76, 175, 80], 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 6,
            minCellHeight: 7
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 26 },     // Course
            1: { halign: 'center', cellWidth: 20 },   // Students
            2: { halign: 'center', cellWidth: 26 },   // SMP Allotted
            3: { halign: 'center', cellWidth: 26 },   // SVK Allotted
            4: { halign: 'center', cellWidth: 30 },   // Total Allotted
            5: { halign: 'center', cellWidth: 26 },   // SMP Paid
            6: { halign: 'center', cellWidth: 26 },   // SVK Paid
            7: { halign: 'center', cellWidth: 30 },   // Total Paid
            8: { halign: 'center', cellWidth: 22 }    // Collection %
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            if (data.row.index === fullyPaidCourseData.length - 1 && fullyPaidCourseData.length > 1) {
                data.cell.styles.fillColor = [76, 175, 80];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 9;
            }
        },
        margin: { left: 8, right: 8 }
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
    
    // =====================================
    // 6. PARTIALLY PAID STUDENTS STATISTICS
    // =====================================
    currentY = checkPageSpace(doc, currentY, 70);
    
    const partiallyPaidStudents = filteredFeeStatsData.filter(s => s['Total Dues'] > 0 && s['Total Paid'] > 0);
    
    // Year-wise Partially Paid
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('6A. Year-wise Partially Paid Students', 14, currentY);
    currentY += 8;
    
    const partiallyPaidYearGroups = groupDataBy(partiallyPaidStudents, 'Year');
    const partiallyPaidYearData = [];
    
    Object.keys(partiallyPaidYearGroups).sort().forEach(year => {
        const yearStudents = partiallyPaidYearGroups[year];
        const stats = calculateFeeStats(yearStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        partiallyPaidYearData.push([
            year, yearStudents.length.toString(),
            formatCurrency(stats.smpAlloted), formatCurrency(stats.svkAlloted), formatCurrency(stats.totalAlloted),
            formatCurrency(stats.smpPaid), formatCurrency(stats.svkPaid), formatCurrency(stats.totalPaid),
            formatCurrency(stats.smpDue), formatCurrency(stats.svkDue), formatCurrency(stats.totalDue),
            collectionPercentage
        ]);
    });
    
    // Add total row for partially paid
    if (Object.keys(partiallyPaidYearGroups).length > 1) {
        const partiallyPaidTotalStats = calculateFeeStats(partiallyPaidStudents);
        const totalCollectionPercentage = partiallyPaidTotalStats.totalAlloted > 0 ? ((partiallyPaidTotalStats.totalPaid / partiallyPaidTotalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        partiallyPaidYearData.push([
            'TOTAL', partiallyPaidStudents.length.toString(),
            formatCurrency(partiallyPaidTotalStats.smpAlloted), formatCurrency(partiallyPaidTotalStats.svkAlloted), formatCurrency(partiallyPaidTotalStats.totalAlloted),
            formatCurrency(partiallyPaidTotalStats.smpPaid), formatCurrency(partiallyPaidTotalStats.svkPaid), formatCurrency(partiallyPaidTotalStats.totalPaid),
            formatCurrency(partiallyPaidTotalStats.smpDue), formatCurrency(partiallyPaidTotalStats.svkDue), formatCurrency(partiallyPaidTotalStats.totalDue),
            totalCollectionPercentage
        ]);
    }
    
    doc.autoTable({
        head: [['Year', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: partiallyPaidYearData,
        startY: currentY,
        styles: { 
            fontSize: 6, 
            cellPadding: 1.5,
            halign: 'center',
            minCellHeight: 6,
            font: 'times'
        },
        headStyles: { 
            fillColor: [255, 152, 0], 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 6,
            minCellHeight: 7
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 22 },     // Year
            1: { halign: 'center', cellWidth: 22 },   // Students
            2: { halign: 'center', cellWidth: 20 },   // SMP Allotted
            3: { halign: 'center', cellWidth: 20 },   // SVK Allotted
            4: { halign: 'center', cellWidth: 22 },   // Total Allotted
            5: { halign: 'center', cellWidth: 20 },   // SMP Paid
            6: { halign: 'center', cellWidth: 20 },   // SVK Paid
            7: { halign: 'center', cellWidth: 22 },   // Total Paid
            8: { halign: 'center', cellWidth: 20 },   // SMP Due
            9: { halign: 'center', cellWidth: 20 },   // SVK Due
            10: { halign: 'center', cellWidth: 22 },  // Total Due
            11: { halign: 'center', cellWidth: 18 }   // Collection %
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            if (data.row.index === partiallyPaidYearData.length - 1 && partiallyPaidYearData.length > 1) {
                data.cell.styles.fillColor = [255, 152, 0];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 9;
            }
        },
        margin: { left: 8, right: 8 }
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
    
    // Course-wise Partially Paid  
    currentY = checkTablePageSpace(doc, currentY, 90);
    
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('6B. Course-wise Partially Paid Students', 14, currentY);
    currentY += 8;
    
    const partiallyPaidCourseGroups = groupDataBy(partiallyPaidStudents, 'Course');
    const partiallyPaidCourseData = [];
    
    Object.keys(partiallyPaidCourseGroups).sort().forEach(course => {
        const courseStudents = partiallyPaidCourseGroups[course];
        const stats = calculateFeeStats(courseStudents);
        const collectionPercentage = stats.totalAlloted > 0 ? ((stats.totalPaid / stats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        partiallyPaidCourseData.push([
            course, courseStudents.length.toString(),
            formatCurrency(stats.smpAlloted), formatCurrency(stats.svkAlloted), formatCurrency(stats.totalAlloted),
            formatCurrency(stats.smpPaid), formatCurrency(stats.svkPaid), formatCurrency(stats.totalPaid),
            formatCurrency(stats.smpDue), formatCurrency(stats.svkDue), formatCurrency(stats.totalDue),
            collectionPercentage
        ]);
    });
    
    // Add total row for partially paid courses
    if (Object.keys(partiallyPaidCourseGroups).length > 1) {
        const partiallyPaidTotalStats = calculateFeeStats(partiallyPaidStudents);
        const totalCollectionPercentage = partiallyPaidTotalStats.totalAlloted > 0 ? ((partiallyPaidTotalStats.totalPaid / partiallyPaidTotalStats.totalAlloted) * 100).toFixed(1) + '%' : '0.0%';
        partiallyPaidCourseData.push([
            'TOTAL', partiallyPaidStudents.length.toString(),
            formatCurrency(partiallyPaidTotalStats.smpAlloted), formatCurrency(partiallyPaidTotalStats.svkAlloted), formatCurrency(partiallyPaidTotalStats.totalAlloted),
            formatCurrency(partiallyPaidTotalStats.smpPaid), formatCurrency(partiallyPaidTotalStats.svkPaid), formatCurrency(partiallyPaidTotalStats.totalPaid),
            formatCurrency(partiallyPaidTotalStats.smpDue), formatCurrency(partiallyPaidTotalStats.svkDue), formatCurrency(partiallyPaidTotalStats.totalDue),
            totalCollectionPercentage
        ]);
    }
    
    doc.autoTable({
        head: [['Course', 'Students', 'SMP Allotted', 'SVK Allotted', 'Total Allotted', 'SMP Paid', 'SVK Paid', 'Total Paid', 'SMP Due', 'SVK Due', 'Total Due', 'Collection %']],
        body: partiallyPaidCourseData,
        startY: currentY,
        styles: { 
            fontSize: 6, 
            cellPadding: 1.5,
            halign: 'center',
            minCellHeight: 6,
            font: 'times'
        },
        headStyles: { 
            fillColor: [255, 152, 0], 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 6,
            minCellHeight: 7
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 22 },     // Course
            1: { halign: 'center', cellWidth: 22 },   // Students
            2: { halign: 'center', cellWidth: 20 },   // SMP Allotted
            3: { halign: 'center', cellWidth: 20 },   // SVK Allotted
            4: { halign: 'center', cellWidth: 22 },   // Total Allotted
            5: { halign: 'center', cellWidth: 20 },   // SMP Paid
            6: { halign: 'center', cellWidth: 20 },   // SVK Paid
            7: { halign: 'center', cellWidth: 22 },   // Total Paid
            8: { halign: 'center', cellWidth: 20 },   // SMP Due
            9: { halign: 'center', cellWidth: 20 },   // SVK Due
            10: { halign: 'center', cellWidth: 22 },  // Total Due
            11: { halign: 'center', cellWidth: 18 }   // Collection %
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function(data) {
            if (data.row.index === partiallyPaidCourseData.length - 1 && partiallyPaidCourseData.length > 1) {
                data.cell.styles.fillColor = [255, 152, 0];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 9;
            }
        },
        margin: { left: 8, right: 8 }
    });
    
    // Save the comprehensive PDF
    doc.save(`SMP_Complete_Fee_Statistics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Update the main showSection function to handle fee statistics
const originalShowSection = showSection;
showSection = function(sectionName, event) {
    // Call original function
    originalShowSection.call(this, sectionName, event);

    // Initialize fee statistics when section is shown
    if (sectionName === 'feestats') {
        setTimeout(() => {
            initializeFeeStats();
        }, 100);
    }

    // Initialize exam fee data when section is shown
    if (sectionName === 'examfee') {
        setTimeout(() => {
            initializeExamFeeData();
        }, 100);
    }

    // Initialize fee distribution data when section is shown
    if (sectionName === 'feedistribution') {
        setTimeout(() => {
            initializeFeeDistribution();
        }, 100);
    }
};

// Event listeners for Fee Statistics
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners after DOM is loaded
    setTimeout(() => {
        if (document.getElementById('feeStatsCourseFilter')) {
            document.getElementById('feeStatsCourseFilter').addEventListener('change', applyFeeStatsFilters);
            document.getElementById('feeStatsYearFilter').addEventListener('change', applyFeeStatsFilters);
            document.getElementById('feeStatsAdmTypeFilter').addEventListener('change', applyFeeStatsFilters);
            document.getElementById('feeStatsTableFilter').addEventListener('change', applyFeeStatsFilters);
        }
    }, 1000);
});

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

// ============================================================================
// EXAM FEE MANAGEMENT FUNCTIONS
// ============================================================================

// Load exam fee data from JSONHost.com
async function loadExamFeeData() {
    try {
        const response = await fetch(`https://jsonhost.com/json/${JSONHOST_EXAMFEE_JSON_ID}`, {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            examFeeStorage = data.examFeeData || {};
            console.log('✅ Exam fee data loaded from JSONHost.com');
        } else if (response.status === 404) {
            console.log('⚠️ No exam fee data found on server, starting fresh');
            examFeeStorage = {};
            // Create initial JSON structure on server
            await createInitialExamFeeData();
        } else {
            console.log('⚠️ No exam fee data found on server, starting fresh');
            examFeeStorage = {};
        }
    } catch (error) {
        console.log('⚠️ Using local exam fee storage (connection error):', error.message);
        // Try to load from localStorage as fallback
        const localData = localStorage.getItem('examFeeData');
        if (localData) {
            examFeeStorage = JSON.parse(localData);
        } else {
            examFeeStorage = {};
        }
    }
}

// Create initial exam fee data structure on JSONHost.com
async function createInitialExamFeeData() {
    try {
        const initialData = {
            examFeeData: {},
            lastUpdated: new Date().toISOString(),
            updatedBy: 'SMP Admin',
            createdAt: new Date().toISOString()
        };

        const response = await fetch(`https://jsonhost.com/json/${JSONHOST_EXAMFEE_JSON_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': JSONHOST_EXAMFEE_API_KEY
            },
            body: JSON.stringify(initialData)
        });

        if (response.ok) {
            console.log('✅ Initial exam fee data structure created on JSONHost.com');
        } else {
            console.log('⚠️ Could not create initial data structure, will use local storage');
        }
    } catch (error) {
        console.log('⚠️ Could not create initial data structure:', error.message);
    }
}

// Save exam fee data to JSONHost.com
async function saveExamFeeData() {
    try {
        const dataToSave = {
            examFeeData: examFeeStorage,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'SMP Admin'
        };

        const response = await fetch(`https://jsonhost.com/json/${JSONHOST_EXAMFEE_JSON_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': JSONHOST_EXAMFEE_API_KEY
            },
            body: JSON.stringify(dataToSave)
        });

        if (response.ok) {
            console.log('✅ Exam fee data saved to JSONHost.com');
            // Also save to localStorage as backup
            localStorage.setItem('examFeeData', JSON.stringify(examFeeStorage));
            return true;
        } else {
            console.error('❌ Failed to save exam fee data to server. Status:', response.status);
            // Save to localStorage as fallback
            localStorage.setItem('examFeeData', JSON.stringify(examFeeStorage));
            return false;
        }
    } catch (error) {
        console.error('❌ Error saving exam fee data:', error);
        // Save to localStorage as fallback
        localStorage.setItem('examFeeData', JSON.stringify(examFeeStorage));
        return false;
    }
}

// Initialize exam fee data
async function initializeExamFeeData() {
    await loadExamFeeData();
    processExamFeeData();
    populateExamFeeTable();
    populateExamFeeFilters();
}

// Process exam fee data by combining student data with exam fee records
function processExamFeeData() {
    // Use studentsData exactly as Students List does - no deduplication, no filtering
    // This ensures exact same count (779) as Students List section
    examFeeData = studentsData.map(student => {
        const regNo = student['Reg No'] || '';
        const examFeeRecord = examFeeStorage[regNo] || {};
        
        return {
            ...student,
            examFeePaid: examFeeRecord.paid || false,
            examFeeAmount: examFeeRecord.amount || '',
            examFeeDate: examFeeRecord.date || '',
            examFeeRemarks: examFeeRecord.remarks || ''
        };
    });
    
    filteredExamFeeData = [...examFeeData];
    
    // Generate summary after processing data
    generateExamFeeSummary();
}

// Generate exam fee summary
function generateExamFeeSummary() {
    const summaryContainer = document.getElementById('examFeeSummary');
    if (!summaryContainer) return;
    
    // Calculate course-wise and year-wise statistics
    const courseStats = {};
    const courses = ['CE', 'ME', 'EC', 'CS', 'EE'];
    const years = ['1st Yr', '2nd Yr', '3rd Yr'];
    
    // Initialize course stats with year-wise breakdown
    courses.forEach(course => {
        courseStats[course] = {
            total: 0,
            paid: 0,
            amount: 0,
            yearwise: {}
        };
        
        years.forEach(year => {
            courseStats[course].yearwise[year] = {
                total: 0,
                paid: 0
            };
        });
    });
    
    // Calculate stats from examFeeData
    examFeeData.forEach(student => {
        const course = student.Course;
        const year = student.Year;
        
        if (courses.includes(course)) {
            courseStats[course].total++;
            if (student.examFeePaid) {
                courseStats[course].paid++;
                courseStats[course].amount += parseFloat(student.examFeeAmount) || 0;
            }
            
            // Year-wise breakdown
            if (years.includes(year)) {
                courseStats[course].yearwise[year].total++;
                if (student.examFeePaid) {
                    courseStats[course].yearwise[year].paid++;
                }
            }
        }
    });
    
    // Calculate totals
    let grandTotal = 0, grandPaid = 0, grandAmount = 0;
    courses.forEach(course => {
        grandTotal += courseStats[course].total;
        grandPaid += courseStats[course].paid;
        grandAmount += courseStats[course].amount;
    });
    
    // Format currency
    const formatCurrency = (amount) => {
        return '₹' + amount.toLocaleString('en-IN', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
    };
    
    // Generate HTML
    let summaryHTML = `
        <h3>📊 Exam Fee Collection Summary</h3>
        <div class="summary-grid">
    `;
    
    courses.forEach(course => {
        const stats = courseStats[course];
        const percentage = stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : '0.0';
        
        // Generate compact year-wise statistics
        let yearwiseText = '';
        years.forEach((year, index) => {
            const yearStats = stats.yearwise[year];
            if (yearStats.total > 0) {
                const yearShort = year.replace(' Yr', '');
                yearwiseText += `${yearShort}: ${yearStats.paid}/${yearStats.total}`;
                if (index < years.length - 1 && stats.yearwise[years[index + 1]].total > 0) {
                    yearwiseText += ', ';
                }
            }
        });
        
        summaryHTML += `
            <div class="summary-course ${course.toLowerCase()}">
                <div class="summary-course-title">${course} - ${course === 'CE' ? 'Civil Engineering' : 
                    course === 'ME' ? 'Mechanical Engineering' : 
                    course === 'EC' ? 'Electronics & Communication' : 
                    course === 'CS' ? 'Computer Science' : 
                    'Electrical Engineering'}</div>
                <div class="summary-stats">
                    Total Students: <span class="summary-total">${stats.total}</span><br>
                    Fee Paid: <span class="summary-paid">${stats.paid}</span> (${percentage}%)<br>
                    Yearwise: ${yearwiseText}<br>
                    Amount Collected: <span class="summary-amount">${formatCurrency(stats.amount)}</span>
                </div>
            </div>
        `;
    });
    
    // Calculate overall year-wise statistics
    const overallYearwise = {};
    years.forEach(year => {
        overallYearwise[year] = { total: 0, paid: 0 };
        courses.forEach(course => {
            overallYearwise[year].total += courseStats[course].yearwise[year].total;
            overallYearwise[year].paid += courseStats[course].yearwise[year].paid;
        });
    });
    
    // Generate overall year-wise text
    let overallYearwiseText = '';
    years.forEach((year, index) => {
        const yearStats = overallYearwise[year];
        if (yearStats.total > 0) {
            const yearShort = year.replace(' Yr', '');
            overallYearwiseText += `${yearShort}: ${yearStats.paid}/${yearStats.total}`;
            if (index < years.length - 1 && overallYearwise[years[index + 1]].total > 0) {
                overallYearwiseText += ', ';
            }
        }
    });
    
    // Add grand total as a regular box
    const grandPercentage = grandTotal > 0 ? ((grandPaid / grandTotal) * 100).toFixed(1) : '0.0';
    summaryHTML += `
            <div class="summary-total-box">
                <div class="summary-course-title">🏆 Overall Summary</div>
                <div class="summary-stats">
                    Total Students: <span class="summary-total">${grandTotal}</span><br>
                    Fee Paid: <span class="summary-paid">${grandPaid}</span> (${grandPercentage}%)<br>
                    Yearwise: ${overallYearwiseText}<br>
                    Amount Collected: <span class="summary-amount">${formatCurrency(grandAmount)}</span>
                </div>
            </div>
        </div>
    `;
    
    summaryContainer.innerHTML = summaryHTML;
}

// Populate exam fee filters
function populateExamFeeFilters() {
    const courseFilter = document.getElementById('examFeeCourseFilter');
    const yearFilter = document.getElementById('examFeeYearFilter');
    const admTypeFilter = document.getElementById('examFeeAdmTypeFilter');

    if (!courseFilter || !yearFilter || !admTypeFilter) return;

    // Get unique values
    const courses = [...new Set(examFeeData.map(s => s.Course).filter(Boolean))].sort();
    const years = [...new Set(examFeeData.map(s => s.Year).filter(Boolean))].sort();
    const admTypes = [...new Set(examFeeData.map(s => s['Adm Type']).filter(Boolean))].sort();

    // Clear and populate course filter
    courseFilter.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseFilter.appendChild(option);
    });

    // Clear and populate year filter
    yearFilter.innerHTML = '<option value="">All Years</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    // Clear and populate admission type filter
    admTypeFilter.innerHTML = '<option value="">All Types</option>';
    admTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        admTypeFilter.appendChild(option);
    });
}

// Apply exam fee filters
function applyExamFeeFilters() {
    const courseFilter = document.getElementById('examFeeCourseFilter').value;
    const yearFilter = document.getElementById('examFeeYearFilter').value;
    const admTypeFilter = document.getElementById('examFeeAdmTypeFilter').value;
    const statusFilter = document.getElementById('examFeeStatusFilter').value;
    const nameFilter = document.getElementById('examFeeNameFilter').value.toLowerCase();

    filteredExamFeeData = examFeeData.filter(student => {
        const matchCourse = !courseFilter || student.Course === courseFilter;
        const matchYear = !yearFilter || student.Year === yearFilter;
        
        // Mixed admission type filtering logic (same as Students List)
        let matchAdmType = true;
        if (admTypeFilter) {
            if (admTypeFilter === 'SNQ') {
                // For SNQ, check 'Adm Cat' column
                const admCat = student['Adm Cat'] || '';
                matchAdmType = admCat.trim() === 'SNQ';
            } else {
                // For Regular, LTRL, RPTR - check 'Adm Type' column
                const admTypeCol = student['Adm Type'] || '';
                if (admTypeFilter === 'REGULAR') {
                    // Regular includes all values that are not LTRL, RPTR, or SNQ
                    const admCat = student['Adm Cat'] || '';
                    matchAdmType = (admCat.trim() !== 'SNQ') && 
                                   (admTypeCol !== 'LTRL') && 
                                   (admTypeCol !== 'RPTR');
                } else {
                    // For LTRL and RPTR, exact match from Adm Type column
                    matchAdmType = admTypeCol === admTypeFilter;
                }
            }
        }
        
        const matchName = !nameFilter || 
            (student['Student Name'] && student['Student Name'].toLowerCase().includes(nameFilter)) ||
            (student['Father Name'] && student['Father Name'].toLowerCase().includes(nameFilter)) ||
            (student['Reg No'] && student['Reg No'].toString().toLowerCase().includes(nameFilter));
        
        let matchStatus = true;
        if (statusFilter === 'paid') {
            matchStatus = student.examFeePaid === true;
        } else if (statusFilter === 'notpaid') {
            matchStatus = student.examFeePaid !== true;
        }

        return matchCourse && matchYear && matchAdmType && matchName && matchStatus;
    });

    populateExamFeeTable();
    generateExamFeeSummary(); // Update summary when filters change
}

// Clear exam fee filters
function clearExamFeeFilters() {
    document.getElementById('examFeeCourseFilter').value = '';
    document.getElementById('examFeeYearFilter').value = '';
    document.getElementById('examFeeAdmTypeFilter').value = '';
    document.getElementById('examFeeStatusFilter').value = '';
    document.getElementById('examFeeNameFilter').value = '';
    applyExamFeeFilters();
}

// Populate exam fee table
function populateExamFeeTable() {
    const tbody = document.querySelector('#examFeeTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    filteredExamFeeData.forEach((student, index) => {
        const row = document.createElement('tr');
        row.classList.add('student-row');
        
        // Determine displayed admission type using mixed logic (same as Students List)
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
        
        // Add course and admission type classes for styling
        if (student.Course) {
            row.classList.add(getCourseColorClass(student.Course));
        }
        if (displayedAdmType) {
            row.classList.add(getAdmissionTypeClass(displayedAdmType));
        }
        
        // Add visual styling for paid exam fee rows
        if (student.examFeePaid) {
            row.classList.add('exam-fee-paid-row');
        }

        const examFeeStatus = student.examFeePaid ? '✅ Paid' : '❌ Not Paid';
        const examFeeAmount = student.examFeeAmount ? `₹${student.examFeeAmount}` : '-';

        row.innerHTML = `
            <td><input type="checkbox" class="student-checkbox" data-index="${index}"></td>
            <td>${index + 1}</td>
            <td class="student-name-cell" data-reg-no="${student['Reg No'] || ''}">${student['Student Name'] || ''}</td>
            <td>${student['Father Name'] || ''}</td>
            <td>${student.Year || ''}</td>
            <td class="course-cell">${student.Course || ''}</td>
            <td>${student['Reg No'] || ''}</td>
            <td class="admtype-cell">${displayedAdmType}</td>
            <td>${student['Adm Cat'] || ''}</td>
            <td class="status-cell">${student['In/Out'] || student['Status'] || ''}</td>
            <td class="exam-fee-status">${examFeeStatus}</td>
            <td class="exam-fee-amount">${examFeeAmount}</td>
        `;

        // Add right-click context menu to student name cell
        const nameCell = row.querySelector('.student-name-cell');
        nameCell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showExamFeeContextMenu(e, student);
        });

        tbody.appendChild(row);
    });

    // Add event listeners for checkboxes
    addExamFeeCheckboxListeners();
}

// Show exam fee context menu
function showExamFeeContextMenu(event, student) {
    event.preventDefault();
    selectedExamFeeStudent = student;
    
    const contextMenu = document.getElementById('examFeeContextMenu');
    const statusDiv = document.getElementById('contextMenuStatus');
    
    // Update status information
    if (student.examFeePaid) {
        const amount = student.examFeeAmount ? `₹${student.examFeeAmount}` : 'Amount not set';
        
        statusDiv.innerHTML = `
            <div class="status-label">✅ Exam Fee Paid</div>
            <div>Amount: <span class="status-amount">${amount}</span></div>
        `;
        statusDiv.className = 'context-menu-status paid';
        statusDiv.style.display = 'block';
    } else {
        statusDiv.innerHTML = `
            <div class="status-label">❌ Exam Fee Not Paid</div>
            <div>Click below to manage exam fee details</div>
        `;
        statusDiv.className = 'context-menu-status';
        statusDiv.style.display = 'block';
    }
    
    contextMenu.style.display = 'block';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    
    // Close menu when clicking elsewhere
    document.addEventListener('click', hideExamFeeContextMenu);
}

// Hide exam fee context menu
function hideExamFeeContextMenu() {
    const contextMenu = document.getElementById('examFeeContextMenu');
    contextMenu.style.display = 'none';
    document.removeEventListener('click', hideExamFeeContextMenu);
}

// Mark exam fee as paid
// Open unified exam fee dialog
function openExamFeeDialog() {
    if (!selectedExamFeeStudent) return;
    
    const dialog = document.getElementById('examFeeDialog');
    const paidCheckbox = document.getElementById('examFeePaidCheckbox');
    const amountInput = document.getElementById('examFeeAmount');
    
    if (!dialog || !paidCheckbox || !amountInput) {
        console.error('Dialog elements not found');
        alert('Error: Dialog not found. Please refresh the page.');
        return;
    }
    
    // Get current data for this student
    const regNo = selectedExamFeeStudent['Reg No'];
    const currentData = examFeeStorage[regNo] || {};
    
    // Pre-fill the form with current values (defaults: checked=true, amount=0)
    paidCheckbox.checked = currentData.paid !== undefined ? currentData.paid : true;
    amountInput.value = currentData.amount !== undefined ? currentData.amount : 0;
    
    // Show the dialog - CSS handles the centering
    dialog.style.display = 'block';
    
    // Always focus on the amount input field
    setTimeout(() => {
        amountInput.focus();
        amountInput.select();
    }, 100);
    
    // Add Enter key handler for the dialog
    examFeeDialogKeyHandler = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveExamFeeDetails();
        }
    };
    
    dialog.addEventListener('keydown', examFeeDialogKeyHandler);
    
    hideExamFeeContextMenu();
}

// Old function removed - replaced by openExamFeeDialog()

// Old functions removed - replaced by simplified unified approach

// Delete exam fee data
function deleteExamFeeData() {
    if (!selectedExamFeeStudent) return;
    
    const regNo = selectedExamFeeStudent['Reg No'];
    const studentName = selectedExamFeeStudent['Student Name'];
    
    if (confirm(`Are you sure you want to delete exam fee data for ${studentName}?`)) {
        delete examFeeStorage[regNo];
        saveExamFeeData();
        processExamFeeData();
        applyExamFeeFilters(); // Reapply filters instead of direct populate
    }
    
    hideExamFeeContextMenu();
}

// Save exam fee amount from dialog
// Save exam fee details (unified function)
function saveExamFeeDetails() {
    if (!selectedExamFeeStudent) return;
    
    const paidCheckbox = document.getElementById('examFeePaidCheckbox');
    const amountInput = document.getElementById('examFeeAmount');
    
    const regNo = selectedExamFeeStudent['Reg No'];
    const studentName = selectedExamFeeStudent['Student Name'];
    
    // Initialize storage if not exists
    if (!examFeeStorage[regNo]) {
        examFeeStorage[regNo] = {};
    }
    
    // Get values
    const isPaid = paidCheckbox.checked;
    const amount = parseFloat(amountInput.value) || 0;
    
    // Save the data
    examFeeStorage[regNo].paid = isPaid;
    if (amount > 0) {
        examFeeStorage[regNo].amount = amount;
    } else if (!isPaid) {
        // If not paid and no amount, clear amount
        delete examFeeStorage[regNo].amount;
    }
    
    if (isPaid) {
        examFeeStorage[regNo].date = new Date().toISOString().split('T')[0];
    } else {
        delete examFeeStorage[regNo].date;
    }
    
    // Update storage and UI
    saveExamFeeData();
    processExamFeeData();
    applyExamFeeFilters();
    closeExamFeeDialog();
    
    console.log(`✅ ${studentName} exam fee updated: Paid=${isPaid}, Amount=${amount}`);
}

// Close exam fee dialog
function closeExamFeeDialog() {
    const dialog = document.getElementById('examFeeDialog');
    
    // Clean up the Enter key event listener
    if (examFeeDialogKeyHandler) {
        dialog.removeEventListener('keydown', examFeeDialogKeyHandler);
        examFeeDialogKeyHandler = null;
    }
    
    dialog.style.display = 'none';
}

// Add exam fee checkbox listeners
function addExamFeeCheckboxListeners() {
    const checkboxes = document.querySelectorAll('#examFeeTable .student-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateExamFeeSelectionButtons);
    });
}

// Update exam fee selection buttons
function updateExamFeeSelectionButtons() {
    const checkboxes = document.querySelectorAll('#examFeeTable .student-checkbox');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    const clearBtn = document.getElementById('clearExamFeeSelectionBtn');
    const exportSelectedBtn = document.getElementById('exportExamFeeSelectedBtn');
    const saveSelectedBtn = document.getElementById('saveExamFeeSelectedBtn');
    
    if (clearBtn) clearBtn.disabled = selectedCount === 0;
    if (exportSelectedBtn) exportSelectedBtn.disabled = selectedCount === 0;
    if (saveSelectedBtn) saveSelectedBtn.disabled = selectedCount === 0;
}

// Clear exam fee selection
function clearExamFeeSelection() {
    const checkboxes = document.querySelectorAll('#examFeeTable .student-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateExamFeeSelectionButtons();
}

// Export exam fee data to CSV
function exportExamFeeToCSV() {
    exportExamFeeDataToCSV(filteredExamFeeData, 'SMP_Exam_Fee_List_All');
}

// Export selected exam fee data to CSV
function exportSelectedExamFeeToCSV() {
    const selectedData = getSelectedExamFeeData();
    if (selectedData.length === 0) {
        alert('Please select students to export');
        return;
    }
    exportExamFeeDataToCSV(selectedData, 'SMP_Exam_Fee_List_Selected');
}

// Get selected exam fee data
function getSelectedExamFeeData() {
    const checkboxes = document.querySelectorAll('#examFeeTable .student-checkbox');
    const selectedData = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const index = parseInt(checkbox.dataset.index);
            selectedData.push(filteredExamFeeData[index]);
        }
    });
    
    return selectedData;
}

// Export exam fee data to CSV helper
function exportExamFeeDataToCSV(data, filename) {
    const headers = [
        'Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No',
        'Adm Type', 'Adm Cat', 'Status', 'Exam Fee Status', 'Exam Fee Amount'
    ];
    
    const csvContent = [
        headers.join(','),
        ...data.map((student, index) => {
            const examFeeStatus = student.examFeePaid ? 'Paid' : 'Not Paid';
            const examFeeAmount = student.examFeeAmount || '';
            
            return [
                index + 1,
                `"${student['Student Name'] || ''}"`,
                `"${student['Father Name'] || ''}"`,
                student.Year || '',
                student.Course || '',
                student['Reg No'] || '',
                student['Adm Type'] || '',
                student['Adm Cat'] || '',
                student['In/Out'] || student['Status'] || '',
                examFeeStatus,
                examFeeAmount
            ].join(',');
        })
    ].join('\n');
    
    downloadCSV(csvContent, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}

// Save exam fee data to PDF
function saveExamFeeToPDF() {
    saveExamFeeDataToPDF(filteredExamFeeData, 'SMP_Exam_Fee_List_All');
}

// Save selected exam fee data to PDF
function saveSelectedExamFeeToPDF() {
    const selectedData = getSelectedExamFeeData();
    if (selectedData.length === 0) {
        alert('Please select students to save');
        return;
    }
    saveExamFeeDataToPDF(selectedData, 'SMP_Exam_Fee_List_Selected');
}

// Save exam fee data to PDF helper
function saveExamFeeDataToPDF(data, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(16);
    doc.text('SMP Exam Fee Management Report', 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Total Students: ${data.length}`, 14, 30);
    
    // Prepare table data
    const tableData = data.map((student, index) => [
        index + 1,
        student['Student Name'] || '',
        student['Father Name'] || '',
        student.Year || '',
        student.Course || '',
        student['Reg No'] || '',
        student['Adm Type'] || '',
        student['Adm Cat'] || '',
        student['In/Out'] || student['Status'] || '',
        student.examFeePaid ? 'Paid' : 'Not Paid',
        student.examFeeAmount ? `₹${student.examFeeAmount}` : ''
    ]);
    
    // Add table
    doc.autoTable({
        head: [['Sl No', 'Student Name', 'Father Name', 'Year', 'Course', 'Reg No', 
                'Adm Type', 'Adm Cat', 'Status', 'Exam Fee Status', 'Exam Fee Amount']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Fee Distribution Variables and Functions
let filteredFeeDistributionData = [];
let currentFeeDistributionFilters = {
    courseType: '',
    year: '',
    course: '',
    admType: ''
};

// Fee Structure based on academic year 2025-26
const feeStructure = {
    aided: {
        tuition: { "1st Yr": 6200, "2nd Yr": 5618, "3rd Yr": 5618 },
        other: {
            dvp: 500,
            admission: 30,
            lab: 300,
            rr: 100,
            magazine: 60,
            id: 10,
            sports: 70,
            association: 60,
            library: 150, // Only for 1st year and lateral entry 2nd year
            swf: 25,
            twf: 25,
            nss: 40
        }
    },
    unaided: {
        tuition: { "1st Yr": 13300, "2nd Yr": 12075, "3rd Yr": 12075 },
        other: {
            dvp: 500,
            admission: 30,
            lab: 300,
            rr: 100,
            magazine: 60,
            id: 10,
            sports: 70,
            association: 60,
            library: 150, // Only for 1st year and lateral entry 2nd year
            swf: 25,
            twf: 25,
            nss: 40
        }
    }
};

// Payment Analysis Functions
function formatNumber(amount) {
    return amount.toLocaleString('en-IN');
}

function calculatePaymentAnalysis() {
    // Use the existing fee distribution calculation logic for accuracy
    const aidedStudents = filteredFeeDistributionData.filter(s => ['CE', 'ME', 'EC', 'CS'].includes(s['Course']));
    const unaidedStudents = filteredFeeDistributionData.filter(s => s['Course'] === 'EE');

    const aidedDistribution = calculateFeeDistribution(aidedStudents, true);
    const unaidedDistribution = calculateFeeDistribution(unaidedStudents, false);

    // Calculate total allotted amounts using the same logic as Fee Distribution Summary
    const allottedAmounts = {
        Government: aidedDistribution.reduce((sum, item) => sum + item.toGov, 0) + unaidedDistribution.reduce((sum, item) => sum + item.toGov, 0),
        SVK: aidedDistribution.reduce((sum, item) => sum + item.toSVK, 0) + unaidedDistribution.reduce((sum, item) => sum + item.toSVK, 0),
        SMP: aidedDistribution.reduce((sum, item) => sum + item.toSMP, 0) + unaidedDistribution.reduce((sum, item) => sum + item.toSMP, 0),
        Total: aidedDistribution.reduce((sum, item) => sum + item.totalCollected, 0) + unaidedDistribution.reduce((sum, item) => sum + item.totalCollected, 0)
    };

    // Calculate actual payments from Payment of Shares data
    const actualPayments = {
        Government: 0,
        SVK: 0,
        SMP: 0
    };

    paymentOfSharesData.forEach(payment => {
        const particulars = payment['Particulars'];
        const amount = payment['Payment Amt'] || 0;

        if (particulars === 'Government') {
            actualPayments.Government += amount;
        } else if (particulars === 'SVK') {
            actualPayments.SVK += amount;
        } else if (particulars === 'SMP') {
            actualPayments.SMP += amount;
        }
    });

    // Debug logging
    console.log('Payment Analysis Debug:');
    console.log('Payment Records:', paymentOfSharesData.length);
    console.log('Actual Payments:', actualPayments);
    console.log('Allotted Amounts:', allottedAmounts);

    // Calculate remaining payments
    const remainingPayments = {
        Government: allottedAmounts.Government - actualPayments.Government,
        SVK: allottedAmounts.SVK - actualPayments.SVK,
        SMP: allottedAmounts.SMP - actualPayments.SMP
    };

    return {
        allotted: allottedAmounts,
        paid: actualPayments,
        remaining: remainingPayments
    };
}

// Display Payment Analysis Table
function displayPaymentAnalysisTable() {
    const analysis = calculatePaymentAnalysis();

    const tableHTML = `
        <div class="content-section">
            <h2 class="section-title">💳 Payment Analysis - Actual vs Alloted</h2>
            <div class="section-actions">
                <button class="btn btn-excel-small" onclick="exportPaymentAnalysisToExcel()" title="Export to Excel">📊 Excel</button>
                <button class="btn btn-pdf-small" onclick="exportPaymentAnalysisToPDF()" title="Export to PDF">📄 PDF</button>
            </div>
            <div class="table-container scrollable-feedistribution">
                <table id="paymentAnalysisTable">
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th>Alloted Amount (₹)</th>
                            <th>Paid Amount (₹)</th>
                            <th>Remaining Amount (₹)</th>
                            <th>Payment Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Government</td>
                            <td>${formatNumber(analysis.allotted.Government)}</td>
                            <td>${formatNumber(analysis.paid.Government)}</td>
                            <td>${formatNumber(analysis.remaining.Government)}</td>
                            <td>${getPaymentStatus(analysis.remaining.Government)}</td>
                        </tr>
                        <tr>
                            <td>SVK Management</td>
                            <td>${formatNumber(analysis.allotted.SVK)}</td>
                            <td>${formatNumber(analysis.paid.SVK)}</td>
                            <td>${formatNumber(analysis.remaining.SVK)}</td>
                            <td>${getPaymentStatus(analysis.remaining.SVK)}</td>
                        </tr>
                        <tr>
                            <td>SMP</td>
                            <td>${formatNumber(analysis.allotted.SMP)}</td>
                            <td>${formatNumber(analysis.paid.SMP)}</td>
                            <td>${formatNumber(analysis.remaining.SMP)}</td>
                            <td>${getPaymentStatus(analysis.remaining.SMP)}</td>
                        </tr>
                        <tr style="font-weight: bold; background-color: var(--table-header-bg);">
                            <td>Total</td>
                            <td>${formatNumber(analysis.allotted.Total)}</td>
                            <td>${formatNumber(analysis.paid.Government + analysis.paid.SVK + analysis.paid.SMP)}</td>
                            <td>${formatNumber(analysis.remaining.Government + analysis.remaining.SVK + analysis.remaining.SMP)}</td>
                            <td>${getPaymentStatus(analysis.remaining.Government + analysis.remaining.SVK + analysis.remaining.SMP)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    return tableHTML;
}

// Get payment status with color coding
function getPaymentStatus(remainingAmount) {
    if (remainingAmount === 0) {
        return '<span style="color: var(--success-color); font-weight: bold;">✓ Paid</span>';
    } else if (remainingAmount > 0) {
        return '<span style="color: var(--warning-color); font-weight: bold;">⚠ Pending</span>';
    } else {
        return '<span style="color: var(--error-color); font-weight: bold;">⚠ Overpaid</span>';
    }
}

// Generate Payment Breakdown Data (sorted by Government, SMP, SVK)
function generatePaymentBreakdownData() {
    const breakdown = {
        Government: [],
        SMP: [],
        SVK: []
    };

    paymentOfSharesData.forEach(payment => {
        const particulars = payment['Particulars'];
        const amount = payment['Payment Amt'] || 0;
        const date = payment['Date'] || '';
        const remarks = payment['Remarks'] || '';
        const chqNo = payment['Chq No'] || '';

        if (breakdown.hasOwnProperty(particulars)) {
            breakdown[particulars].push({
                date: date,
                chqNo: chqNo,
                amount: amount,
                remarks: remarks
            });
        }
    });

    return breakdown;
}

// Export Payment Analysis to Excel
function exportPaymentAnalysisToExcel() {
    const analysis = calculatePaymentAnalysis();
    const paymentBreakdown = generatePaymentBreakdownData();

    const getPaymentStatusText = (remaining) => {
        if (remaining === 0) return 'Paid';
        else if (remaining > 0) return 'Pending';
        else return 'Overpaid';
    };

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
        ['Account', 'Alloted Amount (₹)', 'Paid Amount (₹)', 'Remaining Amount (₹)', 'Payment Status'],
        ['Government', analysis.allotted.Government, analysis.paid.Government, analysis.remaining.Government, getPaymentStatusText(analysis.remaining.Government)],
        ['SVK Management', analysis.allotted.SVK, analysis.paid.SVK, analysis.remaining.SVK, getPaymentStatusText(analysis.remaining.SVK)],
        ['SMP', analysis.allotted.SMP, analysis.paid.SMP, analysis.remaining.SMP, getPaymentStatusText(analysis.remaining.SMP)],
        ['Total', analysis.allotted.Total, analysis.paid.Government + analysis.paid.SVK + analysis.paid.SMP, analysis.remaining.Government + analysis.remaining.SVK + analysis.remaining.SMP, getPaymentStatusText(analysis.remaining.Government + analysis.remaining.SVK + analysis.remaining.SMP)]
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Payment Analysis Summary");

    // Payment Breakdown Sheet
    const breakdownData = [['Sl No', 'Account', 'Date', 'Reference No', 'Amount (₹)', 'Remarks']];
    let slNo = 1;

    // Process payments in order: Government, SMP, SVK
    ['Government', 'SMP', 'SVK'].forEach(account => {
        if (paymentBreakdown[account]) {
            paymentBreakdown[account].forEach(payment => {
                breakdownData.push([
                    slNo++,
                    account,
                    payment.date,
                    payment.chqNo,
                    payment.amount,
                    payment.remarks
                ]);
            });
        }
    });

    const breakdownWs = XLSX.utils.aoa_to_sheet(breakdownData);
    XLSX.utils.book_append_sheet(wb, breakdownWs, "Payment Breakdown");

    // Auto-adjust column widths
    const colWidths = [
        { wch: 8 },  // Sl No
        { wch: 15 }, // Account
        { wch: 12 }, // Date
        { wch: 15 }, // Reference No
        { wch: 12 }, // Amount
        { wch: 20 }  // Remarks
    ];
    breakdownWs['!cols'] = colWidths;

    XLSX.writeFile(wb, `Payment_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Export Payment Analysis to PDF
function exportPaymentAnalysisToPDF() {
    const analysis = calculatePaymentAnalysis();
    const paymentBreakdown = generatePaymentBreakdownData();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table fitting

    // Add title
    doc.setFontSize(18);
    doc.text('SMP Payment Analysis Report', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });

    // Summary Table
    const summaryData = [
        ['Government', analysis.allotted.Government, analysis.paid.Government, analysis.remaining.Government],
        ['SVK Management', analysis.allotted.SVK, analysis.paid.SVK, analysis.remaining.SVK],
        ['SMP', analysis.allotted.SMP, analysis.paid.SMP, analysis.remaining.SMP],
        ['Total', analysis.allotted.Total, analysis.paid.Government + analysis.paid.SVK + analysis.paid.SMP, analysis.remaining.Government + analysis.remaining.SVK + analysis.remaining.SMP]
    ];

    doc.autoTable({
        head: [['Account', 'Alloted (₹)', 'Paid (₹)', 'Remaining (₹)']],
        body: summaryData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 50, fontSize: 9 },
            1: { cellWidth: 35, halign: 'right', fontSize: 9 },
            2: { cellWidth: 35, halign: 'right', fontSize: 9 },
            3: { cellWidth: 35, halign: 'right', fontSize: 9 }
        }
    });

    // Payment Breakdown Section
    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.text('Payment Breakdown Details', doc.internal.pageSize.getWidth() / 2, finalY, { align: 'center' });

    // Prepare breakdown data
    const breakdownData = [];
    let slNo = 1;

    // Process payments in order: Government, SMP, SVK (no account headers)
    ['Government', 'SMP', 'SVK'].forEach(account => {
        if (paymentBreakdown[account]) {
            paymentBreakdown[account].forEach(payment => {
                breakdownData.push([
                    slNo++,
                    account,
                    payment.date,
                    payment.chqNo,
                    payment.amount.toLocaleString('en-IN'),
                    payment.remarks
                ]);
            });
        }
    });

    // Add breakdown table
    doc.autoTable({
        head: [['Sl No', 'Account', 'Date', 'Reference No', 'Amount (₹)', 'Remarks']],
        body: breakdownData,
        startY: finalY + 10,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
        styles: { fontSize: 7 },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 20 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 45 }
        }
    });

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() - 30,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'right' }
        );
    }

    doc.save(`Payment_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Initialize Fee Distribution Section
function initializeFeeDistribution() {
    filteredFeeDistributionData = [...studentsData];
    populateFeeDistributionFilters();
    applyFeeDistributionFilters();
}

// Populate Fee Distribution Filters
function populateFeeDistributionFilters() {
    const years = [...new Set(studentsData.map(s => s['Year']))].sort();
    const courses = [...new Set(studentsData.map(s => s['Course']))].sort();
    
    // Populate year filter
    const yearFilter = document.getElementById('feeDistributionYearFilter');
    if (yearFilter) {
        yearFilter.innerHTML = '<option value="">All Years</option>';
        years.forEach(year => {
            if (year) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearFilter.appendChild(option);
            }
        });
    }
    
    // Populate course filter
    const courseFilter = document.getElementById('feeDistributionCourseFilter');
    if (courseFilter) {
        courseFilter.innerHTML = '<option value="">All Courses</option>';
        courses.forEach(course => {
            if (course) {
                const option = document.createElement('option');
                option.value = course;
                option.textContent = course;
                courseFilter.appendChild(option);
            }
        });
    }
    
    // Populate admission type filter
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
    
    const admTypeFilter = document.getElementById('feeDistributionAdmTypeFilter');
    if (admTypeFilter) {
        admTypeFilter.innerHTML = '<option value="">All Types</option>';
        [...admTypesSet].sort().forEach(admType => {
            const option = document.createElement('option');
            option.value = admType;
            option.textContent = admType;
            admTypeFilter.appendChild(option);
        });
    }
}

// Apply Fee Distribution Filters
function applyFeeDistributionFilters() {
    currentFeeDistributionFilters.courseType = document.getElementById('feeDistributionCourseTypeFilter')?.value || '';
    currentFeeDistributionFilters.year = document.getElementById('feeDistributionYearFilter')?.value || '';
    currentFeeDistributionFilters.course = document.getElementById('feeDistributionCourseFilter')?.value || '';
    currentFeeDistributionFilters.admType = document.getElementById('feeDistributionAdmTypeFilter')?.value || '';
    
    filteredFeeDistributionData = studentsData.filter(student => {
        // Course Type filter (Aided/Unaided)
        if (currentFeeDistributionFilters.courseType) {
            const course = student['Course'];
            const isAided = ['CE', 'ME', 'EC', 'CS'].includes(course);
            if ((currentFeeDistributionFilters.courseType === 'Aided' && !isAided) ||
                (currentFeeDistributionFilters.courseType === 'Unaided' && isAided)) {
                return false;
            }
        }
        
        // Year filter
        if (currentFeeDistributionFilters.year && student['Year'] !== currentFeeDistributionFilters.year) {
            return false;
        }
        
        // Course filter
        if (currentFeeDistributionFilters.course && student['Course'] !== currentFeeDistributionFilters.course) {
            return false;
        }
        
        // Admission Type filter
        if (currentFeeDistributionFilters.admType) {
            const admCat = student['Adm Cat'] || '';
            const admTypeCol = student['Adm Type'] || '';
            
            let studentAdmType = '';
            if (admCat.trim() === 'SNQ') {
                studentAdmType = 'SNQ';
            } else if (admTypeCol === 'LTRL' || admTypeCol === 'RPTR') {
                studentAdmType = admTypeCol;
            } else {
                studentAdmType = 'REGULAR';
            }
            
            if (studentAdmType !== currentFeeDistributionFilters.admType) {
                return false;
            }
        }
        
        return true;
    });
    
    displayFeeDistributionData();
    displayFeeDistributionMetrics();
    showHideFeeDistributionTables();
}

// Display Fee Distribution Data
function displayFeeDistributionData() {
    displayFeeDistributionStudentStats();
    displayFeeDistributionSummary();
    displayFeeDistributionAided();
    displayFeeDistributionUnaided();
    displayFeeDistributionCombined();
    displayPaymentAnalysis();
}

// Display Payment Analysis
function displayPaymentAnalysis() {
    const paymentAnalysisSection = document.getElementById('paymentAnalysisSection');
    if (!paymentAnalysisSection) return;

    // Generate the payment analysis table HTML
    const tableHTML = displayPaymentAnalysisTable();
    paymentAnalysisSection.innerHTML = tableHTML;
}

// Display Fee Distribution Student Statistics
function displayFeeDistributionStudentStats() {
    const tbody = document.querySelector('#feeDistributionStudentStatsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Group students by course and year
    const stats = {};
    const courses = ['CE', 'ME', 'EC', 'CS', 'EE'];
    const years = ['1st Yr', '2nd Yr', '3rd Yr'];
    
    // Initialize stats structure
    courses.forEach(course => {
        stats[course] = {};
        years.forEach(year => {
            stats[course][year] = { regular: 0, lateral: 0, snq: 0, total: 0 };
        });
        stats[course].grandTotal = 0;
    });
    
    // Populate stats from filtered data
    filteredFeeDistributionData.forEach(student => {
        const course = student['Course'];
        const year = student['Year'];
        const admCat = student['Adm Cat'] || '';
        const admType = student['Adm Type'] || '';
        
        if (stats[course] && stats[course][year]) {
            if (admCat.trim() === 'SNQ') {
                stats[course][year].snq++;
            } else if (admType === 'LTRL' && year !== '3rd Yr') {
                // For 3rd year, LTRL students should be counted as Regular
                stats[course][year].lateral++;
            } else {
                // Regular includes: Regular, RPTR, and 3rd year LTRL students
                stats[course][year].regular++;
            }
            stats[course][year].total++;
            stats[course].grandTotal++;
        }
    });
    
    // Display stats
    courses.forEach((course, index) => {
        const courseType = ['CE', 'ME', 'EC', 'CS'].includes(course) ? 'Aided' : 'Unaided';
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${course} (${courseType})</strong></td>
            <td>${stats[course]['1st Yr'].regular}</td>
            <td>${stats[course]['1st Yr'].snq}</td>
            <td><strong>${stats[course]['1st Yr'].total}</strong></td>
            <td>${stats[course]['2nd Yr'].regular}</td>
            <td>${stats[course]['2nd Yr'].lateral}</td>
            <td>${stats[course]['2nd Yr'].snq}</td>
            <td><strong>${stats[course]['2nd Yr'].total}</strong></td>
            <td>${stats[course]['3rd Yr'].regular}</td>
            <td>${stats[course]['3rd Yr'].snq}</td>
            <td><strong>${stats[course]['3rd Yr'].total}</strong></td>
            <td class="total-cell"><strong>${stats[course].grandTotal}</strong></td>
        `;
        tbody.appendChild(row);
    });
    
    // Add Grand Total row
    const grandTotalRow = document.createElement('tr');
    grandTotalRow.className = 'grand-total-row';
    
    const grandTotals = {
        '1st Yr': { regular: 0, snq: 0, total: 0 },
        '2nd Yr': { regular: 0, lateral: 0, snq: 0, total: 0 },
        '3rd Yr': { regular: 0, snq: 0, total: 0 },
        overall: 0
    };
    
    courses.forEach(course => {
        years.forEach(year => {
            grandTotals[year].regular += stats[course][year].regular;
            grandTotals[year].lateral = (grandTotals[year].lateral || 0) + stats[course][year].lateral;
            grandTotals[year].snq += stats[course][year].snq;
            grandTotals[year].total += stats[course][year].total;
        });
        grandTotals.overall += stats[course].grandTotal;
    });
    
    grandTotalRow.innerHTML = `
        <td colspan="2"><strong>GRAND TOTAL</strong></td>
        <td><strong>${grandTotals['1st Yr'].regular}</strong></td>
        <td><strong>${grandTotals['1st Yr'].snq}</strong></td>
        <td><strong>${grandTotals['1st Yr'].total}</strong></td>
        <td><strong>${grandTotals['2nd Yr'].regular}</strong></td>
        <td><strong>${grandTotals['2nd Yr'].lateral}</strong></td>
        <td><strong>${grandTotals['2nd Yr'].snq}</strong></td>
        <td><strong>${grandTotals['2nd Yr'].total}</strong></td>
        <td><strong>${grandTotals['3rd Yr'].regular}</strong></td>
        <td><strong>${grandTotals['3rd Yr'].snq}</strong></td>
        <td><strong>${grandTotals['3rd Yr'].total}</strong></td>
        <td class="total-cell"><strong>${grandTotals.overall}</strong></td>
    `;
    tbody.appendChild(grandTotalRow);
}

// Calculate Fee Distribution for Aided/Unaided courses
function calculateFeeDistribution(students, isAided) {
    const courseFilter = isAided ? 
        (course) => ['CE', 'ME', 'EC', 'CS'].includes(course) :
        (course) => course === 'EE';
    
    const filteredStudents = students.filter(s => courseFilter(s['Course']));
    const feeData = isAided ? feeStructure.aided : feeStructure.unaided;
    
    const distribution = [];
    let slNo = 1;
    
    // Calculate tuition fees by year using corrected fee structure
    // 1st Year: Regular 1st Year students + Lateral 2nd Year students
    const firstYearRegularStudents = filteredStudents.filter(s => 
        s['Year'] === '1st Yr' && s['Adm Cat']?.trim() !== 'SNQ'
    );
    const lateralSecondYearStudents = filteredStudents.filter(s => 
        s['Year'] === '2nd Yr' && s['Adm Type'] === 'LTRL' && s['Adm Cat']?.trim() !== 'SNQ'
    );
    const firstYearTuitionStudents = [...firstYearRegularStudents, ...lateralSecondYearStudents];
    
    if (firstYearTuitionStudents.length > 0) {
        const tuitionFeePerStudent = feeData.tuition['1st Yr'];
        const totalTuitionCollected = firstYearTuitionStudents.length * tuitionFeePerStudent;
        
        distribution.push({
            slNo: slNo++,
            feeType: `Tuition Fee 1st Yr`,
            studentCount: firstYearTuitionStudents.length,
            feeAmount: tuitionFeePerStudent,
            totalCollected: totalTuitionCollected,
            toGov: isAided ? totalTuitionCollected / 2 : 0,
            toSVK: isAided ? totalTuitionCollected / 2 : totalTuitionCollected,
            toSMP: 0
        });
    }
    
    // 2nd Year: Only Regular 2nd Year students (excluding Lateral)
    const secondYearRegularStudents = filteredStudents.filter(s => 
        s['Year'] === '2nd Yr' && s['Adm Type'] !== 'LTRL' && s['Adm Cat']?.trim() !== 'SNQ'
    );
    
    if (secondYearRegularStudents.length > 0) {
        const tuitionFeePerStudent = feeData.tuition['2nd Yr'];
        const totalTuitionCollected = secondYearRegularStudents.length * tuitionFeePerStudent;
        
        distribution.push({
            slNo: slNo++,
            feeType: `Tuition Fee 2nd Yr`,
            studentCount: secondYearRegularStudents.length,
            feeAmount: tuitionFeePerStudent,
            totalCollected: totalTuitionCollected,
            toGov: isAided ? totalTuitionCollected / 2 : 0,
            toSVK: isAided ? totalTuitionCollected / 2 : totalTuitionCollected,
            toSMP: 0
        });
    }
    
    // 3rd Year: All 3rd Year students (excluding SNQ)
    const thirdYearStudents = filteredStudents.filter(s => 
        s['Year'] === '3rd Yr' && s['Adm Cat']?.trim() !== 'SNQ'
    );
    
    if (thirdYearStudents.length > 0) {
        const tuitionFeePerStudent = feeData.tuition['3rd Yr'];
        const totalTuitionCollected = thirdYearStudents.length * tuitionFeePerStudent;
        
        distribution.push({
            slNo: slNo++,
            feeType: `Tuition Fee 3rd Yr`,
            studentCount: thirdYearStudents.length,
            feeAmount: tuitionFeePerStudent,
            totalCollected: totalTuitionCollected,
            toGov: isAided ? totalTuitionCollected / 2 : 0,
            toSVK: isAided ? totalTuitionCollected / 2 : totalTuitionCollected,
            toSMP: 0
        });
    }
    
    // Calculate other fees
    Object.entries(feeData.other).forEach(([feeType, amount]) => {
        let studentCount = 0;
        
        if (feeType === 'library') {
            // Library fee: 1st Yr total count + 2nd Yr LTRL count
            const firstYearStudents = filteredStudents.filter(s => s['Year'] === '1st Yr');
            const secondYearLateralStudents = filteredStudents.filter(s => s['Year'] === '2nd Yr' && s['Adm Type'] === 'LTRL');
            studentCount = firstYearStudents.length + secondYearLateralStudents.length;
        } else {
            studentCount = filteredStudents.length;
        }
        
        if (studentCount > 0) {
            const totalCollected = studentCount * amount;
            let toGov = 0, toSVK = 0, toSMP = 0;
            
            // Distribution logic based on fee type
            if (isAided) {
                if (['dvp', 'admission'].includes(feeType)) {
                    // DVP and Admission fees for aided courses: 50% to Government, 50% to SVK
                    toGov = totalCollected / 2;
                    toSVK = totalCollected / 2;
                } else if (['lab', 'rr', 'magazine', 'id'].includes(feeType)) {
                    // Other specified fees are split between Government and SMP
                    toGov = totalCollected / 2;
                    toSMP = totalCollected / 2;
                } else {
                    // Remaining fees go to SMP
                    toSMP = totalCollected;
                }
            } else {
                if (['dvp', 'admission'].includes(feeType)) {
                    toSVK = totalCollected;
                } else {
                    toSMP = totalCollected;
                }
            }
            
            distribution.push({
                slNo: slNo++,
                feeType: feeType.toUpperCase(),
                studentCount: studentCount,
                feeAmount: amount,
                totalCollected: totalCollected,
                toGov: toGov,
                toSVK: toSVK,
                toSMP: toSMP
            });
        }
    });
    
    // Calculate Fine Amount from CSV data
    let totalFine = 0;
    let finePayingStudents = 0;
    
    filteredStudents.forEach(student => {
        const fineAmount = parseFloat(student['Fine'] || 0);
        if (fineAmount > 0) {
            totalFine += fineAmount;
            finePayingStudents++;
        }
    });
    
    // Add fine entry if there are students who paid fine
    if (totalFine > 0) {
        distribution.push({
            slNo: slNo++,
            feeType: 'FINE',
            studentCount: finePayingStudents,
            feeAmount: Math.round(totalFine / finePayingStudents),
            totalCollected: totalFine,
            toGov: totalFine, // 100% to Government
            toSVK: 0,
            toSMP: 0
        });
    }
    
    return distribution;
}

// Display Fee Distribution Summary
function displayFeeDistributionSummary() {
    const tbody = document.querySelector('#feeDistributionSummaryTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const aidedStudents = filteredFeeDistributionData.filter(s => ['CE', 'ME', 'EC', 'CS'].includes(s['Course']));
    const unaidedStudents = filteredFeeDistributionData.filter(s => s['Course'] === 'EE');
    
    const aidedDistribution = calculateFeeDistribution(aidedStudents, true);
    const unaidedDistribution = calculateFeeDistribution(unaidedStudents, false);
    
    const summaryData = [
        {
            courseType: 'Aided Courses (CE, ME, EC, CS)',
            students: aidedStudents.length,
            totalCollected: aidedDistribution.reduce((sum, item) => sum + item.totalCollected, 0),
            toGov: aidedDistribution.reduce((sum, item) => sum + item.toGov, 0),
            toSVK: aidedDistribution.reduce((sum, item) => sum + item.toSVK, 0),
            toSMP: aidedDistribution.reduce((sum, item) => sum + item.toSMP, 0)
        },
        {
            courseType: 'Unaided Course (EE)',
            students: unaidedStudents.length,
            totalCollected: unaidedDistribution.reduce((sum, item) => sum + item.totalCollected, 0),
            toGov: unaidedDistribution.reduce((sum, item) => sum + item.toGov, 0),
            toSVK: unaidedDistribution.reduce((sum, item) => sum + item.toSVK, 0),
            toSMP: unaidedDistribution.reduce((sum, item) => sum + item.toSMP, 0)
        }
    ];
    
    summaryData.forEach((data, index) => {
        const row = document.createElement('tr');
        if (index === 0) row.className = 'aided-row';
        if (index === 1) row.className = 'unaided-row';
        
        row.innerHTML = `
            <td><strong>${data.courseType}</strong></td>
            <td>${data.students}</td>
            <td class="amount">₹${data.totalCollected.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.toGov.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.toSVK.toLocaleString('en-IN')}</td>
            <td class="amount">₹${data.toSMP.toLocaleString('en-IN')}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add Grand Total row
    const grandTotal = {
        students: summaryData.reduce((sum, item) => sum + item.students, 0),
        totalCollected: summaryData.reduce((sum, item) => sum + item.totalCollected, 0),
        toGov: summaryData.reduce((sum, item) => sum + item.toGov, 0),
        toSVK: summaryData.reduce((sum, item) => sum + item.toSVK, 0),
        toSMP: summaryData.reduce((sum, item) => sum + item.toSMP, 0)
    };
    
    const grandTotalRow = document.createElement('tr');
    grandTotalRow.className = 'grand-total-row';
    grandTotalRow.innerHTML = `
        <td><strong>GRAND TOTAL</strong></td>
        <td><strong>${grandTotal.students}</strong></td>
        <td class="amount"><strong>₹${grandTotal.totalCollected.toLocaleString('en-IN')}</strong></td>
        <td class="amount"><strong>₹${grandTotal.toGov.toLocaleString('en-IN')}</strong></td>
        <td class="amount"><strong>₹${grandTotal.toSVK.toLocaleString('en-IN')}</strong></td>
        <td class="amount"><strong>₹${grandTotal.toSMP.toLocaleString('en-IN')}</strong></td>
    `;
    tbody.appendChild(grandTotalRow);
}

// Display Aided Courses Fee Distribution
function displayFeeDistributionAided() {
    const tbody = document.querySelector('#feeDistributionAidedTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const aidedStudents = filteredFeeDistributionData.filter(s => ['CE', 'ME', 'EC', 'CS'].includes(s['Course']));
    const distribution = calculateFeeDistribution(aidedStudents, true);
    
    distribution.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.slNo}</td>
            <td><strong>${item.feeType}</strong></td>
            <td>${item.studentCount}</td>
            <td class="amount">₹${item.feeAmount.toLocaleString('en-IN')}</td>
            <td class="amount">₹${item.totalCollected.toLocaleString('en-IN')}</td>
            <td class="amount">₹${item.toGov.toLocaleString('en-IN')}</td>
            <td class="amount">₹${item.toSVK.toLocaleString('en-IN')}</td>
            <td class="amount">₹${item.toSMP.toLocaleString('en-IN')}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add Grand Total row
    if (distribution.length > 0) {
        const totals = distribution.reduce((sum, item) => ({
            totalCollected: sum.totalCollected + item.totalCollected,
            toGov: sum.toGov + item.toGov,
            toSVK: sum.toSVK + item.toSVK,
            toSMP: sum.toSMP + item.toSMP
        }), { totalCollected: 0, toGov: 0, toSVK: 0, toSMP: 0 });
        
        const grandTotalRow = document.createElement('tr');
        grandTotalRow.className = 'grand-total-row';
        grandTotalRow.innerHTML = `
            <td colspan="4"><strong>GRAND TOTAL</strong></td>
            <td class="amount"><strong>₹${totals.totalCollected.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totals.toGov.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totals.toSVK.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totals.toSMP.toLocaleString('en-IN')}</strong></td>
        `;
        tbody.appendChild(grandTotalRow);
    }
}

// Display Unaided Course Fee Distribution
function displayFeeDistributionUnaided() {
    const tbody = document.querySelector('#feeDistributionUnaidedTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const unaidedStudents = filteredFeeDistributionData.filter(s => s['Course'] === 'EE');
    const distribution = calculateFeeDistribution(unaidedStudents, false);
    
    distribution.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.slNo}</td>
            <td><strong>${item.feeType}</strong></td>
            <td>${item.studentCount}</td>
            <td class="amount">₹${item.feeAmount.toLocaleString('en-IN')}</td>
            <td class="amount">₹${item.totalCollected.toLocaleString('en-IN')}</td>
            <td class="amount">₹${item.toGov.toLocaleString('en-IN')}</td>
            <td class="amount">₹${item.toSVK.toLocaleString('en-IN')}</td>
            <td class="amount">₹${item.toSMP.toLocaleString('en-IN')}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add Grand Total row
    if (distribution.length > 0) {
        const totals = distribution.reduce((sum, item) => ({
            totalCollected: sum.totalCollected + item.totalCollected,
            toGov: sum.toGov + item.toGov,
            toSVK: sum.toSVK + item.toSVK,
            toSMP: sum.toSMP + item.toSMP
        }), { totalCollected: 0, toGov: 0, toSVK: 0, toSMP: 0 });
        
        const grandTotalRow = document.createElement('tr');
        grandTotalRow.className = 'grand-total-row';
        grandTotalRow.innerHTML = `
            <td colspan="4"><strong>GRAND TOTAL</strong></td>
            <td class="amount"><strong>₹${totals.totalCollected.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totals.toGov.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totals.toSVK.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totals.toSMP.toLocaleString('en-IN')}</strong></td>
        `;
        tbody.appendChild(grandTotalRow);
    }
}

// Display Combined Fee Distribution (Aided & Unaided)
function displayFeeDistributionCombined() {
    const tbody = document.querySelector('#feeDistributionCombinedTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const aidedStudents = filteredFeeDistributionData.filter(s => ['CE', 'ME', 'EC', 'CS'].includes(s['Course']));
    const unaidedStudents = filteredFeeDistributionData.filter(s => s['Course'] === 'EE');
    
    const aidedDistribution = calculateFeeDistribution(aidedStudents, true);
    const unaidedDistribution = calculateFeeDistribution(unaidedStudents, false);
    
    let slNo = 1;
    
    // Add Aided courses data
    if (aidedDistribution.length > 0) {
        aidedDistribution.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'aided-row';
            row.innerHTML = `
                <td>${slNo++}</td>
                <td><strong>Aided</strong></td>
                <td><strong>${item.feeType}</strong></td>
                <td class="amount">${item.studentCount}</td>
                <td class="amount">₹${item.feeAmount.toLocaleString('en-IN')}</td>
                <td class="amount">₹${item.totalCollected.toLocaleString('en-IN')}</td>
                <td class="amount">₹${item.toGov.toLocaleString('en-IN')}</td>
                <td class="amount">₹${item.toSVK.toLocaleString('en-IN')}</td>
                <td class="amount">₹${item.toSMP.toLocaleString('en-IN')}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Add Unaided courses data
    if (unaidedDistribution.length > 0) {
        unaidedDistribution.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'unaided-row';
            row.innerHTML = `
                <td>${slNo++}</td>
                <td><strong>Unaided</strong></td>
                <td><strong>${item.feeType}</strong></td>
                <td class="amount">${item.studentCount}</td>
                <td class="amount">₹${item.feeAmount.toLocaleString('en-IN')}</td>
                <td class="amount">₹${item.totalCollected.toLocaleString('en-IN')}</td>
                <td class="amount">₹${item.toGov.toLocaleString('en-IN')}</td>
                <td class="amount">₹${item.toSVK.toLocaleString('en-IN')}</td>
                <td class="amount">₹${item.toSMP.toLocaleString('en-IN')}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Add Grand Total row
    if (aidedDistribution.length > 0 || unaidedDistribution.length > 0) {
        const allDistribution = [...aidedDistribution, ...unaidedDistribution];
        const totals = allDistribution.reduce((sum, item) => ({
            totalCollected: sum.totalCollected + item.totalCollected,
            toGov: sum.toGov + item.toGov,
            toSVK: sum.toSVK + item.toSVK,
            toSMP: sum.toSMP + item.toSMP
        }), { totalCollected: 0, toGov: 0, toSVK: 0, toSMP: 0 });
        
        const grandTotalRow = document.createElement('tr');
        grandTotalRow.className = 'grand-total-row';
        grandTotalRow.innerHTML = `
            <td colspan="5"><strong>GRAND TOTAL</strong></td>
            <td class="amount"><strong>₹${totals.totalCollected.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totals.toGov.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totals.toSVK.toLocaleString('en-IN')}</strong></td>
            <td class="amount"><strong>₹${totals.toSMP.toLocaleString('en-IN')}</strong></td>
        `;
        tbody.appendChild(grandTotalRow);
    }
}

// Display Fee Distribution Metrics
function displayFeeDistributionMetrics() {
    const metricsGrid = document.getElementById('feeDistributionMetricsGrid');
    if (!metricsGrid) return;
    
    const aidedStudents = filteredFeeDistributionData.filter(s => ['CE', 'ME', 'EC', 'CS'].includes(s['Course']));
    const unaidedStudents = filteredFeeDistributionData.filter(s => s['Course'] === 'EE');
    
    const aidedDistribution = calculateFeeDistribution(aidedStudents, true);
    const unaidedDistribution = calculateFeeDistribution(unaidedStudents, false);
    
    const totalCollected = [
        ...aidedDistribution,
        ...unaidedDistribution
    ].reduce((sum, item) => sum + item.totalCollected, 0);
    
    const totalToGov = [
        ...aidedDistribution,
        ...unaidedDistribution
    ].reduce((sum, item) => sum + item.toGov, 0);
    
    const totalToSVK = [
        ...aidedDistribution,
        ...unaidedDistribution
    ].reduce((sum, item) => sum + item.toSVK, 0);
    
    const totalToSMP = [
        ...aidedDistribution,
        ...unaidedDistribution
    ].reduce((sum, item) => sum + item.toSMP, 0);
    
    metricsGrid.innerHTML = `
        <div class="metric-card" onclick="showCourseBreakdown('Total Students', ${filteredFeeDistributionData.length}, 'students')">
            <div class="metric-value">${filteredFeeDistributionData.length}</div>
            <div class="metric-label">Total Students</div>
        </div>
        <div class="metric-card" onclick="showCourseBreakdown('Total Fee Allotted', '₹${totalCollected.toLocaleString('en-IN')}', 'amount')">
            <div class="metric-value">₹${totalCollected.toLocaleString('en-IN')}</div>
            <div class="metric-label">Total Fee Allotted</div>
        </div>
        <div class="metric-card" onclick="showCourseBreakdown('To Government', '₹${totalToGov.toLocaleString('en-IN')}', 'amount')">
            <div class="metric-value">₹${totalToGov.toLocaleString('en-IN')}</div>
            <div class="metric-label">To Government</div>
        </div>
        <div class="metric-card" onclick="showCourseBreakdown('To SVK Management', '₹${totalToSVK.toLocaleString('en-IN')}', 'amount')">
            <div class="metric-value">₹${totalToSVK.toLocaleString('en-IN')}</div>
            <div class="metric-label">To SVK Management</div>
        </div>
        <div class="metric-card" onclick="showCourseBreakdown('To SMP', '₹${totalToSMP.toLocaleString('en-IN')}', 'amount')">
            <div class="metric-value">₹${totalToSMP.toLocaleString('en-IN')}</div>
            <div class="metric-label">To SMP</div>
        </div>
        <div class="metric-card" onclick="showCourseBreakdown('Aided Students', ${aidedStudents.length}, 'students')">
            <div class="metric-value">${aidedStudents.length}</div>
            <div class="metric-label">Aided Students</div>
        </div>
        <div class="metric-card" onclick="showCourseBreakdown('Unaided Students', ${unaidedStudents.length}, 'students')">
            <div class="metric-value">${unaidedStudents.length}</div>
            <div class="metric-label">Unaided Students</div>
        </div>
    `;
}

// Show/Hide Fee Distribution Tables based on filter
function showHideFeeDistributionTables() {
    const tableFilter = document.getElementById('feeDistributionTableFilter')?.value || 'all';
    
    const sections = {
        'feeDistributionStudentStatsSection': ['all', 'studentstats'],
        'feeDistributionSummarySection': ['all', 'summary'],
        'feeDistributionAidedSection': ['all', 'aided'],
        'feeDistributionUnaidedSection': ['all', 'unaided'],
        'feeDistributionCombinedSection': ['all', 'combined'],
        'paymentAnalysisSection': ['all', 'payment']
    };
    
    Object.entries(sections).forEach(([sectionId, visibleFor]) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = visibleFor.includes(tableFilter) ? 'block' : 'none';
        }
    });
}

// Clear Fee Distribution Filters
function clearFeeDistributionFilters() {
    document.getElementById('feeDistributionCourseTypeFilter').value = '';
    document.getElementById('feeDistributionYearFilter').value = '';
    document.getElementById('feeDistributionCourseFilter').value = '';
    document.getElementById('feeDistributionAdmTypeFilter').value = '';
    document.getElementById('feeDistributionTableFilter').value = 'all';
    applyFeeDistributionFilters();
}

// Export Functions for Fee Distribution
function exportFeeDistributionToCSV() {
    // Export all data as CSV
    const timestamp = new Date().toISOString().split('T')[0];
    const csvData = [];
    
    // Add header
    csvData.push('Section,Sl No,Fee Type,Students Count,Fee Amount,Total Collected,To Govt,To SVK,To SMP');
    
    // Add Aided data
    const aidedStudents = filteredFeeDistributionData.filter(s => ['CE', 'ME', 'EC', 'CS'].includes(s['Course']));
    const aidedDistribution = calculateFeeDistribution(aidedStudents, true);
    aidedDistribution.forEach(item => {
        csvData.push(`Aided,${Number(item.slNo)},"${item.feeType}",${Number(item.studentCount)},${Number(item.feeAmount)},${Number(item.totalCollected)},${Number(item.toGov)},${Number(item.toSVK)},${Number(item.toSMP)}`);
    });
    
    // Add Unaided data
    const unaidedStudents = filteredFeeDistributionData.filter(s => s['Course'] === 'EE');
    const unaidedDistribution = calculateFeeDistribution(unaidedStudents, false);
    unaidedDistribution.forEach(item => {
        csvData.push(`Unaided,${Number(item.slNo)},"${item.feeType}",${Number(item.studentCount)},${Number(item.feeAmount)},${Number(item.totalCollected)},${Number(item.toGov)},${Number(item.toSVK)},${Number(item.toSMP)}`);
    });
    
    // Download CSV
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SMP_Fee_Distribution_${timestamp}.csv`;
    link.click();
}

function saveFeeDistributionToExcel() {
    const timestamp = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();
    
    // Student Statistics Sheet
    const statsData = [['Sl No', 'Courses', '1st Yr Regular', '1st Yr SNQ', '1st Yr Total', '2nd Yr Regular', '2nd Yr Lateral', '2nd Yr SNQ', '2nd Yr Total', '3rd Yr Regular', '3rd Yr SNQ', '3rd Yr Total', 'Grand Total']];
    document.querySelectorAll('#feeDistributionStudentStatsTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map((cell, index) => {
                const textContent = cell.textContent.trim();
                // Convert numerical columns to numbers (column 0 is course name, rest are numbers)
                return index === 0 ? textContent : (isNaN(textContent) ? textContent : Number(textContent));
            });
            statsData.push(rowData);
        }
    });
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Student Statistics');
    
    // Summary Sheet
    const summaryData = [['Course Type', 'Total Students', 'Total Fee Allotted', 'To Government', 'To SVK Management', 'To SMP']];
    document.querySelectorAll('#feeDistributionSummaryTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map((cell, index) => {
                const textContent = cell.textContent.replace(/₹|,/g, '').trim();
                // Convert numerical columns to numbers (columns 1+ are numerical)
                return index === 0 ? textContent : (isNaN(textContent) ? textContent : Number(textContent));
            });
            summaryData.push(rowData);
        }
    });
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Distribution Summary');
    
    // Aided Courses Sheet
    const aidedData = [['Sl No', 'Fee Type', 'Students Count', 'Fee Amount', 'Total Collected', 'To Govt', 'To SVK', 'To SMP']];
    document.querySelectorAll('#feeDistributionAidedTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map((cell, index) => {
                const textContent = cell.textContent.replace(/₹|,/g, '').trim();
                // Convert numerical columns to numbers (column 0 is Sl No, column 1 is Fee Type text, rest are numerical)
                if (index === 1) return textContent; // Fee Type remains text
                return isNaN(textContent) ? textContent : Number(textContent);
            });
            aidedData.push(rowData);
        }
    });
    const aidedSheet = XLSX.utils.aoa_to_sheet(aidedData);
    XLSX.utils.book_append_sheet(workbook, aidedSheet, 'Aided Courses');
    
    // Unaided Course Sheet
    const unaidedData = [['Sl No', 'Fee Type', 'Students Count', 'Fee Amount', 'Total Collected', 'To Govt', 'To SVK', 'To SMP']];
    document.querySelectorAll('#feeDistributionUnaidedTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map((cell, index) => {
                const textContent = cell.textContent.replace(/₹|,/g, '').trim();
                // Convert numerical columns to numbers (column 0 is Sl No, column 1 is Fee Type text, rest are numerical)
                if (index === 1) return textContent; // Fee Type remains text
                return isNaN(textContent) ? textContent : Number(textContent);
            });
            unaidedData.push(rowData);
        }
    });
    const unaidedSheet = XLSX.utils.aoa_to_sheet(unaidedData);
    XLSX.utils.book_append_sheet(workbook, unaidedSheet, 'Unaided Course');
    
    XLSX.writeFile(workbook, `SMP_Fee_Distribution_${timestamp}.xlsx`);
}

function saveFeeDistributionToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4
    
    // Title
    doc.setFontSize(16);
    doc.text('SMP Fee Distribution Report', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Academic Year: 2025-26 | Generated: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    
    let yPosition = 35;
    
    // Student Statistics Table
    doc.setFontSize(14);
    doc.text('Student Statistics Summary', 15, yPosition);
    yPosition += 5;
    
    doc.autoTable({
        html: '#feeDistributionStudentStatsTable',
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 }
    });
    
    // Add new page for distribution tables
    doc.addPage();
    yPosition = 15;
    
    // Distribution Summary
    doc.setFontSize(14);
    doc.text('Fee Distribution Summary', 15, yPosition);
    yPosition += 5;
    
    doc.autoTable({
        html: '#feeDistributionSummaryTable',
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
    
    // Aided Courses Table
    doc.setFontSize(14);
    doc.text('Aided Courses Distribution', 15, yPosition);
    yPosition += 5;
    
    doc.autoTable({
        html: '#feeDistributionAidedTable',
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 }
    });
    
    // Add new page for unaided
    doc.addPage();
    yPosition = 15;
    
    // Unaided Course Table
    doc.setFontSize(14);
    doc.text('Unaided Course Distribution', 15, yPosition);
    yPosition += 5;
    
    doc.autoTable({
        html: '#feeDistributionUnaidedTable',
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [142, 68, 173], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 }
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`SMP_Fee_Distribution_${timestamp}.pdf`);
}

function exportFeeDistributionStudentStatsToExcel() {
    const timestamp = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();
    
    const statsData = [['Sl No', 'Courses', '1st Yr Regular', '1st Yr SNQ', '1st Yr Total', '2nd Yr Regular', '2nd Yr Lateral', '2nd Yr SNQ', '2nd Yr Total', '3rd Yr Regular', '3rd Yr SNQ', '3rd Yr Total', 'Grand Total']];
    document.querySelectorAll('#feeDistributionStudentStatsTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map((cell, index) => {
                const textContent = cell.textContent.trim();
                // Convert numerical columns to numbers (column 0 is course name, rest are numbers)
                return index === 0 ? textContent : (isNaN(textContent) ? textContent : Number(textContent));
            });
            statsData.push(rowData);
        }
    });
    
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Student Statistics');
    
    XLSX.writeFile(workbook, `SMP_Student_Statistics_${timestamp}.xlsx`);
}

function exportFeeDistributionStudentStatsToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(16);
    doc.text('SMP Student Statistics Summary', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Academic Year: 2025-26 | Generated: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    
    doc.autoTable({
        html: '#feeDistributionStudentStatsTable',
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`SMP_Student_Statistics_${timestamp}.pdf`);
}

function exportFeeDistributionSummaryToExcel() {
    const timestamp = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();
    
    const summaryData = [['Course Type', 'Total Students', 'Total Fee Allotted', 'To Government', 'To SVK Management', 'To SMP']];
    document.querySelectorAll('#feeDistributionSummaryTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map((cell, index) => {
                const textContent = cell.textContent.replace(/₹|,/g, '').trim();
                // Convert numerical columns to numbers (columns 1+ are numerical)
                return index === 0 ? textContent : (isNaN(textContent) ? textContent : Number(textContent));
            });
            summaryData.push(rowData);
        }
    });
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Distribution Summary');
    
    XLSX.writeFile(workbook, `SMP_Distribution_Summary_${timestamp}.xlsx`);
}

function exportFeeDistributionSummaryToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(16);
    doc.text('SMP Fee Distribution Summary', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Academic Year: 2025-26 | Generated: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    
    doc.autoTable({
        html: '#feeDistributionSummaryTable',
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 12 },
        bodyStyles: { fontSize: 10 },
        margin: { left: 15, right: 15 }
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`SMP_Distribution_Summary_${timestamp}.pdf`);
}

function exportFeeDistributionAidedToExcel() {
    const timestamp = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();
    
    const aidedData = [['Sl No', 'Fee Type', 'Students Count', 'Fee Amount', 'Total Collected', 'To Govt', 'To SVK', 'To SMP']];
    document.querySelectorAll('#feeDistributionAidedTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map((cell, index) => {
                const textContent = cell.textContent.replace(/₹|,/g, '').trim();
                // Convert numerical columns to numbers (column 0 is Sl No, column 1 is Fee Type text, rest are numerical)
                if (index === 1) return textContent; // Fee Type remains text
                return isNaN(textContent) ? textContent : Number(textContent);
            });
            aidedData.push(rowData);
        }
    });
    
    const aidedSheet = XLSX.utils.aoa_to_sheet(aidedData);
    XLSX.utils.book_append_sheet(workbook, aidedSheet, 'Aided Courses');
    
    XLSX.writeFile(workbook, `SMP_Aided_Courses_Distribution_${timestamp}.xlsx`);
}

function exportFeeDistributionAidedToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(16);
    doc.text('SMP Aided Courses Fee Distribution', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Courses: CE, ME, EC, CS | Academic Year: 2025-26`, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    
    doc.autoTable({
        html: '#feeDistributionAidedTable',
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`SMP_Aided_Courses_Distribution_${timestamp}.pdf`);
}

function exportFeeDistributionUnaidedToExcel() {
    const timestamp = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();
    
    const unaidedData = [['Sl No', 'Fee Type', 'Students Count', 'Fee Amount', 'Total Collected', 'To Govt', 'To SVK', 'To SMP']];
    document.querySelectorAll('#feeDistributionUnaidedTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map((cell, index) => {
                const textContent = cell.textContent.replace(/₹|,/g, '').trim();
                // Convert numerical columns to numbers (column 0 is Sl No, column 1 is Fee Type text, rest are numerical)
                if (index === 1) return textContent; // Fee Type remains text
                return isNaN(textContent) ? textContent : Number(textContent);
            });
            unaidedData.push(rowData);
        }
    });
    
    const unaidedSheet = XLSX.utils.aoa_to_sheet(unaidedData);
    XLSX.utils.book_append_sheet(workbook, unaidedSheet, 'Unaided Course');
    
    XLSX.writeFile(workbook, `SMP_Unaided_Course_Distribution_${timestamp}.xlsx`);
}

function exportFeeDistributionUnaidedToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(16);
    doc.text('SMP Unaided Course Fee Distribution', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Course: EE (Electrical Engineering) | Academic Year: 2025-26`, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    
    doc.autoTable({
        html: '#feeDistributionUnaidedTable',
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [142, 68, 173], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`SMP_Unaided_Course_Distribution_${timestamp}.pdf`);
}

// Export Combined Fee Distribution to Excel
function exportFeeDistributionCombinedToExcel() {
    const timestamp = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();
    
    const combinedData = [['Sl No', 'Course Type', 'Fee Type', 'Students Count', 'Fee Amount', 'Total Collected', 'To Govt', 'To SVK', 'To SMP']];
    document.querySelectorAll('#feeDistributionCombinedTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map((cell, index) => {
                const textContent = cell.textContent.replace(/₹|,/g, '').trim();
                // Convert numerical columns to numbers (columns 0,1,2 have text/mixed content, rest are numerical)
                if (index === 1 || index === 2) return textContent; // Course Type and Fee Type remain text
                if (index === 0 && textContent === 'GRAND TOTAL') return textContent; // Keep GRAND TOTAL as text
                return isNaN(textContent) ? textContent : Number(textContent);
            });
            combinedData.push(rowData);
        }
    });
    
    const combinedSheet = XLSX.utils.aoa_to_sheet(combinedData);
    XLSX.utils.book_append_sheet(workbook, combinedSheet, 'Combined Distribution');
    
    XLSX.writeFile(workbook, `SMP_Combined_Fee_Distribution_${timestamp}.xlsx`);
}

// Export Combined Fee Distribution to PDF
function exportFeeDistributionCombinedToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(16);
    doc.text('SMP Combined Fee Remittance Abstract Table', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Aided & Unaided Courses | Academic Year: 2025-26', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    
    doc.autoTable({
        html: '#feeDistributionCombinedTable',
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 10, right: 10 },
        didParseCell: function (data) {
            // Style aided rows with light green background
            if (data.row.index > 0 && data.row.raw[1] && data.row.raw[1].textContent === 'Aided') {
                data.cell.styles.fillColor = [39, 174, 96, 0.1];
            }
            // Style unaided rows with light purple background
            else if (data.row.index > 0 && data.row.raw[1] && data.row.raw[1].textContent === 'Unaided') {
                data.cell.styles.fillColor = [142, 68, 173, 0.1];
            }
            // Style grand total row
            else if (data.row.index > 0 && data.row.raw[0] && data.row.raw[0].textContent === 'GRAND TOTAL') {
                data.cell.styles.fillColor = [52, 73, 94];
                data.cell.styles.textColor = 255;
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`SMP_Combined_Fee_Distribution_${timestamp}.pdf`);
}

// This wrapper was merged into the main showSection function above

// Add event listeners for exam fee filters
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (document.getElementById('examFeeCourseFilter')) {
            document.getElementById('examFeeCourseFilter').addEventListener('change', applyExamFeeFilters);
            document.getElementById('examFeeYearFilter').addEventListener('change', applyExamFeeFilters);
            document.getElementById('examFeeAdmTypeFilter').addEventListener('change', applyExamFeeFilters);
            document.getElementById('examFeeStatusFilter').addEventListener('change', applyExamFeeFilters);
            document.getElementById('examFeeNameFilter').addEventListener('input', applyExamFeeFilters);
            
            // Add Enter key listener for exam fee amount dialog
            document.getElementById('examFeeAmount').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    saveExamFeeAmount();
                }
            });
            
            // Close dialog when clicking outside
            document.getElementById('examFeeDialog').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeExamFeeDialog();
                }
            });
        }
        
        // Add event listeners for fee distribution filters
        if (document.getElementById('feeDistributionCourseTypeFilter')) {
            document.getElementById('feeDistributionCourseTypeFilter').addEventListener('change', applyFeeDistributionFilters);
            document.getElementById('feeDistributionYearFilter').addEventListener('change', applyFeeDistributionFilters);
            document.getElementById('feeDistributionCourseFilter').addEventListener('change', applyFeeDistributionFilters);
            document.getElementById('feeDistributionAdmTypeFilter').addEventListener('change', applyFeeDistributionFilters);
            document.getElementById('feeDistributionTableFilter').addEventListener('change', showHideFeeDistributionTables);
        }
    }, 1000);
});