document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil elemen HTML yang dibutuhkan
    const tabMasuk = document.getElementById('tab-masuk');
    const tabDaftar = document.getElementById('tab-daftar');
    const loginForm = document.getElementById('login-form');
    const submitBtn = document.querySelector('.btn-submit-orange');

    // 2. Simulasi Alur Kerja jika Tombol "Buat Akun" diklik
    tabDaftar.addEventListener('click', function() {
        tabMasuk.classList.remove('active');
        tabDaftar.classList.add('active');
        
        // Mengubah teks tombol secara instan menjadi form registrasi
        submitBtn.innerHTML = 'Daftar Akun Baru <span class="arrow-icon">→</span>';
    });

    // 3. Simulasi Kembali ke Form Masuk
    tabMasuk.addEventListener('click', function() {
        tabDaftar.classList.remove('active');
        tabMasuk.classList.add('active');
        submitBtn.innerHTML = 'Masuk ke PatunganTrack <span class="arrow-icon">→</span>';
    });

    // 4. Simulasi Validasi Masuk Halaman (Pindah ke dashboard)
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            alert("Autentikasi Berhasil (Simulasi Frontend)!");
            window.location.href = "index.html"; // Pindah ke dashboard utama
        });
    }
});
