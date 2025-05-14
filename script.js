// SchoolConnect Bulk Messaging System - JavaScript with actual API integration

// Global variables
let contacts = [];
let selectedContactIds = new Set();
let messageHistory = [];
let currentPage = 1;
const contactsPerPage = 10;
let currentChannel = 'whatsapp';

// Simple UUID generator function
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Tab navigation
    setupTabNavigation();
    
    // Settings sub-tabs
    setupSettingsTabs();
    
    // Setup file import functionality
    setupFileImport();
    
    // Setup contact table functionality
    setupContactTable();
    
    // Setup message composer functionality
    setupMessageComposer();
    
    // Setup forms
    setupForms();
    
    // Load saved data from localStorage if available
    loadSavedData();
});

// Tab navigation setup
function setupTabNavigation() {
    const tabs = {
        'sendTab': 'sendTabContent',
        'historyTab': 'historyTabContent',
        'settingsTab': 'settingsTabContent'
    };
    
    Object.keys(tabs).forEach(tabId => {
        document.getElementById(tabId).addEventListener('click', function(e) {
            e.preventDefault();
            
            // Hide all tab contents
            Object.values(tabs).forEach(contentId => {
                document.getElementById(contentId).classList.add('hidden');
            });
            
            // Show selected tab content
            document.getElementById(tabs[tabId]).classList.remove('hidden');
            
            // Update active tab styling
            Object.keys(tabs).forEach(id => {
                const tab = document.getElementById(id);
                if (id === tabId) {
                    tab.classList.add('border-blue-500', 'text-blue-600');
                    tab.classList.remove('border-transparent', 'text-gray-500');
                } else {
                    tab.classList.remove('border-blue-500', 'text-blue-600');
                    tab.classList.add('border-transparent', 'text-gray-500');
                }
            });
        });
    });
    
    // Navbar settings button also navigates to settings tab
    document.getElementById('settingsBtn').addEventListener('click', function() {
        document.getElementById('settingsTab').click();
    });
}

// Settings tabs setup
function setupSettingsTabs() {
    const whatsappTabBtn = document.getElementById('whatsappTabBtn');
    const smsTabBtn = document.getElementById('smsTabBtn');
    const whatsappContent = document.getElementById('whatsappSettingsContent');
    const smsContent = document.getElementById('smsSettingsContent');
    
    whatsappTabBtn.addEventListener('click', function() {
        whatsappContent.classList.remove('hidden');
        smsContent.classList.add('hidden');
        whatsappTabBtn.classList.add('text-blue-600', 'border-blue-600');
        whatsappTabBtn.classList.remove('text-gray-500', 'border-transparent');
        smsTabBtn.classList.add('text-gray-500', 'border-transparent');
        smsTabBtn.classList.remove('text-blue-600', 'border-blue-600');
    });
    
    smsTabBtn.addEventListener('click', function() {
        smsContent.classList.remove('hidden');
        whatsappContent.classList.add('hidden');
        smsTabBtn.classList.add('text-blue-600', 'border-blue-600');
        smsTabBtn.classList.remove('text-gray-500', 'border-transparent');
        whatsappTabBtn.classList.add('text-gray-500', 'border-transparent');
        whatsappTabBtn.classList.remove('text-blue-600', 'border-blue-600');
    });
}

// File import setup
function setupFileImport() {
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const channelRadios = document.querySelectorAll('input[name="channel"]');
    
    // Channel selection
    channelRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            currentChannel = this.value;
        });
    });
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        if (this.files.length > 0) {
            handleFileUpload(this.files[0]);
        }
    });
    
    // Drag and drop
    dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // Click on dropzone
    dropzone.addEventListener('click', function() {
        fileInput.click();
    });
}

// Handle file upload
function handleFileUpload(file) {
    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
        showToast('Invalid file type', 'Please upload an Excel or CSV file', 'error');
        return;
    }
    
    // Show loading state
    const dropzone = document.getElementById('dropzone');
    dropzone.innerHTML = `
        <div class="space-y-1 text-center">
            <div class="animate-spin rounded-full h-10 w-10 border-2 border-t-blue-500 border-gray-300 mx-auto"></div>
            <p class="text-sm text-gray-600">Processing file...</p>
        </div>
    `;
    
    // Read the file
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Process contacts
            processContacts(jsonData);
            
            // Reset dropzone
            resetDropzone();
            
            // Show success message
            showToast('Success', `Imported ${contacts.length} contacts from ${file.name}`, 'success');
        } catch (error) {
            console.error('Error processing file:', error);
            showToast('Error', 'Failed to process Excel file', 'error');
            resetDropzone();
        }
    };
    
    reader.onerror = function() {
        showToast('Error', 'Failed to read file', 'error');
        resetDropzone();
    };
    
    reader.readAsBinaryString(file);
}

// Reset dropzone to initial state
function resetDropzone() {
    const dropzone = document.getElementById('dropzone');
    dropzone.innerHTML = `
        <div class="space-y-1 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polygon points="10 9 9 9 8 9"></polygon>
            </svg>
            <div class="flex text-sm text-gray-600">
                <label class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input id="fileInput" type="file" class="sr-only" accept=".xlsx,.xls,.csv">
                </label>
                <p class="pl-1">or drag and drop</p>
            </div>
            <p class="text-xs text-gray-500">Excel or CSV files only</p>
        </div>
    `;
    
    // Re-bind file input event
    document.getElementById('fileInput').addEventListener('change', function(e) {
        if (this.files.length > 0) {
            handleFileUpload(this.files[0]);
        }
    });
}

// Process contact data from Excel file
function processContacts(jsonData) {
    if (jsonData.length === 0) {
        showToast('Error', 'The Excel file contains no data', 'error');
        return;
    }
    
    // Clear existing contacts
    contacts = [];
    selectedContactIds.clear();
    
    // Process each row to extract contacts
    contacts = jsonData.map((row, index) => {
        // Try to identify columns by name
        let phoneNumber = '';
        let name = '';
        let additionalInfo = '';
        
        // Search through columns
        for (const key in row) {
            const keyLower = key.toLowerCase();
            
            // Phone number column
            if (
                keyLower.includes('phone') || 
                keyLower.includes('mobile') || 
                keyLower.includes('cell') ||
                keyLower.includes('contact') ||
                keyLower.includes('number')
            ) {
                phoneNumber = String(row[key]);
            } 
            // Name column
            else if (
                keyLower.includes('name') ||
                keyLower === 'full name' ||
                keyLower === 'firstname' ||
                keyLower === 'lastname'
            ) {
                name = String(row[key]);
            } 
            // Additional info
            else if (
                keyLower.includes('role') ||
                keyLower.includes('relation') ||
                keyLower.includes('position') ||
                keyLower.includes('class') ||
                keyLower.includes('grade')
            ) {
                additionalInfo = String(row[key]);
            }
        }
        
        // If no name column found, use generic name
        if (!name) {
            name = `Contact #${index + 1}`;
        }
        
        // Validate and format phone number
        const isValid = validatePhoneNumber(phoneNumber);
        const formattedPhone = isValid ? formatPhoneNumber(phoneNumber) : phoneNumber;
        
        // Create contact object
        const contact = {
            id: uuidv4(),
            name,
            phoneNumber: formattedPhone,
            additionalInfo,
            isValid
        };
        
        // Add valid contacts to selected by default
        if (isValid) {
            selectedContactIds.add(contact.id);
        }
        
        return contact;
    });
    
    // Update UI
    renderContactTable();
    updateContactCount();
    
    // Save to localStorage
    saveContactsToLocalStorage();
}

// Validate phone number
function validatePhoneNumber(phoneNumber) {
    // Strip all non-numeric characters
    const stripped = phoneNumber.replace(/\D/g, '');
    
    // Basic phone number validation: must be 10-15 digits
    return /^\d{10,15}$/.test(stripped);
}

// Format phone number to international format
function formatPhoneNumber(phoneNumber) {
    // Strip all non-numeric characters
    const stripped = phoneNumber.replace(/\D/g, '');
    
    // If number doesn't start with +, add it
    return stripped.startsWith('+') ? stripped : `+${stripped}`;
}

// Setup contact table functionality
function setupContactTable() {
    const searchInput = document.getElementById('searchInput');
    const selectAllCheckbox = document.getElementById('selectAll');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        renderContactTable();
    });
    
    // Select all functionality
    selectAllCheckbox.addEventListener('change', function() {
        const filteredContacts = getFilteredContacts();
        
        if (this.checked) {
            // Select all valid contacts
            filteredContacts.forEach(contact => {
                if (contact.isValid) {
                    selectedContactIds.add(contact.id);
                }
            });
        } else {
            // Deselect all contacts
            filteredContacts.forEach(contact => {
                selectedContactIds.delete(contact.id);
            });
        }
        
        renderContactTable();
        updateContactCount();
    });
    
    // Pagination buttons
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderContactTable();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        const filteredContacts = getFilteredContacts();
        const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
        
        if (currentPage < totalPages) {
            currentPage++;
            renderContactTable();
        }
    });
}

// Get filtered contacts based on search query
function getFilteredContacts() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchQuery) {
        return contacts;
    }
    
    return contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery) || 
        contact.phoneNumber.includes(searchQuery) ||
        (contact.additionalInfo && contact.additionalInfo.toLowerCase().includes(searchQuery))
    );
}

// Render contact table
function renderContactTable() {
    const filteredContacts = getFilteredContacts();
    const emptyContactsMessage = document.getElementById('emptyContactsMessage');
    const contactTableContent = document.getElementById('contactTableContent');
    const contactsTableBody = document.getElementById('contactsTableBody');
    
    // Show/hide empty state
    if (contacts.length === 0) {
        emptyContactsMessage.classList.remove('hidden');
        contactTableContent.classList.add('hidden');
        return;
    } else {
        emptyContactsMessage.classList.add('hidden');
        contactTableContent.classList.remove('hidden');
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
    const startIndex = (currentPage - 1) * contactsPerPage;
    const paginatedContacts = filteredContacts.slice(startIndex, startIndex + contactsPerPage);
    
    // Update pagination info
    document.getElementById('paginationInfo').innerHTML = `
        Showing <span class="font-medium">${startIndex + 1}</span> to 
        <span class="font-medium">${Math.min(startIndex + contactsPerPage, filteredContacts.length)}</span> of 
        <span class="font-medium">${filteredContacts.length}</span> results
    `;
    
    // Enable/disable pagination buttons
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    
    // Select all checkbox state
    const validFilteredContacts = filteredContacts.filter(c => c.isValid);
    const allSelected = validFilteredContacts.length > 0 && 
                        validFilteredContacts.every(c => selectedContactIds.has(c.id));
    const someSelected = !allSelected && filteredContacts.some(c => selectedContactIds.has(c.id));
    
    document.getElementById('selectAll').checked = allSelected;
    // Set indeterminate state if needed (visual only)
    document.getElementById('selectAll').indeterminate = someSelected;
    
    // Render table rows
    contactsTableBody.innerHTML = '';
    
    paginatedContacts.forEach(contact => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" class="contact-checkbox h-4 w-4 text-blue-600 rounded"
                    data-id="${contact.id}" ${selectedContactIds.has(contact.id) ? 'checked' : ''} 
                    ${!contact.isValid ? 'disabled' : ''}>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${contact.name}</div>
                ${contact.additionalInfo ? `<div class="text-xs text-gray-500">${contact.additionalInfo}</div>` : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${contact.phoneNumber}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="badge ${contact.isValid ? 'badge-valid' : 'badge-invalid'}">
                    ${contact.isValid ? 'Valid' : 'Invalid'}
                </span>
            </td>
        `;
        
        contactsTableBody.appendChild(row);
    });
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const contactId = this.getAttribute('data-id');
            
            if (this.checked) {
                selectedContactIds.add(contactId);
            } else {
                selectedContactIds.delete(contactId);
            }
            
            updateContactCount();
        });
    });
}

// Update contact count display
function updateContactCount() {
    document.getElementById('selectedCount').textContent = `${selectedContactIds.size}/${contacts.length} selected`;
    document.getElementById('recipientCount').textContent = `${selectedContactIds.size} recipients selected`;
    
    // Enable/disable send button based on selection
    document.getElementById('sendMessageBtn').disabled = 
        selectedContactIds.size === 0 || document.getElementById('messageInput').value.trim() === '';
}

// Setup message composer functionality
function setupMessageComposer() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    
    // Character counter
    messageInput.addEventListener('input', function() {
        const count = this.value.length;
        const maxChars = 160;
        
        // Update character count
        charCount.textContent = `${count}/${maxChars} characters`;
        
        // Change color when approaching limit
        if (count > maxChars * 0.9) {
            charCount.classList.add('text-red-500');
            charCount.classList.remove('text-gray-500');
        } else {
            charCount.classList.remove('text-red-500');
            charCount.classList.add('text-gray-500');
        }
        
        // Enable/disable send button
        sendMessageBtn.disabled = count === 0 || selectedContactIds.size === 0;
    });
    
    // Send message button
    sendMessageBtn.addEventListener('click', function() {
        if (this.disabled) return;
        
        const message = messageInput.value.trim();
        if (!message) {
            showToast('Empty message', 'Please enter a message before sending.', 'error');
            return;
        }
        
        if (selectedContactIds.size === 0) {
            showToast('No recipients', 'Please select at least one recipient.', 'error');
            return;
        }
        
        // Send message using the appropriate channel
        if (currentChannel === 'whatsapp') {
            sendWhatsAppMessage(message);
        } else {
            sendSMSMessage(message);
        }
    });
    
    // Save draft button
    saveDraftBtn.addEventListener('click', function() {
        const message = messageInput.value.trim();
        if (!message) {
            showToast('Empty draft', 'Please enter a message to save as draft.', 'info');
            return;
        }
        
        // Save draft to localStorage
        localStorage.setItem('messageDraft', message);
        showToast('Draft saved', 'Your message draft has been saved.', 'success');
    });
    
    // Add template button
    document.getElementById('addTemplateBtn').addEventListener('click', function() {
        // Simple template insertion
        messageInput.value = "Dear parent,\n\nThis is to inform you about the upcoming parent-teacher meeting scheduled for [DATE] at [TIME].\n\nRegards,\nSchool Administration";
        messageInput.dispatchEvent(new Event('input'));
    });
}

// Send WhatsApp message via WhatsApp Business API
async function sendWhatsAppMessage(message) {
    // Show loading state
    const sendBtn = document.getElementById('sendMessageBtn');
    const originalBtnContent = sendBtn.innerHTML;
    sendBtn.innerHTML = `
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-white border-opacity-50 mr-2"></div>
        Sending...
    `;
    sendBtn.disabled = true;
    
    // Get selected contact details
    const selectedContacts = contacts.filter(contact => selectedContactIds.has(contact.id));
    
    // Create message history entry
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Get WhatsApp credentials from localStorage
    const whatsappCreds = JSON.parse(localStorage.getItem('whatsappCredentials'));
    
    if (!whatsappCreds || !whatsappCreds.apiKey || !whatsappCreds.phoneNumberId) {
        showToast('Missing credentials', 'Please configure WhatsApp credentials in Settings tab first.', 'error');
        sendBtn.innerHTML = originalBtnContent;
        sendBtn.disabled = false;
        return;
    }
    
    // Create status array to track each message status
    const statuses = [];
    let failedCount = 0;
    
    // Send message to each recipient
    try {
        for (const contact of selectedContacts) {
            try {
                // WhatsApp Business API request
                const response = await fetch('https://graph.facebook.com/v16.0/' + whatsappCreds.phoneNumberId + '/messages', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + whatsappCreds.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: contact.phoneNumber,
                        type: 'text',
                        text: {
                            body: message
                        }
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    statuses.push({
                        id: uuidv4(),
                        contactId: contact.id,
                        status: 'sent',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    statuses.push({
                        id: uuidv4(),
                        contactId: contact.id,
                        status: 'failed',
                        timestamp: new Date().toISOString(),
                        error: result.error?.message || 'Unknown error'
                    });
                    failedCount++;
                }
            } catch (error) {
                statuses.push({
                    id: uuidv4(),
                    contactId: contact.id,
                    status: 'failed',
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
                failedCount++;
            }
            
            // Add a small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Create message history entry
        const newMessage = {
            id: messageId,
            content: message,
            timestamp: timestamp,
            channel: 'whatsapp',
            recipients: selectedContacts.map(c => c.id),
            status: statuses
        };
        
        // Add to history
        messageHistory.unshift(newMessage);
        
        // Save to localStorage
        saveMessageHistoryToLocalStorage();
        
        // Reset form
        document.getElementById('messageInput').value = '';
        document.getElementById('messageInput').dispatchEvent(new Event('input'));
        
        // Reset button
        sendBtn.innerHTML = originalBtnContent;
        sendBtn.disabled = false;
        
        // Show success/partial success message
        if (failedCount === 0) {
            showToast('Messages sent!', `Your WhatsApp message has been sent to all ${selectedContacts.length} recipients.`, 'success');
        } else if (failedCount < selectedContacts.length) {
            showToast('Partially sent', `Message sent to ${selectedContacts.length - failedCount} recipients. ${failedCount} failed.`, 'info');
        } else {
            showToast('Failed to send', 'Could not send messages. Check credentials and try again.', 'error');
        }
        
        // Update message history display if visible
        renderMessageHistory();
        
    } catch (error) {
        console.error('Error sending WhatsApp messages:', error);
        sendBtn.innerHTML = originalBtnContent;
        sendBtn.disabled = false;
        showToast('Error', 'Failed to send WhatsApp messages: ' + error.message, 'error');
    }
}

// Send SMS message via Twilio API
async function sendSMSMessage(message) {
    // Show loading state
    const sendBtn = document.getElementById('sendMessageBtn');
    const originalBtnContent = sendBtn.innerHTML;
    sendBtn.innerHTML = `
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-white border-opacity-50 mr-2"></div>
        Sending...
    `;
    sendBtn.disabled = true;
    
    // Get selected contact details
    const selectedContacts = contacts.filter(contact => selectedContactIds.has(contact.id));
    
    // Create message history entry
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Get SMS credentials from localStorage
    let smsCreds;
    try {
        smsCreds = JSON.parse(localStorage.getItem('smsCredentials'));
    } catch (error) {
        console.error('Error parsing SMS credentials:', error);
        smsCreds = null;
    }
    
    if (!smsCreds || !smsCreds.accountSid || !smsCreds.authToken || !smsCreds.phoneNumber) {
        showToast('Missing credentials', 'Please configure SMS credentials in Settings tab first.', 'error');
        sendBtn.innerHTML = originalBtnContent;
        sendBtn.disabled = false;
        return;
    }
    
    // Create status array to track each message status
    const statuses = [];
    let failedCount = 0;
    
    // Send message to each recipient
    try {
        for (const contact of selectedContacts) {
            try {
                // Use our server proxy API instead of calling Twilio directly
                // This avoids CORS issues in the browser
                
                // Ensure phone numbers are in E.164 format (e.g., +1234567890)
                const toNumber = contact.phoneNumber.startsWith('+') 
                    ? contact.phoneNumber 
                    : `+${contact.phoneNumber.replace(/\D/g, '')}`;
                    
                const fromNumber = smsCreds.phoneNumber.startsWith('+') 
                    ? smsCreds.phoneNumber 
                    : `+${smsCreds.phoneNumber.replace(/\D/g, '')}`;

                // Log request for debugging
                console.log('Sending SMS to:', toNumber, 'from:', fromNumber);
                
                // Get the base URL of the server (works in both local and Replit environments)
                let baseUrl;
                if (window.location.hostname.includes('replit.dev') || 
                    window.location.hostname.includes('replit.app')) {
                    // When running in Replit
                    baseUrl = window.location.origin;
                } else if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
                    // When running locally
                    baseUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
                } else {
                    // Default case for other environments
                    baseUrl = window.location.origin;
                }
                               
                console.log('Using API base URL:', baseUrl);
                
                // Use our proxy endpoint with the full URL
                const response = await fetch(`${baseUrl}/api/twilio/send-sms`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        to: toNumber,
                        // Use messagingServiceSid if available, otherwise use from number
                        ...(smsCreds.messagingServiceSid ? { messagingServiceSid: smsCreds.messagingServiceSid } : { from: fromNumber }),
                        body: message,
                        accountSid: smsCreds.accountSid,
                        authToken: smsCreds.authToken
                    })
                });
                
                // Log the response status for debugging
                console.log('Proxy API response status:', response.status);
                
                // Parse response with error handling
                let result;
                try {
                    result = await response.json();
                    console.log('Twilio API response:', result);
                } catch (parseError) {
                    console.error('Error parsing Twilio API response:', parseError);
                    result = { message: 'Invalid response from Twilio API' };
                }
                
                if (response.ok) {
                    statuses.push({
                        id: uuidv4(),
                        contactId: contact.id,
                        status: 'sent',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    // Extract detailed error information from Twilio
                    let errorMessage = 'Unknown error';
                    if (result) {
                        if (result.message) {
                            errorMessage = result.message;
                        } else if (result.error_message) {
                            errorMessage = result.error_message;
                        } else if (result.code) {
                            errorMessage = `Error code: ${result.code}`;
                        } else if (result.more_info) {
                            errorMessage = `See: ${result.more_info}`;
                        }
                    }
                    
                    console.error('Twilio error details:', result);
                    
                    statuses.push({
                        id: uuidv4(),
                        contactId: contact.id,
                        status: 'failed',
                        timestamp: new Date().toISOString(),
                        error: errorMessage
                    });
                    failedCount++;
                }
            } catch (error) {
                statuses.push({
                    id: uuidv4(),
                    contactId: contact.id,
                    status: 'failed',
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
                failedCount++;
            }
            
            // Add a small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Create message history entry
        const newMessage = {
            id: messageId,
            content: message,
            timestamp: timestamp,
            channel: 'sms',
            recipients: selectedContacts.map(c => c.id),
            status: statuses
        };
        
        // Add to history
        messageHistory.unshift(newMessage);
        
        // Save to localStorage
        saveMessageHistoryToLocalStorage();
        
        // Reset form
        document.getElementById('messageInput').value = '';
        document.getElementById('messageInput').dispatchEvent(new Event('input'));
        
        // Reset button
        sendBtn.innerHTML = originalBtnContent;
        sendBtn.disabled = false;
        
        // Show success/partial success message
        if (failedCount === 0) {
            showToast('Messages sent!', `Your SMS message has been sent to all ${selectedContacts.length} recipients.`, 'success');
        } else if (failedCount < selectedContacts.length) {
            showToast('Partially sent', `Message sent to ${selectedContacts.length - failedCount} recipients. ${failedCount} failed.`, 'info');
        } else {
            showToast('Failed to send', 'Could not send messages. Check credentials and try again.', 'error');
        }
        
        // Update message history display if visible
        try {
            renderMessageHistory();
        } catch (error) {
            console.error('Error rendering message history:', error);
        }
        
    } catch (error) {
        console.error('Error sending SMS messages:', error);
        sendBtn.innerHTML = originalBtnContent;
        sendBtn.disabled = false;
        showToast('Error', 'Failed to send SMS messages: ' + error.message, 'error');
    }
}

// Render message history
function renderMessageHistory() {
    try {
        const emptyHistoryMessage = document.getElementById('emptyHistoryMessage');
        const historyTable = document.getElementById('historyTable');
        const historyTableBody = document.getElementById('historyTableBody');
        
        // Safety check for DOM elements
        if (!emptyHistoryMessage || !historyTable || !historyTableBody) {
            console.error('Missing DOM elements for message history');
            return;
        }
        
        // Safety check for message history
        if (!Array.isArray(messageHistory)) {
            console.error('Message history is not an array');
            messageHistory = [];
        }
        
        // Filter by search query
        const searchQuery = document.getElementById('searchMessages')?.value?.toLowerCase() || '';
        const filteredHistory = messageHistory.filter(msg => {
            try {
                // Ensure content is a string
                const content = typeof msg.content === 'string' ? msg.content : '';
                return !searchQuery || content.toLowerCase().includes(searchQuery);
            } catch (e) {
                return false;
            }
        });
        
        // Show/hide empty state
        if (filteredHistory.length === 0) {
            emptyHistoryMessage.classList.remove('hidden');
            historyTable.classList.add('hidden');
            return;
        } else {
            emptyHistoryMessage.classList.add('hidden');
            historyTable.classList.remove('hidden');
        }
        
        // Render table rows
        historyTableBody.innerHTML = '';
        
        filteredHistory.forEach(message => {
            try {
                const row = document.createElement('tr');
                
                // Format date - with error handling
                let formattedDate = 'Unknown date';
                try {
                    if (message.timestamp) {
                        const date = new Date(message.timestamp);
                        formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                    }
                } catch (e) {
                    console.error('Error formatting date:', e);
                }
                
                // Truncate message if too long - with error handling
                let truncatedMessage = 'No message content';
                try {
                    if (typeof message.content === 'string') {
                        truncatedMessage = message.content.length > 50 
                            ? `${message.content.substring(0, 50)}...` 
                            : message.content;
                    }
                } catch (e) {
                    console.error('Error truncating message:', e);
                }
                
                // Safely pass status to the overall status calculator
                let overallStatus = 'sent';
                try {
                    // Ensure status is an array before passing to calculateOverallStatus
                    if (message.status && Array.isArray(message.status)) {
                        overallStatus = calculateOverallStatus(message.status);
                    }
                } catch (e) {
                    console.error('Error calculating status:', e);
                }
                
                // Get recipient count safely
                let recipientCount = 0;
                try {
                    if (message.recipients && Array.isArray(message.recipients)) {
                        recipientCount = message.recipients.length;
                    }
                } catch (e) {
                    console.error('Error getting recipient count:', e);
                }
                
                // Determine channel with fallback
                let channel = message.channel || 'sms';
                
                // Set row HTML with all the safe data
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formattedDate}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${truncatedMessage}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${recipientCount}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="badge badge-${channel}">
                            ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="badge badge-${overallStatus}">
                            <span class="status-dot status-dot-${
                                overallStatus === 'delivered' ? 'green' : 
                                overallStatus === 'sent' ? 'yellow' : 'red'
                            }"></span>
                            ${overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
                        </span>
                    </td>
                `;
                
                historyTableBody.appendChild(row);
            } catch (error) {
                console.error('Error rendering message row:', error);
            }
        });
    } catch (error) {
        console.error('Error rendering message history:', error);
    }
}

// Calculate overall status for a message
function calculateOverallStatus(statuses) {
    // Guard against non-array or undefined statuses
    if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
        return 'sent'; // Default status if no status information is available
    }
    
    const statusCounts = {
        delivered: 0,
        sent: 0,
        queued: 0,
        failed: 0
    };
    
    // Iterate through statuses
    for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        if (status && status.status && status.status in statusCounts) {
            statusCounts[status.status]++;
        }
    }
    
    if (statusCounts.failed > 0 && statusCounts.failed === statuses.length) {
        return 'failed';
    }
    
    if (statusCounts.delivered === statuses.length) {
        return 'delivered';
    }
    
    return 'sent';
}

// Setup form submissions
function setupForms() {
    // WhatsApp form
    document.getElementById('whatsappForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const accountName = document.getElementById('whatsappName').value.trim();
        const apiKey = document.getElementById('whatsappApiKey').value.trim();
        const phoneNumberId = document.getElementById('whatsappPhoneId').value.trim();
        
        if (!accountName || !apiKey || !phoneNumberId) {
            showToast('Missing fields', 'Please fill in all the required fields.', 'error');
            return;
        }
        
        // Test the credentials by making a test call to the Meta Graph API
        testWhatsAppCredentials(accountName, apiKey, phoneNumberId)
            .then(isValid => {
                if (isValid) {
                    // Save to localStorage
                    const credentials = {
                        accountName,
                        apiKey,
                        phoneNumberId,
                        connected: true,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    localStorage.setItem('whatsappCredentials', JSON.stringify(credentials));
                    showToast('Settings saved', 'Your WhatsApp credentials have been saved and verified.', 'success');
                } else {
                    // Save but mark as not connected
                    const credentials = {
                        accountName,
                        apiKey,
                        phoneNumberId,
                        connected: false,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    localStorage.setItem('whatsappCredentials', JSON.stringify(credentials));
                    showToast('Warning', 'Credentials saved but could not be verified. They may be invalid.', 'info');
                }
            })
            .catch(error => {
                console.error('Error testing WhatsApp credentials:', error);
                
                // Save anyway but mark as not connected
                const credentials = {
                    accountName,
                    apiKey,
                    phoneNumberId,
                    connected: false,
                    lastUpdated: new Date().toISOString()
                };
                
                localStorage.setItem('whatsappCredentials', JSON.stringify(credentials));
                showToast('Warning', 'Credentials saved but could not be verified: ' + error.message, 'info');
            });
    });
    
    // SMS form
    document.getElementById('smsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const provider = document.getElementById('smsProvider').value.trim();
        const accountSid = document.getElementById('accountSid').value.trim();
        const authToken = document.getElementById('authToken').value.trim();
        const phoneNumber = document.getElementById('senderPhone').value.trim();
        const messagingServiceSid = document.getElementById('messagingServiceSid').value.trim();
        
        // Either phone number or messaging service SID is required
        if (!provider || !accountSid || !authToken || (!phoneNumber && !messagingServiceSid)) {
            showToast('Missing fields', 'Please fill in all the required fields. Either Phone Number or Messaging Service SID is required.', 'error');
            return;
        }
        
        // Test the credentials by making a test call to the Twilio API
        testTwilioCredentials(accountSid, authToken, phoneNumber)
            .then(isValid => {
                if (isValid) {
                    // Save to localStorage
                    const credentials = {
                        provider,
                        accountSid,
                        authToken,
                        phoneNumber,
                        messagingServiceSid,
                        connected: true,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    localStorage.setItem('smsCredentials', JSON.stringify(credentials));
                    showToast('Settings saved', 'Your SMS credentials have been saved and verified.', 'success');
                } else {
                    // Save but mark as not connected
                    const credentials = {
                        provider,
                        accountSid,
                        authToken,
                        phoneNumber,
                        messagingServiceSid,
                        connected: false,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    localStorage.setItem('smsCredentials', JSON.stringify(credentials));
                    showToast('Warning', 'Credentials saved but could not be verified. They may be invalid.', 'info');
                }
            })
            .catch(error => {
                console.error('Error testing Twilio credentials:', error);
                
                // Save anyway but mark as not connected
                const credentials = {
                    provider,
                    accountSid,
                    authToken,
                    phoneNumber,
                    messagingServiceSid,
                    connected: false,
                    lastUpdated: new Date().toISOString()
                };
                
                localStorage.setItem('smsCredentials', JSON.stringify(credentials));
                showToast('Warning', 'Credentials saved but could not be verified: ' + error.message, 'info');
            });
    });
    
    // Search messages
    const searchMessagesInput = document.getElementById('searchMessages');
    if (searchMessagesInput) {
        searchMessagesInput.addEventListener('input', function() {
            renderMessageHistory();
        });
    }
}

// Test WhatsApp credentials by checking the account
async function testWhatsAppCredentials(accountName, apiKey, phoneNumberId) {
    try {
        // Make a simple GET request to the Meta Graph API to get the business profile
        const response = await fetch(`https://graph.facebook.com/v16.0/${phoneNumberId}`, {
            headers: {
                'Authorization': 'Bearer ' + apiKey
            }
        });
        
        // If successful, credentials are valid
        return response.ok;
    } catch (error) {
        console.error('Error testing WhatsApp credentials:', error);
        return false;
    }
}

// Test Twilio credentials by checking the account
async function testTwilioCredentials(accountSid, authToken, phoneNumber) {
    try {
        console.log('Testing Twilio credentials for account:', accountSid);
        
        // Format phone number to ensure it's valid
        const formattedPhone = phoneNumber.startsWith('+') 
            ? phoneNumber 
            : `+${phoneNumber.replace(/\D/g, '')}`;
            
        // Get the base URL of the server (works in both local and Replit environments)
        let baseUrl;
        if (window.location.hostname.includes('replit.dev') || 
            window.location.hostname.includes('replit.app')) {
            // When running in Replit
            baseUrl = window.location.origin;
        } else if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
            // When running locally
            baseUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
        } else {
            // Default case for other environments
            baseUrl = window.location.origin;
        }
                       
        console.log('Using API base URL for credential test:', baseUrl);
        
        // Use our server proxy instead of calling Twilio directly
        // This avoids CORS issues in the browser
        const response = await fetch(`${baseUrl}/api/twilio/test-credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountSid,
                authToken,
                phoneNumber: formattedPhone
            })
        });
        
        // Log result for debugging
        console.log('Proxy credential test response status:', response.status);
        
        // Parse the response
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('Twilio credentials valid!', result.data);
            return true;
        } else {
            console.error('Twilio API error:', result.error);
            return false;
        }
    } catch (error) {
        console.error('Error testing Twilio credentials:', error);
        
        // In case of server errors, we'll allow saving the credentials
        // but mark them as unverified
        return false;
    }
}

// Try to get environment variables if available (for Replit environment)
function getEnvVariable(name) {
    // Check if we're in an environment where process.env is available
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name];
    }
    
    // For browser environments
    if (typeof window !== 'undefined' && window[name]) {
        return window[name];
    }
    
    return null;
}

// Load saved data from localStorage
function loadSavedData() {
    try {
        // Check for environment variables and apply them (for Replit environment)
        const twilioAccountSid = getEnvVariable('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = getEnvVariable('TWILIO_AUTH_TOKEN');
        const twilioPhoneNumber = getEnvVariable('TWILIO_PHONE_NUMBER');
        
        // If we have environment variables, pre-populate the form
        if (twilioAccountSid || twilioAuthToken || twilioPhoneNumber) {
            console.log('Found Twilio environment variables - using these credentials');
            
            // Use the SID and token from curl example if none provided in environment
            const accountSidToUse = twilioAccountSid || 'AC98271a4096b256a2da2903ef69712cb5';
            const authTokenToUse = twilioAuthToken || '336e87839d884712577a3b85d13c597f';
            const messagingServiceSidToUse = 'MGcd0c967cabfc50232de4b28f752e4f8a';
            
            // Pre-save the SMS credentials from environment
            const smsCredentials = {
                provider: 'Twilio',
                accountSid: accountSidToUse,
                authToken: authTokenToUse,
                phoneNumber: twilioPhoneNumber || '',
                messagingServiceSid: messagingServiceSidToUse,
                connected: true,
                lastUpdated: new Date().toISOString()
            };
            
            // Save to localStorage
            localStorage.setItem('smsCredentials', JSON.stringify(smsCredentials));
        }
        
        // Load contacts
        const savedContacts = localStorage.getItem('contacts');
        if (savedContacts) {
            try {
                contacts = JSON.parse(savedContacts);
                renderContactTable();
            } catch (error) {
                console.error('Error parsing contacts:', error);
                contacts = [];
            }
        }
        
        // Load selected contacts
        const savedSelectedIds = localStorage.getItem('selectedContactIds');
        if (savedSelectedIds) {
            try {
                const parsedIds = JSON.parse(savedSelectedIds);
                selectedContactIds = new Set(parsedIds);
                updateContactCount();
            } catch (error) {
                console.error('Error parsing selected contact IDs:', error);
                selectedContactIds = new Set();
            }
        }
        
        // Load message history
        try {
            const savedHistory = localStorage.getItem('messageHistory');
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                
                // Validate that we have an array of messages
                if (Array.isArray(parsedHistory)) {
                    // Ensure all message items have proper status arrays
                    messageHistory = parsedHistory.map(msg => {
                        // Make sure status is always an array
                        if (!msg.status || !Array.isArray(msg.status)) {
                            msg.status = [];
                        }
                        return msg;
                    });
                    
                    // Now it's safe to render
                    renderMessageHistory();
                }
            }
        } catch (error) {
            console.error('Error loading message history:', error);
            // If there's an error, start with empty history
            messageHistory = [];
        }
        
        // Load message draft
        const savedDraft = localStorage.getItem('messageDraft');
        if (savedDraft) {
            document.getElementById('messageInput').value = savedDraft;
            document.getElementById('messageInput').dispatchEvent(new Event('input'));
        }
        
        // Load WhatsApp credentials
        try {
            const savedWhatsappCreds = localStorage.getItem('whatsappCredentials');
            if (savedWhatsappCreds) {
                const creds = JSON.parse(savedWhatsappCreds);
                document.getElementById('whatsappName').value = creds.accountName || '';
                document.getElementById('whatsappApiKey').value = creds.apiKey || '';
                document.getElementById('whatsappPhoneId').value = creds.phoneNumberId || '';
            }
        } catch (error) {
            console.error('Error loading WhatsApp credentials:', error);
        }
        
        // Load SMS credentials
        try {
            const savedSmsCreds = localStorage.getItem('smsCredentials');
            if (savedSmsCreds) {
                const creds = JSON.parse(savedSmsCreds);
                document.getElementById('smsProvider').value = creds.provider || 'Twilio';
                document.getElementById('accountSid').value = creds.accountSid || '';
                document.getElementById('authToken').value = creds.authToken || '';
                document.getElementById('senderPhone').value = creds.phoneNumber || '';
                if (creds.messagingServiceSid) {
                    document.getElementById('messagingServiceSid').value = creds.messagingServiceSid;
                }
            }
        } catch (error) {
            console.error('Error loading SMS credentials:', error);
        }
    } catch (error) {
        console.error('Error in loadSavedData:', error);
    }
}

// Save contacts to localStorage
function saveContactsToLocalStorage() {
    try {
        localStorage.setItem('contacts', JSON.stringify(contacts));
        localStorage.setItem('selectedContactIds', JSON.stringify(Array.from(selectedContactIds)));
    } catch (error) {
        console.error('Error saving contacts to localStorage:', error);
        showToast('Warning', 'Failed to save contacts to browser storage. The data may be too large.', 'info');
    }
}

// Save message history to localStorage
function saveMessageHistoryToLocalStorage() {
    try {
        localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
    } catch (error) {
        console.error('Error saving message history to localStorage:', error);
        showToast('Warning', 'Failed to save message history to browser storage. The data may be too large.', 'info');
    }
}

// Toast notification system
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
        <span class="toast-close">&times;</span>
    `;
    
    // Add to DOM
    toastContainer.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}