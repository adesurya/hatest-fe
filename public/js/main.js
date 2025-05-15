// public/js/main.js

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Hide preloader when page is fully loaded
    setTimeout(function() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(function() {
                preloader.style.display = 'none';
            }, 300);
        }
    }, 500);

    // Initialize Swiper sliders
    initSwipers();

    // Initialize AOS animation library
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    // Initialize back to top button
    initBackToTop();

    // Initialize counter animation
    initCounterAnimation();

    // Initialize tooltips and popovers
    initTooltipsPopovers();

    // Initialize dropdown hover
    initDropdownHover();

    // Initialize header scroll effect
    initHeaderScroll();

    // Check user auth status and update UI
    checkAuthStatus();

});

function checkAuthStatus() {
    const authToken = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // If there's a token and user data
    if (authToken && user && user.name) {
        // Find the login link to replace it with user dropdown
        const loginLink = document.querySelector('a[href="/auth/login"]');
        if (loginLink) {
            const userDropdown = document.createElement('div');
            userDropdown.className = 'dropdown';
            
            // Generate dropdown based on user role
            const dashboardLink = user.role === 'admin' || user.is_admin === 1 
                ? '/admin/dashboard' 
                : '/user/dashboard';
                
            const profileLink = user.role === 'admin' || user.is_admin === 1
                ? '/admin/profile'
                : '/user/profile';
            
            userDropdown.innerHTML = `
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownAccount" role="button"
                   data-bs-toggle="dropdown" aria-expanded="false">
                   <i class="fas fa-user-circle me-1"></i> ${user.name}
                </a>
                <ul class="dropdown-menu" aria-labelledby="navbarDropdownAccount">
                    <li><a class="dropdown-item" href="${dashboardLink}">${user.role === 'admin' || user.is_admin === 1 ? 'Admin Dashboard' : 'Dashboard'}</a></li>
                    <li><a class="dropdown-item" href="${profileLink}">Profil Saya</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logout-link">Logout</a></li>
                </ul>
            `;
            
            // Replace login link with user dropdown
            loginLink.parentNode.replaceWith(userDropdown);
            
            // Add event listener to logout link
            document.getElementById('logout-link').addEventListener('click', function(e) {
                e.preventDefault();
                // Clear localStorage
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                // Redirect to logout
                window.location.href = '/auth/logout';
            });
        }
    }
}

// Initialize Swiper sliders
function initSwipers() {
    // Hero Slider
    if (document.querySelector('.hero-swiper')) {
        new Swiper('.hero-swiper', {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.hero-swiper .swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.hero-swiper .swiper-button-next',
                prevEl: '.hero-swiper .swiper-button-prev',
            },
        });
    }

    // Testimonial Slider
    if (document.querySelector('.testimonial-swiper')) {
        new Swiper('.testimonial-swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.testimonial-swiper .swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                },
                992: {
                    slidesPerView: 3,
                },
            },
        });
    }

    // Sponsors Slider
    if (document.querySelector('.sponsors-swiper')) {
        new Swiper('.sponsors-swiper', {
            slidesPerView: 2,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            breakpoints: {
                576: {
                    slidesPerView: 3,
                },
                768: {
                    slidesPerView: 4,
                },
                992: {
                    slidesPerView: 5,
                },
            },
        });
    }
}

// Initialize back to top button
function initBackToTop() {
    const backToTopButton = document.querySelector('.back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('active');
            } else {
                backToTopButton.classList.remove('active');
            }
        });

        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Initialize counter animation
function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const countAnimation = () => {
            counters.forEach(counter => {
                const updateCount = () => {
                    const target = parseInt(counter.getAttribute('data-target'));
                    const count = parseInt(counter.innerText.replace(/,/g, ''));
                    const increment = Math.trunc(target / 100);

                    if (count < target) {
                        counter.innerText = (count + increment).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        setTimeout(updateCount, 10);
                    } else {
                        counter.innerText = target.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    }
                };
                updateCount();
            });
        };

        // Use Intersection Observer to trigger counter animation when visible
        const counterSection = document.querySelector('.counter-section');
        if (counterSection) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    countAnimation();
                    observer.unobserve(counterSection);
                }
            }, { threshold: 0.5 });

            observer.observe(counterSection);
        }
    }
}

// Initialize tooltips and popovers
function initTooltipsPopovers() {
    // Initialize tooltips if Bootstrap is loaded
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Initialize popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function(popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
}

// Initialize dropdown hover
function initDropdownHover() {
    const dropdowns = document.querySelectorAll('.navbar-nav .dropdown');
    if (window.innerWidth >= 992) {
        dropdowns.forEach(function(dropdown) {
            dropdown.addEventListener('mouseenter', function() {
                if (window.innerWidth >= 992) {
                    this.querySelector('.dropdown-toggle').click();
                }
            });
            dropdown.addEventListener('mouseleave', function() {
                if (window.innerWidth >= 992) {
                    this.querySelector('.dropdown-toggle').click();
                }
            });
        });
    }
}

// Initialize header scroll effect
function initHeaderScroll() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 100) {
                navbar.classList.add('navbar-scrolled', 'shadow-sm');
            } else {
                navbar.classList.remove('navbar-scrolled', 'shadow-sm');
            }
        });
    }
}

// Form validation functions
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
    const re = /^[0-9]{10,15}$/;
    return re.test(String(phone));
}

// Newsletter form submission
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        if (!validateEmail(email)) {
            alert('Please enter a valid email address.');
            emailInput.focus();
            return false;
        }
        
        // Here you would typically send the form data to your server
        // For demo purposes, we'll just show an alert
        alert('Thank you for subscribing to our newsletter!');
        this.reset();
    });
}

// Contact form submission
const contactForm = document.querySelector('#contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nameInput = this.querySelector('input[name="name"]');
        const emailInput = this.querySelector('input[name="email"]');
        const subjectInput = this.querySelector('input[name="subject"]');
        const messageInput = this.querySelector('textarea[name="message"]');
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();
        
        if (name === '') {
            alert('Please enter your name.');
            nameInput.focus();
            return false;
        }
        
        if (!validateEmail(email)) {
            alert('Please enter a valid email address.');
            emailInput.focus();
            return false;
        }
        
        if (subject === '') {
            alert('Please enter a subject.');
            subjectInput.focus();
            return false;
        }
        
        if (message === '') {
            alert('Please enter your message.');
            messageInput.focus();
            return false;
        }
        
        // Here you would typically send the form data to your server
        // For demo purposes, we'll just show an alert
        alert('Thank you for your message. We will get back to you soon!');
        this.reset();
    });
}

// Toggle password visibility in login/register forms
const togglePasswordButtons = document.querySelectorAll('.toggle-password, .toggle-confirm-password');
togglePasswordButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        const passwordInput = this.previousElementSibling;
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle eye icon
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
});

// Handle mobile navigation
const mobileMenuToggle = document.querySelector('.navbar-toggler');
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
        document.body.classList.toggle('mobile-nav-active');
    });
}