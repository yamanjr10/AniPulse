// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || (prefersDark.matches ? 'dark' : 'light');
setTheme(savedTheme === 'dark');

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = !isDark ? 'dark' : 'light';
    setTheme(!isDark);
    localStorage.setItem('theme', newTheme);
});

// Password toggle
const passwordToggle = document.getElementById('passwordToggle');
if (passwordToggle) {
    const passwordInput = document.getElementById('password');
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

// Form submission handling
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const msgElement = document.getElementById('msg');

function showMessage(message, type = 'error') {
    msgElement.textContent = message;
    msgElement.className = type;
    
    if (type === 'success') {
        msgElement.classList.add('success');
        msgElement.classList.remove('error');
    } else {
        msgElement.classList.add('error');
        msgElement.classList.remove('success');
    }
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            msgElement.textContent = '';
            msgElement.className = '';
        }, 5000);
    }
}

// Login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        
        // Basic validation
        if (!email || !password) {
            showMessage('Please fill in all fields');
            return;
        }
        
        // Show loading state
        loginBtn.classList.add('loading');
        loginBtn.innerHTML = '<i class="fas fa-spinner"></i> Signing In...';
        
        try {
            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                showMessage('Login successful! Redirecting...', 'success');
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            } else {
                showMessage(data.message || 'Login failed');
                loginBtn.classList.remove('loading');
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            }
        } catch (error) {
            showMessage('Network error. Please try again.');
            loginBtn.classList.remove('loading');
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    });
}

// Signup form submission
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const signupBtn = document.getElementById('signupBtn');
        
        // Basic validation
        if (!username || !email || !password) {
            showMessage('Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters');
            return;
        }
        
        // Show loading state
        signupBtn.classList.add('loading');
        signupBtn.innerHTML = '<i class="fas fa-spinner"></i> Creating Account...';
        
        try {
            const res = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                showMessage('Account created successfully! Redirecting to login...', 'success');
                signupBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                
                // Redirect to login after delay
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                showMessage(data.message || 'Signup failed');
                signupBtn.classList.remove('loading');
                signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            }
        } catch (error) {
            showMessage('Network error. Please try again.');
            signupBtn.classList.remove('loading');
            signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    });
}

// Forgot password link
const forgotPassword = document.getElementById('forgotPassword');
if (forgotPassword) {
    forgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        showMessage('Password reset feature coming soon!', 'info');
    });
}

// Create particles for background
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) return;
    
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size and position
        const size = Math.random() * 4 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random color from theme
        const colors = ['var(--primary)', 'var(--accent)', 'var(--secondary)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}%`;
        particle.style.top = `${y}%`;
        particle.style.background = color;
        particle.style.animationDuration = `${Math.random() * 20 + 20}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Initialize particles on load
window.addEventListener('DOMContentLoaded', createParticles);

// Form input validation on blur
const inputs = document.querySelectorAll('input[required]');
inputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (!input.value) {
            input.style.borderColor = 'var(--danger)';
        } else {
            input.style.borderColor = '';
        }
    });
});