// Perbaikan untuk file public/js/file-path-adapter.js
/**
 * Fungsi adapter untuk path file agar konsisten dengan backend
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 File path adapter aktif');
    adaptFilePaths();
});

/**
 * Adaptasi semua path file pada halaman
 */
function adaptFilePaths() {
    // Adaptasi path untuk gambar profil
    document.querySelectorAll('img.profile-avatar, img.doctor-avatar').forEach(function(img) {
        const originalSrc = img.getAttribute('src');
        if (originalSrc && !originalSrc.startsWith('data:') && !originalSrc.includes('placeholder')) {
            // Simpan path asli sebagai atribut data untuk debugging
            img.setAttribute('data-original-src', originalSrc);
            
            // Adaptasi path
            const adaptedPath = adaptFilePath(originalSrc);
            img.setAttribute('src', adaptedPath);
            
            // Log hanya jika path berubah
            if (adaptedPath !== originalSrc) {
                console.log(`🖼️ Adaptasi gambar: ${originalSrc} → ${adaptedPath}`);
            }
            
            // Tangani error loading gambar
            img.addEventListener('error', function(e) {
                // Hindari infinite loop dengan memeriksa apakah sudah dicoba alternatif
                if (!this.hasAttribute('data-tried-alternative')) {
                    this.setAttribute('data-tried-alternative', 'true');
                    
                    // Coba alternatif path
                    this.src = tryAlternativePaths(originalSrc);
                    console.log(`⚠️ Coba alternatif: ${this.src}`);
                } else {
                    // Jika masih gagal, tampilkan placeholder
                    this.style.display = 'none';
                    console.log(`❌ Gambar tidak ditemukan: ${originalSrc}`);
                    
                    createAvatarPlaceholder(this);
                }
            });
        }
    });

    // Adaptasi path untuk link dokumen
    document.querySelectorAll('a[href*="dokumen"], a[href*="document"]').forEach(function(link) {
        const originalHref = link.getAttribute('href');
        if (originalHref && !originalHref.startsWith('http') && !originalHref.startsWith('data:')) {
            // Simpan path asli sebagai atribut data
            link.setAttribute('data-original-href', originalHref);
            
            // Adaptasi path
            const adaptedPath = adaptFilePath(originalHref);
            link.setAttribute('href', adaptedPath);
            
            // Log hanya jika path berubah
            if (adaptedPath !== originalHref) {
                console.log(`📄 Adaptasi dokumen: ${originalHref} → ${adaptedPath}`);
            }
        }
    });
}

/**
 * Adaptasi path file ke format yang konsisten
 * @param {string} path - Path file asli
 * @returns {string} - Path file yang sudah diadaptasi
 */
function adaptFilePath(path) {
    if (!path) return '';
    if (path.startsWith('data:')) return path; // Skip data URLs
    
    // Dapatkan nama file saja (tanpa path)
    const fileName = path.split('/').pop();
    
    // Jika sudah menggunakan format backend yang benar, kembalikan apa adanya
    if (path.startsWith('/uploads/profiles/') || path.startsWith('/uploads/documents/')) {
        return path;
    }
    
    // Coba tentukan jenis file berdasarkan namanya
    if (fileName.startsWith('profile_') || fileName.includes('profile') || 
        fileName.includes('avatar') || fileName.includes('foto')) {
        return `/uploads/profiles/${fileName}`;
    }
    
    if (fileName.startsWith('document_') || fileName.includes('doc') || 
        fileName.includes('pdf') || fileName.includes('file')) {
        return `/uploads/documents/${fileName}`;
    }
    
    // Cek pola dari path
    if (path.includes('/profile/') || path.includes('/foto_profil')) {
        return `/uploads/profiles/${fileName}`;
    }
    
    if (path.includes('/document/') || path.includes('/dokumen_pendukung')) {
        return `/uploads/documents/${fileName}`;
    }
    
    // Fallback: Kembalikan path asli
    return path;
}

/**
 * Coba alternatif path untuk file yang tidak ditemukan (mengurangi jumlah alternatif)
 * @param {string} originalPath - Path asli yang gagal dimuat
 * @returns {string} - Path alternatif yang bisa dicoba
 */
function tryAlternativePaths(originalPath) {
    if (!originalPath) return '/images/placeholder-avatar.png';
    
    const fileName = originalPath.split('/').pop();
    
    // Kurangi jumlah alternatif untuk mengurangi error
    const alternativePaths = [
        `/uploads/profiles/${fileName}`,
        `/uploads/documents/${fileName}`,
        `/uploads/${fileName}`
    ];
    
    // Pilih path alternatif pertama yang berbeda dari path asli
    for (const path of alternativePaths) {
        if (path !== originalPath) {
            return path;
        }
    }
    
    // Fallback ke placeholder image
    return '/images/placeholder-avatar.png';
}

/**
 * Buat placeholder avatar jika gambar tidak ditemukan
 * @param {HTMLImageElement} img - Elemen gambar yang error
 */
function createAvatarPlaceholder(img) {
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.avatar-placeholder')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'avatar-placeholder';
        placeholder.style.width = (img.width || 40) + 'px';
        placeholder.style.height = (img.height || 40) + 'px';
        placeholder.style.backgroundColor = '#4e73df';
        placeholder.style.color = '#fff';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.fontWeight = 'bold';
        placeholder.style.borderRadius = '50%';
        
        // Get initials (1 character) from context if possible
        let initial = '?';
        
        // Try to get name from parent text content
        const parentText = parent.textContent.trim();
        if (parentText.length > 0) {
            initial = parentText.charAt(0).toUpperCase();
        }
        
        // Try to get name from alt text
        const altText = img.getAttribute('alt');
        if (altText && altText.length > 0) {
            initial = altText.charAt(0).toUpperCase();
        }
        
        placeholder.textContent = initial;
        parent.appendChild(placeholder);
    }
}