// public/js/user.js (continued)

// Initialize sidebar toggle
function initSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const userLayout = document.querySelector('.user-layout');

    if (sidebarToggle && userLayout) {
        sidebarToggle.addEventListener('click', function() {
            userLayout.classList.toggle('sidebar-collapsed');
            
            // Save state to localStorage
            const isCollapsed = userLayout.classList.contains('sidebar-collapsed');
            localStorage.setItem('user-sidebar-collapsed', isCollapsed);
        });

        // Check localStorage on load
        const isCollapsed = localStorage.getItem('user-sidebar-collapsed') === 'true';
        if (isCollapsed) {
            userLayout.classList.add('sidebar-collapsed');
        }
    }

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 992) {
            const clickedInsideSidebar = e.target.closest('.sidebar');
            const clickedOnToggle = e.target.closest('#sidebarToggle');
            
            if (!clickedInsideSidebar && !clickedOnToggle && userLayout.classList.contains('sidebar-open')) {
                userLayout.classList.remove('sidebar-open');
            }
        }
    });

    // Handle mobile sidebar
    if (window.innerWidth < 992) {
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                userLayout.classList.toggle('sidebar-open');
            });
        }
    }

    // Adjust sidebar on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth < 992) {
            userLayout.classList.remove('sidebar-collapsed');
            if (sidebarToggle) {
                sidebarToggle.removeEventListener('click', toggleSidebar);
                sidebarToggle.addEventListener('click', function() {
                    userLayout.classList.toggle('sidebar-open');
                });
            }
        } else {
            userLayout.classList.remove('sidebar-open');
            if (sidebarToggle) {
                sidebarToggle.removeEventListener('click', toggleSidebar);
                sidebarToggle.addEventListener('click', function() {
                    userLayout.classList.toggle('sidebar-collapsed');
                    
                    // Save state to localStorage
                    const isCollapsed = userLayout.classList.contains('sidebar-collapsed');
                    localStorage.setItem('user-sidebar-collapsed', isCollapsed);
                });
            }

            // Check localStorage on resize
            const isCollapsed = localStorage.getItem('user-sidebar-collapsed') === 'true';
            if (isCollapsed) {
                userLayout.classList.add('sidebar-collapsed');
            }
        }
    });

    function toggleSidebar() {
        if (window.innerWidth < 992) {
            userLayout.classList.toggle('sidebar-open');
        } else {
            userLayout.classList.toggle('sidebar-collapsed');
            
            // Save state to localStorage
            const isCollapsed = userLayout.classList.contains('sidebar-collapsed');
            localStorage.setItem('user-sidebar-collapsed', isCollapsed);
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

// Initialize form validations
function initFormValidations() {
    // Simple client-side validation for required fields
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });

    // Custom validation for password matching
    const passwordConfirmation = document.getElementById('confirmPassword');
    if (passwordConfirmation) {
        const password = document.getElementById('password');
        
        passwordConfirmation.addEventListener('input', function() {
            if (this.value !== password.value) {
                this.setCustomValidity('Passwords do not match');
            } else {
                this.setCustomValidity('');
            }
        });

        password.addEventListener('input', function() {
            if (passwordConfirmation.value !== this.value) {
                passwordConfirmation.setCustomValidity('Passwords do not match');
            } else {
                passwordConfirmation.setCustomValidity('');
            }
        });
    }
}

// Initialize file input customization
function initFileInput() {
    // Custom file input display
    const fileInputs = document.querySelectorAll('.custom-file-input');
    
    fileInputs.forEach(function(input) {
        input.addEventListener('change', function(e) {
            const fileName = this.files[0]?.name || 'No file chosen';
            const nextSibling = this.nextElementSibling;
            
            if (nextSibling) {
                nextSibling.innerText = fileName;
            }
            
            // If there's a preview element
            const previewElement = document.querySelector(this.dataset.preview);
            if (previewElement && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previewElement.src = e.target.result;
                    previewElement.style.display = 'block';
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    });
}

// Initialize print functionality
function initPrintButtons() {
    const printButtons = document.querySelectorAll('.btn-print');
    
    printButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const printArea = document.querySelector(this.dataset.printTarget);
            if (printArea) {
                const originalContents = document.body.innerHTML;
                const printContents = printArea.innerHTML;
                
                document.body.innerHTML = `
                    <div class="print-container">
                        ${printContents}
                    </div>
                    <style>
                        @media print {
                            body {
                                margin: 0;
                                padding: 0;
                                font-family: 'Poppins', sans-serif;
                            }
                            .print-container {
                                width: 100%;
                                padding: 20px;
                            }
                            @page {
                                size: auto;
                                margin: 10mm;
                            }
                        }
                    </style>
                `;
                
                window.print();
                document.body.innerHTML = originalContents;
                window.location.reload();
            }
        });
    });
}

// Initialize activity registration
function initActivityRegistration() {
    const registerButtons = document.querySelectorAll('.btn-activity-register');
    
    registerButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const activityId = this.dataset.activityId;
            const url = this.dataset.registerUrl || '/user/activities/register';
            
            // Show confirmation dialog
            if (confirm('Apakah Anda yakin ingin mendaftar untuk kegiatan ini?')) {
                // AJAX request to register for activity
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                    },
                    body: JSON.stringify({ activityId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Show success message
                        alert(data.message || 'Anda berhasil mendaftar untuk kegiatan ini.');
                        
                        // Update UI
                        this.innerHTML = '<i class="fas fa-check"></i> Terdaftar';
                        this.classList.remove('btn-primary');
                        this.classList.add('btn-success');
                        this.disabled = true;
                        
                        // Update badge if exists
                        const statusBadge = document.querySelector(`.activity-status-badge[data-activity-id="${activityId}"]`);
                        if (statusBadge) {
                            statusBadge.textContent = 'Terdaftar';
                            statusBadge.classList.remove('bg-warning');
                            statusBadge.classList.add('bg-success');
                        }
                    } else {
                        alert(data.message || 'Gagal mendaftar untuk kegiatan ini.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Terjadi kesalahan. Silakan coba lagi.');
                });
            }
        });
    });
}

// Show active menu item based on URL
const currentLocation = window.location.pathname;
const menuItems = document.querySelectorAll('.sidebar .nav-link');
menuItems.forEach(function(item) {
    if (item.getAttribute('href') === currentLocation) {
        item.classList.add('active');
    }
});

// Certificate download tracking
const certificateDownloadButtons = document.querySelectorAll('.btn-certificate-download');
certificateDownloadButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        const certificateId = this.dataset.certificateId;
        const trackUrl = this.dataset.trackUrl || '/user/certificates/track-download';
        
        // AJAX request to track download
        fetch(trackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify({ certificateId })
        })
        .then(response => response.json())
        .catch(error => {
            console.error('Error tracking certificate download:', error);
        });
    });
});

// Membership card animation
const idCard = document.querySelector('.id-card');
if (idCard) {
    idCard.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xc = rect.width / 2;
        const yc = rect.height / 2;
        
        const dx = (x - xc) / 10;
        const dy = (y - yc) / 10;
        
        this.style.transform = `perspective(1000px) rotateY(${dx}deg) rotateX(${-dy}deg)`;
    });
    
    idCard.addEventListener('mouseleave', function() {
        this.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
    });
}