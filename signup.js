document
  .getElementById('signup-form')
  .addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const address = document.getElementById('address').value;

    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Creating account...';
    submitButton.disabled = true;

    try {
      const response = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'signup',
          name, 
          email, 
          password, 
          address 
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Show success message
        alert('Account created successfully!');
        
        // Redirect to home page
        window.location.href = '/index.html';
      } else {
        alert(result.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Network error. Please check your internet connection and try again.');
    } finally {
      // Reset button state
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });
