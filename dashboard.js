import { API_BASE_URL, SOCKET_BASE_URL, createSocket } from './config.js';

// Initialize Socket.IO connection
const socket = createSocket();
console.log('🔗 Connected to WebSocket server'); // Debug log

// Send authId to the server after connecting
const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage
if (authId) {
    socket.emit('authId', authId); // Send authId to the server
    console.log(`📤 Sent authId to server: ${authId}`);
}

// DOM Elements
const botInfoTable = document.getElementById('botInfoTable').querySelector('tbody');
const notificationMessage = document.getElementById('notificationMessage');
const notificationHistory = document.getElementById('notificationHistory');
const activityLog = document.getElementById('activityLog');
const performanceChart = document.getElementById('performanceChart').getContext('2d');
const userGreeting = document.getElementById('userGreeting');
const confirmationModal = document.getElementById('confirmationModal');
const modalMessage = document.getElementById('modalMessage');
const confirmButton = document.getElementById('confirmButton');
const cancelButton = document.getElementById('cancelButton');

// Chart.js Configuration
let chartInstance = null;

// Redirect to register bot page
document.getElementById('registerBotButton').addEventListener('click', () => {
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage
    if (!authId) {
        notificationMessage.textContent = '❌ Auth ID is missing. Please log in again.';
        notificationMessage.classList.add('error');
        return;
    }

    // Redirect to the register bot page with auth_id as a query parameter
    window.location.href = `register-bot.html?authId=${authId}`;
});

const fetchActivityLog = async () => {
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage
    console.log(`📤 Sending request to fetch activity log for authId: ${authId}`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/activity-log?authId=${authId}`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Activity log fetched successfully:', data.activities);
            activityLog.innerHTML = ''; // Clear existing activities

            if (data.activities.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No recent activities.';
                activityLog.appendChild(li);
                return;
            }

            // Populate activity log
            data.activities.forEach((activity) => {
                const li = document.createElement('li');
                li.textContent = `${activity.timestamp}: ${activity.action}`;
                activityLog.appendChild(li);
            });
        } else {
            console.error('❌ Failed to fetch activity log:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching activity log:', error.message);
    }
};



/// Fetch user summary
const fetchUserSummary = async () => {
    const authId = localStorage.getItem('auth_id');
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/summary?authId=${authId}`);
        const data = await response.json();
        if (response.ok) {
            // Extract username from email
            const email = data.email || 'Unknown';
            const username = email.split('@')[0]; // Use the part before '@' as the username

            // Update the user greeting
            userGreeting.textContent = `Hello, ${username}! You have ${data.totalBots} bots, ${data.activeBots} active.`;
        } else {
            userGreeting.textContent = '❌ Failed to fetch user summary.';
        }
    } catch (error) {
        userGreeting.textContent = '❌ Error fetching user summary.';
    }
};
// Fetch bot info
const fetchBotInfo = async () => {
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage
    console.log(`📤 Sending request to fetch bot info for authId: ${authId}`); // Debug log

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/bot-info?authId=${authId}`);
        const data = await response.json();

        if (response.ok) {
            botInfoTable.innerHTML = ''; // Clear existing rows

            
            if (data.bots.length === 0) {
                console.log('ℹ️ No bots registered for this user.');
                if (notificationMessage) {
                    notificationMessage.textContent = 'You have not registered any bots yet.';
                    notificationMessage.classList.add('info');
                } else {
                    console.warn('⚠️ notificationMessage element is not found in the DOM.');
                }
                return;
            }

            // Populate bot info table
            console.log('✅ Populating bot info table...');
            data.bots.forEach((bot) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${bot.phoneNumber}</td>
                    <td><span class="badge ${bot.status === 'Active' ? 'badge-success' : 'badge-danger'}">${bot.status}</span></td>
                    <td>${bot.memoryUsage || 'N/A'} MB</td>
                    <td>${bot.uptime || 'N/A'}</td>
                    <td>${bot.lastActive || 'N/A'}</td>
                    <td>${bot.version || 'N/A'}</td>
                    <td>
                        <button class="btn-primary" onclick="showConfirmation('restart', '${bot.phoneNumber}')">Restart</button>
                        <button class="btn-danger" onclick="showConfirmation('delete', '${bot.phoneNumber}')">Delete</button>
                    </td>
                `;
                botInfoTable.appendChild(row);
            });
        } else {
            notificationMessage.textContent = `❌ ${data.message}`;
            notificationMessage.classList.add('error');
        }
    } catch (error) {
        notificationMessage.textContent = '❌ Error fetching bot info.';
        notificationMessage.classList.add('error');
    }
};
// Show confirmation modal
const showConfirmation = (action, phoneNumber) => {
    confirmationModal.classList.remove('hidden');
    modalMessage.innerHTML = `
        <p>Are you sure you want to <strong>${action}</strong> the bot for <strong>${phoneNumber}</strong>?</p>
    `;
    confirmButton.onclick = () => {
        confirmationModal.classList.add('hidden');
        if (action === 'restart') restartBot(phoneNumber);
        if (action === 'delete') deleteBot(phoneNumber);
    };
    cancelButton.onclick = () => confirmationModal.classList.add('hidden');
};

// Attach showConfirmation to the global window object
window.showConfirmation = showConfirmation;

// Attach showConfirmation to the global window object
window.showConfirmation = showConfirmation;
// Restart bot
const restartBot = async (phoneNumber) => {
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/restart-bot/${phoneNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }), // Include authId in the request body
        });

        const data = await response.json();
        if (response.ok) {
            addNotification(`✅ Bot restarted successfully for ${phoneNumber}.`, 'success');
            fetchBotInfo(); // Refresh bot info
        } else {
            addNotification(`❌ Failed to restart bot for ${phoneNumber}: ${data.message}`, 'error');
        }
    } catch (error) {
        addNotification(`❌ Error restarting bot for ${phoneNumber}.`, 'error');
    }
};

// Delete bot
window.deleteBot = async (phoneNumber) => {
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/delete-bot/${phoneNumber}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }),
        });

        const data = await response.json();
        if (response.ok) {
            addNotification(`✅ Bot deleted successfully for ${phoneNumber}.`, 'success');
            fetchBotInfo(); // Refresh bot info
        } else {
            addNotification(`❌ Failed to delete bot for ${phoneNumber}: ${data.message}`, 'error');
        }
    } catch (error) {
        addNotification(`❌ Error deleting bot for ${phoneNumber}.`, 'error');
    }
};

// Add notification
const addNotification = (message, type) => {
    const li = document.createElement('li');
    li.textContent = message;
    li.classList.add(type === 'success' ? 'success' : type === 'error' ? 'error' : 'info');
    notificationHistory.appendChild(li);
};

// Initialize Chart.js
const initializeChart = (data) => {
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(performanceChart, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Command Processing Time (ms)',
                    data: data.commandProcessingTime,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                },
            ],
        },
    });
};

const fetchPerformanceTrends = async () => {
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage
    console.log(`📤 Sending request to fetch analytics for authId: ${authId}`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/analytics?authId=${authId}`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Analytics data fetched successfully:', data.analytics);
            initializeChart(data.analytics); // Render the chart
        } else {
            console.error('❌ Failed to fetch analytics data:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching analytics data:', error.message);
    }
};

// Log bot errors to the notification area
socket.on('bot-error', (data) => {
    const { phoneNumber, error } = data;
    notificationMessage.textContent = `❌ Bot error for ${phoneNumber}: ${error}`;
    notificationMessage.classList.add('error');
});

// Handle bot registration success
window.addEventListener('message', (event) => {
    if (event.data.type === 'bot-registered') {
        console.log(`✅ Bot registered successfully for phone number: ${event.data.phoneNumber}`);
        notificationMessage.textContent = `✅ Bot registered successfully for ${event.data.phoneNumber}`;
        notificationMessage.classList.add('success');

        // Refresh the bot info table
        fetchBotInfo();
    }
});

document.getElementById('submitComplaintButton').addEventListener('click', async () => {
    const message = document.getElementById('complaintInput').value;
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage

    if (!message.trim()) {
        alert('Please enter a complaint.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/submit-complaint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId, message }), // Include authId in the request body
        });

        const data = await response.json();
        if (response.ok) {
            alert('✅ Complaint submitted successfully.');
        } else {
            alert(`❌ Failed to submit complaint: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Error submitting complaint.');
    }
});

document.getElementById('requestAccountDeletionButton').addEventListener('click', async () => {
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/request-account-deletion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }), // Include authId in the request body
        });

        const data = await response.json();
        if (response.ok) {
            alert('✅ Account deletion request submitted successfully.');
        } else {
            alert(`❌ Failed to submit account deletion request: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Error submitting account deletion request.');
    }
});

socket.on('bot-error', (data) => {
    const { phoneNumber, message, needsRescan } = data;

    const li = document.createElement('li');
    li.innerHTML = `
        ❌ Bot error for ${phoneNumber}: ${message}
        ${needsRescan ? `<button class="btn-primary rescan-button" data-phone="${phoneNumber}">Rescan</button>` : ''}
    `;
    notificationHistory.appendChild(li);

    // Attach event listener to the rescan button
    if (needsRescan) {
        li.querySelector('.rescan-button').addEventListener('click', () => {
            window.location.href = `register-bot.html?phoneNumber=${phoneNumber}`;
        });
    }
});

const fetchNotifications = async () => {
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/notifications?authId=${authId}`);
        const data = await response.json();

        if (response.ok) {
            const notificationHistory = document.getElementById('notificationHistory');
            notificationHistory.innerHTML = ''; // Clear existing notifications

            data.notifications.forEach((notification) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    [${notification.sender}] ${notification.timestamp}: ${notification.message}
                    ${notification.needsRescan ? `<button class="btn-primary rescan-button" data-phone="${notification.phoneNumber}">Rescan</button>` : ''}
                    <button class="btn-secondary mark-read-button" data-id="${notification.id}">Mark as Read</button>
                `;
                notificationHistory.appendChild(li);
            });

            // Attach event listeners to "Mark as Read" buttons
            document.querySelectorAll('.mark-read-button').forEach((button) => {
                button.addEventListener('click', async (e) => {
                    const notificationId = e.target.getAttribute('data-id');
                    await markNotificationAsRead(notificationId);
                });
            });

            // Attach event listeners to rescan buttons
            document.querySelectorAll('.rescan-button').forEach((button) => {
                button.addEventListener('click', (e) => {
                    const phoneNumber = e.target.getAttribute('data-phone');
                    window.location.href = `register-bot.html?phoneNumber=${phoneNumber}`;
                });
            });
        } else {
            console.error('❌ Failed to fetch notifications:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching notifications:', error.message);
    }
};

// Function to mark a notification as read
const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/notifications/${notificationId}`, {
            method: 'DELETE',
        });

        const data = await response.json();
        if (response.ok) {
            alert('✅ Notification marked as read.');
            fetchNotifications(); // Refresh notifications
        } else {
            alert(`❌ Failed to mark notification as read: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Error marking notification as read.');
    }
};
// Fetch notifications on page load
fetchNotifications();

// Fetch user summary and bot info on page load
fetchUserSummary();
fetchBotInfo();
fetchPerformanceTrends();
fetchActivityLog();

// Listen for notifications from the admin
socket.on('user-notification', (data) => {
    console.log('📥 Received notification from admin:', data);
    const { message } = data;

    const li = document.createElement('li');
    li.textContent = `📢 Admin Notification: ${message}`;
    notificationHistory.appendChild(li);
});

document.getElementById('tokenInputForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tokenId = document.getElementById('tokenInput').value.trim();
    const authId = localStorage.getItem('auth_id');

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId, tokenId }),
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('tokenResponseMessage').textContent = '✅ Token validated successfully.';
            fetchSubscriptionDetails(); // Refresh subscription details
        } else {
            document.getElementById('tokenResponseMessage').textContent = `❌ ${data.message}`;
        }
    } catch (error) {
        document.getElementById('tokenResponseMessage').textContent = '❌ Error validating token.';
    }
});

const fetchSubscriptionDetails = async () => {
    const authId = localStorage.getItem('auth_id');
    console.log(`📤 Sending request to fetch subscription details for authId: ${authId}`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/subscription?authId=${authId}`);
        const data = await response.json();
        console.log('📥 Received subscription details:', data);

        if (response.ok) {
            document.getElementById('subscriptionLevel').textContent = data.subscriptionLevel;
            document.getElementById('daysLeft').textContent = data.daysLeft;
        } else if (response.status === 404) {
            // Fetch the user's email for display
            const summaryResponse = await fetch(`${API_BASE_URL}/api/user/summary?authId=${authId}`);
            const summaryData = await summaryResponse.json();
            const email = summaryData.email || 'this user';
            document.getElementById('subscriptionDetails').textContent = `No subscription for ${email}`;
        } else {
            document.getElementById('subscriptionDetails').textContent = '❌ Failed to fetch subscription details.';
        }
    } catch (error) {
        document.getElementById('subscriptionDetails').textContent = '❌ Error fetching subscription details.';
    }
};
// Fetch subscription details on page load
fetchSubscriptionDetails();

document.addEventListener('DOMContentLoaded', async () => {
    const authId = localStorage.getItem('auth_id');
    if (!authId) {
        const li = document.createElement('li');
        li.textContent = '❌ Auth ID is missing. Please log in again.';
        li.classList.add('error');
        notificationHistory.appendChild(li);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/notifications/${authId}`);
        const data = await response.json();

        if (response.ok) {
            notificationHistory.innerHTML = '';
            data.notifications.forEach((notification) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="timestamp">${new Date(notification.timestamp).toLocaleString()}</span>
                    <span class="sender">[${notification.sender}]</span>
                    <span class="message">${notification.message}</span>
                `;
                notificationHistory.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = `❌ ${data.message}`;
            li.classList.add('error');
            notificationHistory.appendChild(li);
        }
    } catch (error) {
        const li = document.createElement('li');
        li.textContent = '❌ Error fetching notifications. Please try again later.';
        li.classList.add('error');
        notificationHistory.appendChild(li);
    }
});