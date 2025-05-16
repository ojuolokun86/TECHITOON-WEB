import { API_BASE_URL, SOCKET_BASE_URL, createSocket } from "./config.js";
console.log('🔗 Connected to API server:', API_BASE_URL); // Debug log
const socket = createSocket();

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
            <td>${user.email || 'N/A'}</td> <!-- Handle missing email -->
            <td>${user.auth_id}</td> <!-- Use auth_id as returned by the backend -->
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
            deleteUser(user.phoneNumber, user.authId);
        });

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart';
        restartButton.style.marginLeft = '10px';
        restartButton.addEventListener('click', () => {
            restartBot(user.phoneNumber, user.authId);
        });

        actionsCell.appendChild(deleteButton);
        actionsCell.appendChild(restartButton);
        row.appendChild(actionsCell);

        userTableMemoryBody.appendChild(row);
    });
};

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
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>Auth ID:</strong> ${complaint.auth_id} <br>
                    <strong>Message:</strong> ${complaint.message} <br>
                    <strong>Timestamp:</strong> ${complaint.timestamp}
                `;
                complaintsList.appendChild(li);
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