document
  .getElementById('signin-form')
  .addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Signing in...';
    submitButton.disabled = true;

    try {
      const response = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'signin',
          email, 
          password 
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Show success message
        alert('Sign in successful!');
        
        // Redirect to home page
        window.location.href = '/index.html';
      } else {
        alert(result.error || 'Sign in failed. Please try again.');
      }
    } catch (error) {
      console.error('Signin error:', error);
      alert('Network error. Please check your internet connection and try again.');
    } finally {
      // Reset button state
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });
