import { API_BASE_URL, SOCKET_BASE_URL, createSocket } from "./config.js";

const socket = createSocket();
console.log('🔗 Connected to WebSocket server'); // Debug log

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const authId = urlParams.get('authId'); // Extract auth_id from query parameters

    if (!authId) {
        console.error('❌ Auth ID is missing in the URL.');
        return;
    }

    console.log(`🔍 Auth ID retrieved from URL: ${authId}`); // Debug log

    // Store auth_id in local storage for use during registration
    localStorage.setItem('auth_id', authId);
});

const registerForm = document.getElementById('registerForm');
const registerResponseMessage = document.getElementById('registerResponseMessage');
const qrCodeContainer = document.getElementById('qrCodeContainer');

if (!registerForm) {
    console.error('❌ registerForm element not found in the DOM.');
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage
    const registerResponseMessage = document.getElementById('registerResponseMessage');

    console.log('🔍 Retrieved auth_id from local storage:', authId);

    if (!authId) {
        console.error('❌ Auth ID is missing. Please log in again.');
        registerResponseMessage.textContent = '❌ Auth ID is missing. Please log in again.';
        registerResponseMessage.classList.add('error');
        return;
    }

    console.log(`📥 Registering bot with phone number: ${phoneNumber}, auth_id: ${authId}`); // Debug log

    try {
        // Validate the token before proceeding
        const tokenValidationResponse = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ authId }),
        });

        const tokenValidationData = await tokenValidationResponse.json();

        if (!tokenValidationResponse.ok) {
            console.error(`❌ Token validation failed: ${tokenValidationData.message}`);
            registerResponseMessage.textContent = `❌ ${tokenValidationData.message}`;
            registerResponseMessage.classList.add('error');

            // Send notification to the user
            await sendNotification(
                'Your token is invalid or expired. Please contact the developer to renew your token.',
                authId
            );
            return;
        }

        console.log('✅ Token validated successfully.');

        // Proceed with bot registration
        const registrationResponse = await fetch(`${API_BASE_URL}/api/start-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber, authId }), // Include auth_id in the request body
        });

        const registrationData = await registrationResponse.json();

        if (registrationResponse.ok) {
            console.log('✅ Bot registered successfully:', registrationData);
            registerResponseMessage.textContent = '✅ Bot registered successfully! Waiting for QR code...';
            registerResponseMessage.classList.add('success');
        } else {
            console.error(`❌ Bot registration failed: ${registrationData.message}`);
            registerResponseMessage.textContent = `❌ ${registrationData.message}`;
            registerResponseMessage.classList.add('error');

            // Send notification to the user
            await sendNotification(
                `Failed to register bot for phone number ${phoneNumber}: ${registrationData.message}`,
                authId
            );
        }
    } catch (error) {
        console.error('❌ Error during bot registration:', error.message);
        registerResponseMessage.textContent = '❌ Error registering bot. Please try again later.';
        registerResponseMessage.classList.add('error');

        // Send notification to the user
        await sendNotification('An error occurred during bot registration. Please try again later.', authId);
    }
});

/**
 * Send a notification to the user.
 * @param {string} message - The notification message.
 * @param {string} authId - The user's Auth ID.
 */
const sendNotification = async (message, authId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, authId }),
        });

        if (response.ok) {
            console.log('✅ Notification sent successfully.');
        } else {
            console.error('❌ Failed to send notification.');
        }
    } catch (error) {
        console.error('❌ Error sending notification:', error.message);
    }
};

socket.on('qr', (data) => {
    const { qrImage } = data;
    console.log(`📱 Raw QR code image received:`, qrImage); // Debug log

    // Display the QR code image in the designated container
    qrCodeContainer.innerHTML = `<img src="${qrImage}" alt="QR Code">`;

    console.log('✅ WhatsApp QR code displayed successfully.');
});

// Listen for registration status updates
socket.on('registration-status', (data) => {
    const { status, message } = data;

    console.log(`📣 Registration status: ${status} - ${message}`);

    registerResponseMessage.textContent = message;
    registerResponseMessage.classList.remove('success', 'error');
    registerResponseMessage.classList.add(status === 'success' ? 'success' : 'error');

    if (status === 'success') {
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }
});

socket.on('qr-clear', (data) => {
    console.log(`🧹 Clearing QR code`);

    // Clear the QR code container
    qrCodeContainer.innerHTML = '';
});


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneNumber = urlParams.get('phoneNumber');

    if (phoneNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/rescan-qr/${phoneNumber}`);
            const data = await response.json();

            if (response.ok) {
                const qrCodeContainer = document.getElementById('qrCodeContainer');
                qrCodeContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
            } else {
                console.error('❌ Failed to fetch QR code:', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching QR code:', error.message);
        }
    }
});