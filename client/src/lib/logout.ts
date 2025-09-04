// Logout utility function
export async function handleLogout() {
  try {
    // Make logout request in background
    await fetch('/api/logout', {
      method: 'GET',
      credentials: 'include'
    });
  } catch (error) {
    console.log('Logout request completed');
  }
  
  // Always redirect to home page regardless of API response
  window.location.href = '/';
}