console.log('🔐 OAuth callback: Starting processing...');
console.log('🔐 OAuth callback: URL params:', window.location.search);

// Get the auth data from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const authData = urlParams.get('data') || urlParams.get('authData');

console.log('🔐 OAuth callback: Auth data found:', !!authData);

if (authData) {
    try {
        const data = JSON.parse(decodeURIComponent(authData));
        console.log('🔐 OAuth callback: Sending success message');
        
        if (window.opener) {
            window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                payload: data
            }, '*');
            console.log('🔐 OAuth callback: Message sent successfully');
        } else {
            console.error('🔐 OAuth callback: window.opener is null');
        }
        
        document.getElementById('message').textContent = 'Authentication complete! You can close this window.';
    } catch (error) {
        console.error('🔐 OAuth callback: Error processing auth data:', error);
        document.getElementById('message').textContent = 'Authentication failed. Please try again.';
    }
} else {
    console.error('🔐 OAuth callback: No auth data found');
    document.getElementById('message').textContent = 'Authentication failed. No data received.';
} 