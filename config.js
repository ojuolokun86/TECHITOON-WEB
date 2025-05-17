const URL = 'https://m-bot-production-84d7.up.railway.app';
//const URL = 'http://localhost:3000'; // Replace with your actual URL



const API_BASE_URL = URL; // Replace with process.env.API_BASE_URL in a bundler
const SOCKET_BASE_URL = URL; // Replace with process.env.SOCKET_BASE_URL in a bundler



export { API_BASE_URL, SOCKET_BASE_URL };




 export function createSocket() {
    return io(SOCKET_BASE_URL, {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });
}
