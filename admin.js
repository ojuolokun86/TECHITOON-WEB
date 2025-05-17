import { API_BASE_URL, SOCKET_BASE_URL, createSocket } from "./config.js";
console.log('🔗 Connected to API server:', API_BASE_URL); // Debug log
const socket = createSocket();

function formatDateTime(isoString) {
    const dateObj = new Date(isoString);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time };
}

document.addEventListener('DOMContentLoaded', () => {
    const userTableMemoryBody = document.querySelector('#userTableMemory tbody'); // For memory-related data
    const deleteAllUsersButton = document.getElementById('deleteAllUsersButton');
    const responseMessage = document.getElementById('responseMessage');
    const userTableAuthBody = document.querySelector('#userTableAuth tbody');
    console.log('🔍 userTableAuthBody:', userTableAuthBody); // Debug log


    if (!userTableAuthBody) {
        console.error('❌ userTableAuthBody is not defined. Ensure the #userTableAuth tbody element exists in the HTML.');
        return;
    }

    
     // Fetch all users from the backend
    const fetchAuthUsers = async () => {
        console.log('🔍 Fetching users from the backend...'); // Debug log
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users-info`);
            const data = await response.json();

            if (response.ok) {
                console.log('✅ Users fetched successfully:', data.users);
                populateAuthUserTable(data.users);
            } else {
                console.error('❌ Failed to fetch users:', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching users:', error.message);
        }
    };

    // Function to populate the user table
   const populateAuthUserTable = (users) => {
    userTableAuthBody.innerHTML = ''; // Clear existing rows

    users.forEach((user) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.email || 'N/A'}</td>
            <td>${user.auth_id}</td>
            <td>${user.subscription_level || 'N/A'}</td>
            <td>${user.days_left !== undefined ? user.days_left : 'N/A'}</td>
        `;
        userTableAuthBody.appendChild(row);
    });
};

    fetchAuthUsers(); // Call the function to fetch and populate the table


    // Utility function to display messages
    const displayMessage = (message, isSuccess = true) => {
        responseMessage.textContent = message;
        responseMessage.style.color = isSuccess ? 'green' : 'red';
        responseMessage.style.display = 'block';

        // Hide the message after 5 seconds
        setTimeout(() => {
            responseMessage.style.display = 'none';
        }, 5000);
    };

    // Fetch all users from the backend
    const fetchMemoryUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`);
        const data = await response.json();
        if (response.ok) {
            // Each user already has phoneNumber and authId
            populateMemoryUserTable(data.users);
            displayMessage('✅ Users fetched successfully.');
        } else {
            displayMessage(`❌ Failed to fetch users: ${data.message}`, false);
        }
    } catch (error) {
        displayMessage('❌ Error fetching users.', false);
    }
};
    
   const populateMemoryUserTable = (users) => {
    userTableMemoryBody.innerHTML = ''; // Clear existing rows

    users.forEach((user) => {
        const row = document.createElement('tr');

        // Phone Number
        const phoneNumberCell = document.createElement('td');
        phoneNumberCell.textContent = user.phoneNumber || 'N/A'; // Display 'N/A' if phoneNumber is missing
        row.appendChild(phoneNumberCell);

        // Status
        const statusCell = document.createElement('td');
        statusCell.textContent = user.active ? 'Active' : 'Inactive'; // Correctly display active/inactive
        row.appendChild(statusCell);

        // Max RAM
        const maxRamCell = document.createElement('td');
        const maxRamInput = document.createElement('input');
        maxRamInput.type = 'number';
        maxRamInput.value = user.maxRam || 10; // Use maxRam from the backend or default to 10
        maxRamInput.classList.add('memory-input'); // Add a class for styling if needed
        maxRamCell.appendChild(maxRamInput);
        row.appendChild(maxRamCell);

        // Max ROM
        const maxRomCell = document.createElement('td');
        const maxRomInput = document.createElement('input');
        maxRomInput.type = 'number';
        maxRomInput.value = user.maxRom || 50; // Use maxRom from the backend or default to 50
        maxRomInput.classList.add('memory-input'); // Add a class for styling if needed
        maxRomCell.appendChild(maxRomInput);
        row.appendChild(maxRomCell);

        // Memory Usage
        const memoryUsageCell = document.createElement('td');
        memoryUsageCell.textContent = user.memoryUsage || 'N/A'; // Display memory usage
        row.appendChild(memoryUsageCell);

        // Update Limits Button
        const updateLimitsCell = document.createElement('td');
        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update';
        updateButton.classList.add('btn-primary'); // Add a class for styling if needed
        updateButton.addEventListener('click', async () => {
            const maxRam = parseInt(maxRamInput.value, 10);
            const maxRom = parseInt(maxRomInput.value, 10);

            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/users/${user.phoneNumber}/memory-limits`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ maxRam, maxRom }),
                });

                const data = await response.json();
                if (response.ok) {
                    displayMessage(`✅ Memory limits updated for user ${user.phoneNumber}.`);

                    // Update the row with the new values
                    memoryUsageCell.textContent = data.user.memory_usage || 'N/A'; // Update memory usage
                } else {
                    displayMessage(`❌ Failed to update memory limits for user ${user.phoneNumber}: ${data.message}`, false);
                }
            } catch (error) {
                displayMessage(`❌ Error updating memory limits for user ${user.phoneNumber}.`, false);
            }
        });
        updateLimitsCell.appendChild(updateButton);
        row.appendChild(updateLimitsCell);

       // Auth ID (VISIBLE)
        const authIdCell = document.createElement('td');
        authIdCell.textContent = user.authId || user.auth_id || '';
        authIdCell.classList.add('auth-id-cell');
        row.appendChild(authIdCell);

        // Actions (Delete and Restart)
        const actionsCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('btn-danger');
        deleteButton.addEventListener('click', () => {
                showAdminConfirmation('delete', user.phoneNumber, user.authId || user.auth_id);
         });

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart';
        restartButton.style.marginLeft = '10px';
        restartButton.addEventListener('click', () => {
             showAdminConfirmation('restart', user.phoneNumber, user.authId || user.auth_id);
        });

        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop';
        stopButton.classList.add('btn-danger');
        stopButton.style.marginLeft = '10px';
        stopButton.addEventListener('click', () => {
            showAdminConfirmation('stop', user.phoneNumber, user.authId || user.auth_id);
        });

        // Start Button
        const startButton = document.createElement('button');
        startButton.textContent = 'Start';
        startButton.classList.add('btn-primary');
        startButton.style.marginLeft = '10px';
        startButton.addEventListener('click', () => {
            showAdminConfirmation('start', user.phoneNumber, user.authId || user.auth_id);
        });


        actionsCell.appendChild(deleteButton);
        actionsCell.appendChild(restartButton);
        actionsCell.appendChild(stopButton);
        actionsCell.appendChild(startButton);
        row.appendChild(actionsCell);

        userTableMemoryBody.appendChild(row);
    });
};

const adminConfirmationModal = document.getElementById('confirmationModal');
const adminModalMessage = document.getElementById('modalMessage');
const adminConfirmButton = document.getElementById('confirmButton');
const adminCancelButton = document.getElementById('cancelButton');

function showAdminConfirmation(action, phoneNumber, authId) {
    adminConfirmationModal.classList.remove('hidden');
    adminModalMessage.innerHTML = `
        <img src="./image/beyond.jpg" alt="Confirmation Background" style="width:100%;max-width:200px;display:block;margin:auto;">
        <p>Are you sure you want to <strong>${action}</strong> the bot for <strong>${phoneNumber}</strong>?</p>
    `;
    adminConfirmButton.onclick = async () => {
        adminConfirmationModal.classList.add('hidden');
        if (action === 'restart') await restartBot(phoneNumber, authId);
        if (action === 'delete') await deleteUser(phoneNumber);
        if (action === 'stop') await stopBot(phoneNumber);
        if (action === 'start') await startBot(phoneNumber, authId);
    };
    adminCancelButton.onclick = () => adminConfirmationModal.classList.add('hidden');
}

// Attach to global for HTML inline use if needed
window.showAdminConfirmation = showAdminConfirmation;

const updateMemoryLimits = async (phoneNumber, maxRam, maxRom) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${phoneNumber}/memory-limits`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maxRam, maxRom }),
        });

        const data = await response.json();
        if (response.ok) {
            displayMessage(`✅ Memory limits updated for user ${phoneNumber}.`);

            // Refresh the specific row with updated data
            const updatedUser = data.user;
            const row = Array.from(userTableMemoryBody.rows).find(
                (r) => r.cells[0].textContent === phoneNumber
            );

            if (row) {
                row.cells[2].querySelector('input').value = updatedUser.max_ram; // Update Max RAM
                row.cells[3].querySelector('input').value = updatedUser.max_rom; // Update Max ROM
                row.cells[4].textContent = updatedUser.memory_usage || 'N/A'; // Update Memory Usage
            }
        } else {
            displayMessage(`❌ Failed to update memory limits for user ${phoneNumber}: ${data.message}`, false);
        }
    } catch (error) {
        displayMessage(`❌ Error updating memory limits for user ${phoneNumber}.`, false);
    }
};

    // Delete a specific user
    const deleteUser = async (phoneNumber) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${phoneNumber}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                displayMessage(`✅ User ${phoneNumber} deleted successfully.`);
                fetchUsers(); // Refresh the user list
                
            } else {
                displayMessage(`❌ Failed to delete user ${phoneNumber}: ${data.message}`, false);
            }
        } catch (error) {
            displayMessage(`❌ Error deleting user ${phoneNumber}.`, false);
        }
    };

    // Restart a bot
    const restartBot = async (phoneNumber, authId) => {
        console.log('🔄 Restarting bot for phone number:', phoneNumber, authId); // Debug log
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/restart-bot/${phoneNumber}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId }),
            });

            const data = await response.json();
            console.log('🔄 Restart response:', data); // Debug log
            if (response.ok) {
                displayMessage(`✅ Bot for ${phoneNumber} restarted successfully.`);
            } else {
                displayMessage(`❌ Failed to restart bot for ${phoneNumber}: ${data.message}`, false);
            }
        } catch (error) {
            displayMessage(`❌ Error restarting bot for ${phoneNumber}.`, false);
        }
    };

    // Fetch memory usage for all users
        const fetchMemoryUsage = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/memory-usage`);
            const data = await response.json();

            if (response.ok) {
                console.log('✅ Memory usage fetched successfully:', data.memoryUsage); // Debug log
                populateMemoryUsage(data.memoryUsage);
            } else {
                displayMessage(`❌ Failed to fetch memory usage: ${data.message}`, false);
            }
        } catch (error) {
            displayMessage('❌ Error fetching memory usage.', false);
        }
    };

    // Populate memory usage in the user table
        const populateMemoryUsage = (memoryUsage) => {
        const rows = document.querySelectorAll('#userTableMemory tbody tr'); // Select all rows in the memory table

        memoryUsage.forEach((usage) => {
            const row = Array.from(rows).find((r) => r.cells[0].textContent === usage.phoneNumber); // Match by phone number
            if (row) {
                const memoryCell = row.cells[4]; // Memory Usage column
                memoryCell.textContent = usage.memoryUsage; // Update the memory usage
            }
        });
    };   

    const stopBot = async (phoneNumber) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stop-bot/${phoneNumber}`, { method: 'POST' });
        const data = await response.json();
        alert(data.message);
        fetchMemoryUsers();
    } catch (error) {
        alert('❌ Error stopping bot.');
    }
};

const startBot = async (phoneNumber, authId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/start-bot/${phoneNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }),
        });
        const data = await response.json();
        alert(data.message);
        fetchMemoryUsers();
    } catch (error) {
        alert('❌ Error starting bot.');
    }
};
    // Delete all users
    deleteAllUsersButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                displayMessage('✅ All users deleted successfully.');
                fetchMemoryUsers(); // Refresh the user list
            } else {
                displayMessage(`❌ Failed to delete all users: ${data.message}`, false);
            }
        } catch (error) {
            displayMessage('❌ Error deleting all users.', false);
        }
    });

    // Fetch users and memory usage on page load
    fetchMemoryUsers().then(fetchMemoryUsage);
});


// Listen for account deletion requests
socket.on('account-deletion-request', (data) => {
    const { authId } = data;

    const li = document.createElement('li');
    li.innerHTML = `
        <strong>Account Deletion Request:</strong> User with Auth ID <strong>${authId}</strong> has requested account deletion.
    `;
    const complaintsList = document.getElementById('complaintsList');
    complaintsList.appendChild(li);
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sendNotificationButton').addEventListener('click', async () => {
        const messageInput = document.getElementById('notificationMessageInput');
        if (!messageInput) {
            console.error('❌ notificationMessageInput element not found in the DOM.');
            return;
        }

        const message = messageInput.value.trim();

        if (!message) {
            alert('Please enter a notification message.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            if (response.ok) {
                alert('✅ Notification sent successfully.');
            } else {
                alert(`❌ Failed to send notification: ${data.message}`);
            }
        } catch (error) {
            alert('❌ Error sending notification.');
        }
    });
});

const fetchComplaints = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/complaints`);
        const data = await response.json();

        if (response.ok) {
            const complaintsList = document.getElementById('complaintsList');
            complaintsList.innerHTML = ''; // Clear existing complaints

          data.complaints.forEach((complaint) => {
                const { date, time } = formatDateTime(complaint.timestamp);
                const isDeletion = complaint.message && complaint.message.includes('[Account Deletion Request]');
                const li = document.createElement('li');
                li.innerHTML = `
                    <div style="margin-bottom: 6px;">
                        <span class="notif-date">${date}</span>
                        <span class="notif-time">${time}</span>
                    </div>
                    <div>
                        <strong style="color:#ffd700;">Auth ID:</strong>
                        <span style="color:#00aaff;font-weight:bold;">${complaint.auth_id}</span>
                    </div>
                    <div style="margin: 8px 0 10px 0;">
                        <strong style="color:#00aaff;">Message:</strong>
                        <span style="color:${isDeletion ? '#ff3b3b' : '#fff'};font-weight:bold;">
                            ${complaint.message}
                        </span>
                    </div>
                    <button class="btn-secondary mark-read-complaint" data-timestamp="${complaint.timestamp}">Mark as Read</button>
                `;
                if (isDeletion) {
                    li.style.borderLeft = '6px solid #ff3b3b';
                    li.style.background = '#2a1a1a';
                }
                complaintsList.appendChild(li);

                // Add event listener for this button
                li.querySelector('.mark-read-complaint').addEventListener('click', async (e) => {
                    const timestamp = e.target.getAttribute('data-timestamp');
                    await fetch(`${API_BASE_URL}/api/admin/complaints/${timestamp}`, { method: 'DELETE' });
                    fetchComplaints(); // Refresh the list
                });
            });
        } else {
            console.error('❌ Failed to fetch complaints:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching complaints:', error.message);
    }
};

// Fetch complaints on page load
fetchComplaints();

document.getElementById('deleteUserButton').addEventListener('click', async () => {
    const authId = document.getElementById('authIdInputDelete').value.trim();

    console.log('Auth ID input value:', authId);
    if (!authId) {
        alert('Please enter a valid Auth ID.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/delete-user`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }),
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('deleteUserResponseMessage').textContent = `✅ User with Auth ID ${authId} deleted successfully.`;
            document.getElementById('deleteUserResponseMessage').style.color = 'green';
        } else {
            document.getElementById('deleteUserResponseMessage').textContent = `❌ Failed to delete user: ${data.message}`;
            document.getElementById('deleteUserResponseMessage').style.color = 'red';
        }
    } catch (error) {
        document.getElementById('deleteUserResponseMessage').textContent = '❌ Error deleting user.';
        document.getElementById('deleteUserResponseMessage').style.color = 'red';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const viewAllBotsButton = document.getElementById('viewAllBotsButton');

    if (viewAllBotsButton) {
        viewAllBotsButton.addEventListener('click', () => {
            window.location.href = 'admin-bots.html'; // Redirect to the Admin Bots page
        });
    }
});

document.getElementById('sendUserNotificationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const authId = document.getElementById('authIdInputNotify').value.trim();
    const message = document.getElementById('messageInput').value.trim();
    console.log('🔍 Sending notification to Auth ID:', authId); // Debug log

    if (!authId || !message) {
        alert('Please fill in both fields.');
        return;
    }

    console.log('🔍 Sending notification to Auth ID:', authId); // Debug log

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/send-user-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId, message }),
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('sendNotificationResponseMessage').textContent = '✅ Notification sent successfully.';
            document.getElementById('sendNotificationResponseMessage').style.color = 'green';
        } else {
            document.getElementById('sendNotificationResponseMessage').textContent = `❌ Failed to send notification: ${data.message}`;
            document.getElementById('sendNotificationResponseMessage').style.color = 'red';
        }
    } catch (error) {
        document.getElementById('sendNotificationResponseMessage').textContent = '❌ Error sending notification.';
        document.getElementById('sendNotificationResponseMessage').style.color = 'red';
    }
});

document.getElementById('generateTokenForm').addEventListener('submit', async (e) => {
    e.preventDefault();

   const authIdInput = document.getElementById('authIdInputToken');
    if (!authIdInput) {
        alert('Auth ID input field for token generation not found.');
        return;
    }
    const authId = authIdInput.value.trim();

    // For subscription level, get the checked radio button:
    const subscriptionLevel = document.querySelector('input[name="subscriptionLevel"]:checked').value;
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/generate-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId, subscriptionLevel }),
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('generateTokenResponseMessage').textContent = `✅ Token generated: ${data.tokenId}`;
        } else {
            document.getElementById('generateTokenResponseMessage').textContent = `❌ ${data.message}`;
        }
    } catch (error) {
        document.getElementById('generateTokenResponseMessage').textContent = '❌ Error generating token.';
    }
});

document.getElementById('syncMemoryButton').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/sync-memory`, { method: 'POST' });
        const data = await response.json();
        if (response.ok) {
            alert('✅ Memory synced to Supabase.');
        } else {
            alert(`❌ Failed to sync memory: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Error syncing memory.');
    }
});


// Add event listener after rendering:
document.querySelectorAll('.mark-read-complaint').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const timestamp = e.target.getAttribute('data-timestamp');
        await fetch(`${API_BASE_URL}/api/admin/complaints/${timestamp}`, { method: 'DELETE' });
        fetchComplaints(); // Refresh the list
    });
});