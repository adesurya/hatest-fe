// public/js/admin.js

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

    // Initialize sidebar toggle
    initSidebarToggle();

    // Initialize tooltips and popovers
    initTooltipsPopovers();

    // Initialize datatables
    initDataTables();

    // Initialize form validations
    initFormValidations();

    // Initialize file input customization
    initFileInput();

    // Initialize date pickers
    initDatePickers();

    // Initialize WYSIWYG editors
    initEditors();
});

// Initialize sidebar toggle
function initSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const adminLayout = document.querySelector('.admin-layout');

    if (sidebarToggle && adminLayout) {
        sidebarToggle.addEventListener('click', function() {
            adminLayout.classList.toggle('sidebar-collapsed');
            
            // Save state to localStorage
            const isCollapsed = adminLayout.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed);
        });

        // Check localStorage on load
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        if (isCollapsed) {
            adminLayout.classList.add('sidebar-collapsed');
        }
    }

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 992) {
            const clickedInsideSidebar = e.target.closest('.sidebar');
            const clickedOnToggle = e.target.closest('#sidebarToggle');
            
            if (!clickedInsideSidebar && !clickedOnToggle && adminLayout.classList.contains('sidebar-open')) {
                adminLayout.classList.remove('sidebar-open');
            }
        }
    });

    // Handle mobile sidebar
    if (window.innerWidth < 992) {
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                adminLayout.classList.toggle('sidebar-open');
            });
        }
    }

    // Adjust sidebar on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth < 992) {
            adminLayout.classList.remove('sidebar-collapsed');
            if (sidebarToggle) {
                sidebarToggle.removeEventListener('click', toggleSidebar);
                sidebarToggle.addEventListener('click', function() {
                    adminLayout.classList.toggle('sidebar-open');
                });
            }
        } else {
            adminLayout.classList.remove('sidebar-open');
            if (sidebarToggle) {
                sidebarToggle.removeEventListener('click', toggleSidebar);
                sidebarToggle.addEventListener('click', function() {
                    adminLayout.classList.toggle('sidebar-collapsed');
                    
                    // Save state to localStorage
                    const isCollapsed = adminLayout.classList.contains('sidebar-collapsed');
                    localStorage.setItem('sidebar-collapsed', isCollapsed);
                });
            }

            // Check localStorage on resize
            const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            if (isCollapsed) {
                adminLayout.classList.add('sidebar-collapsed');
            }
        }
    });

    function toggleSidebar() {
        if (window.innerWidth < 992) {
            adminLayout.classList.toggle('sidebar-open');
        } else {
            adminLayout.classList.toggle('sidebar-collapsed');
            
            // Save state to localStorage
            const isCollapsed = adminLayout.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed);
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

// Initialize datatables
function initDataTables() {
    // Check if DataTable is available and there are tables to transform
    if (typeof $.fn.DataTable !== 'undefined') {
        $('.datatable').each(function() {
            $(this).DataTable({
                responsive: true,
                language: {
                    search: "_INPUT_",
                    searchPlaceholder: "Search...",
                    lengthMenu: "Show _MENU_ entries",
                    info: "Showing _START_ to _END_ of _TOTAL_ entries",
                    infoEmpty: "Showing 0 to 0 of 0 entries",
                    infoFiltered: "(filtered from _MAX_ total entries)",
                    paginate: {
                        first: "First",
                        last: "Last",
                        next: "<i class='fas fa-chevron-right'></i>",
                        previous: "<i class='fas fa-chevron-left'></i>"
                    }
                }
            });
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

// Initialize date pickers
function initDatePickers() {
    // Check if Flatpickr is available
    if (typeof flatpickr !== 'undefined') {
        flatpickr('.datepicker', {
            dateFormat: 'Y-m-d',
            allowInput: true
        });
        
        flatpickr('.datetimepicker', {
            enableTime: true,
            dateFormat: 'Y-m-d H:i',
            allowInput: true
        });
    }
}

// Initialize WYSIWYG editors
function initEditors() {
    // Check if TinyMCE is available
    if (typeof tinymce !== 'undefined') {
        tinymce.init({
            selector: '.tinymce',
            height: 300,
            menubar: false,
            plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount'
            ],
            toolbar: 'undo redo | formatselect | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        });
    }
}

// Confirmation dialog for delete actions
const deleteButtons = document.querySelectorAll('[data-confirm]');
deleteButtons.forEach(function(button) {
    button.addEventListener('click', function(e) {
        if (!confirm(this.dataset.confirm || 'Are you sure you want to delete this item?')) {
            e.preventDefault();
        }
    });
});

// Show active menu item based on URL
const currentLocation = window.location.pathname;
const menuItems = document.querySelectorAll('.sidebar .nav-link');
menuItems.forEach(function(item) {
    if (item.getAttribute('href') === currentLocation) {
        item.classList.add('active');
    }
});

// Toggle status switches
const statusSwitches = document.querySelectorAll('.status-switch');
statusSwitches.forEach(function(switchEl) {
    switchEl.addEventListener('change', function() {
        const id = this.dataset.id;
        const status = this.checked ? 1 : 0;
        const url = this.dataset.url;
        
        // AJAX request to update status
        // This is just a template, you'll need to adapt it to your backend
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify({ id, status })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success message
                const toast = new bootstrap.Toast(document.getElementById('statusToast'));
                document.getElementById('statusToastBody').textContent = data.message || 'Status updated successfully.';
                toast.show();
            } else {
                // Revert switch if failed
                this.checked = !this.checked;
                alert(data.message || 'Failed to update status.');
            }
        })
        .catch(error => {
            // Revert switch on error
            this.checked = !this.checked;
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });
});