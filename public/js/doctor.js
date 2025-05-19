// public/js/doctors.js - Perbaikan untuk preview foto dan event handlers lainnya

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DataTable if available
    initDataTable();
    
    // Initialize map for doctor detail or form
    initMap();
    
    // Initialize profile photo upload
    initProfilePhotoUpload();
    
    // Initialize document upload
    initDocumentUpload();
    
    // Initialize verification form
    initVerificationForm();
    
    // Initialize search functionality
    initSearch();
    
    // Initialize delete confirmation
    initDeleteConfirmation();
    
    // Initialize form validation
    initFormValidation();

    // Periksa apakah tabel doctorsTable ada
    const tableElement = document.getElementById('doctorsTable');
    if (!tableElement) return;
    
    // Setup manual sorting
    const headers = tableElement.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        // Jangan tambahkan sorting ke kolom aksi (biasanya kolom terakhir)
        if (index === headers.length - 1) return;
        
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            sortTable(index);
        });
        
        // Tambahkan ikon sort
        const sortIcon = document.createElement('span');
        sortIcon.className = 'ms-1 text-muted sort-icon';
        sortIcon.innerHTML = '<i class="fas fa-sort"></i>';
        header.appendChild(sortIcon);
    });
});

// Initialize DataTable
function initDataTable() {
    // Periksa apakah DataTable tersedia dan ada tabel untuk ditransformasi
    if (typeof $.fn !== 'undefined' && typeof $.fn.DataTable !== 'undefined') {
        try {
            // Cek struktur tabel terlebih dahulu untuk debugging
            const tableElement = document.getElementById('doctorsTable');
            if (!tableElement) {
                console.log('Table #doctorsTable not found');
                return;
            }
            
            const headerCells = tableElement.querySelectorAll('thead th').length;
            const firstRow = tableElement.querySelector('tbody tr');
            const bodyCells = firstRow ? firstRow.querySelectorAll('td').length : 0;
            
            console.log(`DataTable check - Header cells: ${headerCells}, Body cells: ${bodyCells}`);
            
            // Jika jumlah kolom tidak cocok dan ada data, tampilkan peringatan
            if (headerCells !== bodyCells && bodyCells > 0) {
                console.warn(`Column count mismatch in doctorsTable: ${headerCells} in header vs ${bodyCells} in body.`);
                console.warn('DataTables initialization might fail. Using manual sorting instead.');
                return; // Skip DataTables initialization
            }
            
            // Inisialisasi dengan konfigurasi yang lebih sederhana
            $('#doctorsTable').DataTable({
                responsive: true,
                paging: false,     // Gunakan paginasi sendiri
                ordering: true,    // Aktifkan pengurutan
                searching: false,  // Gunakan pencarian sendiri
                info: false,       // Tanpa informasi paginasi
                columnDefs: [
                    { orderable: false, targets: -1 }  // Kolom terakhir (-1) tidak dapat diurutkan
                ]
            });
            
            console.log('DataTable initialized successfully');
        } catch (error) {
            console.error('Error initializing DataTable:', error);
            console.log('Falling back to manual sorting');
        }
    } else {
        console.log('DataTables library not available, using manual sorting');
    }
}

// Initialize Map
function initMap() {
    // Check if Leaflet is available and map container exists
    if (typeof L !== 'undefined' && document.getElementById('map')) {
        // Get default coordinates or use Jakarta as fallback
        let lat = parseFloat(document.getElementById('latitude')?.value || '-6.2088');
        let lng = parseFloat(document.getElementById('longitude')?.value || '106.8456');
        
        // Initialize map
        let map = L.map('map').setView([lat, lng], 12);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add marker if coordinates exist
        let marker;
        if (!isNaN(lat) && !isNaN(lng)) {
            marker = L.marker([lat, lng]).addTo(map);
        }
        
        // Handle map click for form
        if (document.getElementById('doctorForm')) {
            map.on('click', function(e) {
                if (marker) {
                    map.removeLayer(marker);
                }
                
                marker = L.marker(e.latlng).addTo(map);
                
                // Update latitude and longitude inputs
                document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
                document.getElementById('longitude').value = e.latlng.lng.toFixed(6);
            });
        }
        
        // Store map instance for later access
        window.doctorMap = map;
        window.doctorMarker = marker;
        
        // Fix map rendering issues by triggering resize after load
        setTimeout(function() {
            map.invalidateSize();
        }, 500);
    }
}

// Initialize Profile Photo Upload - PERBAIKAN
function initProfilePhotoUpload() {
    const profilePhoto = document.getElementById('profile_photo');
    const browseProfileBtn = document.getElementById('browseProfileBtn');
    const profilePreview = document.getElementById('profilePreview');
    const profileOverlay = document.getElementById('profileOverlay');
    const removeProfileBtn = document.getElementById('removeProfileBtn');
    
    if (!profilePhoto) return;
    console.log("Initializing profile photo upload...");
    
    // Click on profile preview triggers file input - PERBAIKAN
    if (profilePreview) {
        profilePreview.addEventListener('click', function(e) {
            // Hindari memicu file input jika yang diklik adalah tombol hapus
            if (e.target.closest('#removeProfileBtn')) {
                return;
            }
            console.log("Profile preview clicked, triggering file input");
            profilePhoto.click();
        });
    }
    
    // Browse button triggers file input
    if (browseProfileBtn) {
        browseProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Browse button clicked, triggering file input");
            profilePhoto.click();
        });
    }
    
    // Handle profile photo change - PERBAIKAN
    profilePhoto.addEventListener('change', function() {
        console.log("Profile photo input changed");
        const file = this.files[0];
        if (file) {
            if (!isValidImageFile(file)) {
                alert('Silakan pilih file gambar yang valid (JPG, JPEG, PNG, GIF)');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Ukuran file tidak boleh melebihi 5MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                console.log("File read complete, updating preview");
                
                // Cari atau buat elemen gambar untuk preview
                let profileImage = document.getElementById('profileImage');
                let profilePlaceholder = document.getElementById('profilePlaceholder');
                
                if (!profileImage) {
                    console.log("Creating new image element for preview");
                    profileImage = document.createElement('img');
                    profileImage.id = 'profileImage';
                    profileImage.alt = 'Profile Preview';
                    profileImage.style.width = '100%';
                    profileImage.style.height = '100%';
                    profileImage.style.objectFit = 'cover';
                    profilePreview.appendChild(profileImage);
                }
                
                profileImage.src = e.target.result;
                profileImage.style.display = 'block';
                
                if (profilePlaceholder) {
                    profilePlaceholder.style.display = 'none';
                }
                
                // Add remove button if it doesn't exist
                if (!removeProfileBtn) {
                    console.log("Creating remove button");
                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.id = 'removeProfileBtn';
                    removeBtn.className = 'btn btn-outline-danger ms-2';
                    removeBtn.innerHTML = '<i class="fas fa-trash-alt me-1"></i> Hapus';
                    removeBtn.addEventListener('click', removeProfilePhoto);
                    
                    if (browseProfileBtn) {
                        browseProfileBtn.parentNode.insertBefore(removeBtn, browseProfileBtn.nextSibling);
                    }
                } else {
                    removeProfileBtn.style.display = 'inline-block';
                }
                
                // Reset remove flag
                const removeFlag = document.getElementById('remove_profile');
                if (removeFlag) {
                    removeFlag.value = '0';
                }
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Remove profile photo
    if (removeProfileBtn) {
        removeProfileBtn.addEventListener('click', removeProfilePhoto);
    }
    
    function removeProfilePhoto(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Remove profile photo triggered");
        
        const removeFlag = document.getElementById('remove_profile');
        if (removeFlag) {
            removeFlag.value = '1';
        }
        
        const profileImage = document.getElementById('profileImage');
        let profilePlaceholder = document.getElementById('profilePlaceholder');
        
        if (profileImage) {
            profileImage.style.display = 'none';
            profileImage.src = '';
        }
        
        if (profilePhoto) {
            profilePhoto.value = '';
        }
        
        if (!profilePlaceholder) {
            console.log("Creating new placeholder");
            profilePlaceholder = document.createElement('i');
            profilePlaceholder.className = 'fas fa-user-circle profile-placeholder';
            profilePlaceholder.id = 'profilePlaceholder';
            profilePreview.appendChild(profilePlaceholder);
        } else {
            profilePlaceholder.style.display = 'block';
        }
        
        if (this) {
            this.style.display = 'none';
        }
    }
    
    function isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        return validTypes.includes(file.type);
    }
}

// Initialize Document Upload
function initDocumentUpload() {
    const supportingDocument = document.getElementById('supporting_document');
    const documentPreview = document.getElementById('documentPreview');
    
    if (!supportingDocument || !documentPreview) return;
    
    documentPreview.addEventListener('click', function(e) {
        e.preventDefault();
        console.log("Document preview clicked, triggering file input");
        supportingDocument.click();
    });
    
    supportingDocument.addEventListener('change', function() {
        console.log("Supporting document input changed");
        const file = this.files[0];
        if (file) {
            if (!isValidDocumentFile(file)) {
                alert('Silakan pilih file dokumen yang valid (PDF, DOC, DOCX)');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Ukuran file tidak boleh melebihi 5MB');
                return;
            }
            
            const documentIcon = document.getElementById('documentIcon');
            const documentText = document.getElementById('documentText');
            
            if (documentIcon && documentText) {
                let icon = 'fa-file';
                
                if (file.name.endsWith('.pdf')) {
                    icon = 'fa-file-pdf';
                } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                    icon = 'fa-file-word';
                }
                
                documentIcon.innerHTML = `<i class="fas ${icon}"></i>`;
                documentText.innerHTML = `${file.name}<br><small>(${formatFileSize(file.size)})</small>`;
            }
        }
    });
    
    function isValidDocumentFile(file) {
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        return validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize Verification Form
function initVerificationForm() {
    const verificationForm = document.querySelector('form[action*="verify"]');
    const verificationStatus = document.getElementById('verification_status');
    const verificationNotes = document.getElementById('verification_notes');
    
    if (!verificationForm || !verificationStatus) return;
    
    verificationStatus.addEventListener('change', function() {
        if (this.value === 'Ditolak' && verificationNotes) {
            verificationNotes.setAttribute('required', 'required');
            verificationNotes.focus();
        } else if (verificationNotes) {
            verificationNotes.removeAttribute('required');
        }
    });
    
    verificationForm.addEventListener('submit', function(e) {
        if (verificationStatus.value === 'Ditolak' && (!verificationNotes.value || verificationNotes.value.trim() === '')) {
            e.preventDefault();
            alert('Mohon berikan catatan mengapa dokumen ditolak');
            verificationNotes.focus();
        }
    });
}

// Initialize Search Functionality
function initSearch() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const filterVerification = document.getElementById('filterVerification');
    
    if (!searchForm) return;
    
    // Handle search input enter key
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchForm.submit();
            }
        });
    }
    
    // Handle filter change
    if (filterVerification) {
        filterVerification.addEventListener('change', function() {
            searchForm.submit();
        });
    }
}

// Initialize Delete Confirmation
function initDeleteConfirmation() {
    const deleteButtons = document.querySelectorAll('.delete-doctor');
    const deleteForm = document.getElementById('deleteForm');
    const doctorNameToDelete = document.getElementById('doctorNameToDelete');
    
    if (!deleteButtons.length) return;
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const doctorId = this.getAttribute('data-id');
            const doctorName = this.getAttribute('data-name');
            
            if (doctorNameToDelete) {
                doctorNameToDelete.textContent = doctorName;
            }
            
            if (deleteForm) {
                deleteForm.action = `/admin/doctors/delete/${doctorId}`;
            }
        });
    });
}

// Initialize Form Validation
function initFormValidation() {
    const doctorForm = document.getElementById('doctorForm');
    
    if (!doctorForm) return;
    
    doctorForm.addEventListener('submit', function(e) {
        const requiredFields = this.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
                
                // Add error message if not exists
                let errorMessage = field.nextElementSibling;
                if (!errorMessage || !errorMessage.classList.contains('invalid-feedback')) {
                    errorMessage = document.createElement('div');
                    errorMessage.className = 'invalid-feedback';
                    errorMessage.textContent = 'Field ini wajib diisi';
                    field.parentNode.insertBefore(errorMessage, field.nextSibling);
                }
            } else {
                field.classList.remove('is-invalid');
                
                // Remove error message if exists
                const errorMessage = field.nextElementSibling;
                if (errorMessage && errorMessage.classList.contains('invalid-feedback')) {
                    errorMessage.remove();
                }
            }
        });
        
        // Validate NIK length
        const nikField = document.getElementById('nik_number');
        if (nikField && nikField.value.trim().length !== 16 && nikField.value.trim() !== '') {
            isValid = false;
            nikField.classList.add('is-invalid');
            
            // Add error message if not exists
            let errorMessage = nikField.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('invalid-feedback')) {
                errorMessage = document.createElement('div');
                errorMessage.className = 'invalid-feedback';
                errorMessage.textContent = 'NIK harus 16 digit';
                nikField.parentNode.insertBefore(errorMessage, nikField.nextSibling);
            }
        }
        
        // Validate phone number
        const phoneField = document.getElementById('phone_number');
        if (phoneField && phoneField.value.trim() !== '' && !isValidPhoneNumber(phoneField.value)) {
            isValid = false;
            phoneField.classList.add('is-invalid');
            
            // Add error message if not exists
            let errorMessage = phoneField.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('invalid-feedback')) {
                errorMessage = document.createElement('div');
                errorMessage.className = 'invalid-feedback';
                errorMessage.textContent = 'Format nomor telepon tidak valid (contoh: 081234567890)';
                phoneField.parentNode.insertBefore(errorMessage, phoneField.nextSibling);
            }
        }
        
        // Validate email
        const emailField = document.getElementById('email');
        if (emailField && emailField.value.trim() !== '' && !isValidEmail(emailField.value)) {
            isValid = false;
            emailField.classList.add('is-invalid');
            
            // Add error message if not exists
            let errorMessage = emailField.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('invalid-feedback')) {
                errorMessage = document.createElement('div');
                errorMessage.className = 'invalid-feedback';
                errorMessage.textContent = 'Format email tidak valid';
                emailField.parentNode.insertBefore(errorMessage, emailField.nextSibling);
            }
        }
        
        if (!isValid) {
            e.preventDefault();
            // Scroll to first invalid field
            const firstInvalidField = document.querySelector('.is-invalid');
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalidField.focus();
            }
        }
    });
    
    // Real-time validation for NIK
    const nikField = document.getElementById('nik_number');
    if (nikField) {
        nikField.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 16) {
                this.value = this.value.slice(0, 16);
            }
        });
    }
    
    // Real-time validation for phone
    const phoneField = document.getElementById('phone_number');
    if (phoneField) {
        phoneField.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    function isValidPhoneNumber(phone) {
        const phonePattern = /^(08|\+628)[0-9]{8,11}$/;
        return phonePattern.test(phone);
    }
    
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }
}

// Sidebar Toggle Function
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
}

// Fungsi untuk mengurutkan tabel
function sortTable(columnIndex) {
    const table = document.getElementById('doctorsTable');
    if (!table) return;
    
    const isAscending = !table.getAttribute('data-sort-asc') || 
                        table.getAttribute('data-sort-asc') === 'false';
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    
    // Hapus indikator sort dari semua header
    const sortIcons = table.querySelectorAll('.sort-icon');
    sortIcons.forEach(icon => {
        icon.innerHTML = '<i class="fas fa-sort"></i>';
    });
    
    // Set indikator sort pada header yang aktif
    const headers = table.querySelectorAll('thead th');
    const sortIcon = headers[columnIndex].querySelector('.sort-icon');
    if (sortIcon) {
        sortIcon.innerHTML = isAscending ? 
            '<i class="fas fa-sort-up"></i>' : 
            '<i class="fas fa-sort-down"></i>';
    }
    
    // Urutkan baris
    rows.sort((rowA, rowB) => {
        // Dapatkan nilai dari kolom yang diurutkan
        const cellA = rowA.querySelectorAll('td')[columnIndex];
        const cellB = rowB.querySelectorAll('td')[columnIndex];
        
        if (!cellA || !cellB) return 0;
        
        let valueA = cellA.textContent.trim();
        let valueB = cellB.textContent.trim();
        
        // Konversi ke tanggal jika formatnya terlihat seperti tanggal
        if (valueA.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        }
        // Konversi ke angka jika kedua nilai adalah angka
        else if (!isNaN(valueA) && !isNaN(valueB)) {
            valueA = parseFloat(valueA);
            valueB = parseFloat(valueB);
        }
        
        // Lakukan perbandingan
        if (valueA < valueB) return isAscending ? -1 : 1;
        if (valueA > valueB) return isAscending ? 1 : -1;
        return 0;
    });
    
    // Perbarui tabel dengan baris yang diurutkan
    const tbody = table.querySelector('tbody');
    rows.forEach(row => tbody.appendChild(row));
    
    // Perbarui atribut sorting
    table.setAttribute('data-sort-asc', isAscending.toString());
    table.setAttribute('data-sort-col', columnIndex.toString());
}