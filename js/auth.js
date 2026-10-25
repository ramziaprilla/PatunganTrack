// ==========================================
// 1. IMPORT SUPABASE (HARUS DI PALING ATAS)
// ==========================================
import { supabase } from './supabase.js';

// ==========================================
// 2. HELPER & UTILS ERROR SUPABASE
// ==========================================
const ERROR_ID = {
  'Invalid login credentials': 'Email atau kata sandi salah.',
  'User already registered': 'Email ini sudah terdaftar. Silakan masuk.',
  'Email not confirmed': 'Email belum dikonfirmasi. Cek kotak masuk Anda.'
};

function toMessage(error) {
  if (/at least 6 characters/i.test(error.message)) return 'Kata sandi minimal 6 karakter.';
  return ERROR_ID[error.message] ?? error.message;
}

// ==========================================
// 3. FUNGSI LOGIKA SUPABASE (REGISTER & LOGIN)
// ==========================================
export async function register(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw new Error(toMessage(error));
  return { user: data.user, needsConfirmation: !data.session };
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw new Error(toMessage(error));
  return data;
}

// ==========================================
// 4. EVENT LISTENER UI DOM & FORM INTEGRATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const tabMasuk = document.getElementById('tab-masuk');
  const tabDaftar = document.getElementById('tab-daftar');
  const loginForm = document.getElementById('login-form');
  const submitBtn = document.querySelector('.btn-submit-orange');
  const togglePassword = document.querySelector('.toggle-password-icon');
  const passwordInput = document.getElementById('password');

  // --- A. Toggle Lihat Password (Ikon Mata) ---
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    });
  }

  // --- B. Perpindahan Tab UI (Masuk vs Buat Akun) ---
  if (tabDaftar && tabMasuk) {
    tabDaftar.addEventListener('click', () => {
      tabMasuk.classList.remove('active');
      tabDaftar.classList.add('active');
      if (submitBtn) {
        submitBtn.innerHTML = 'Daftar Akun Baru <span class="arrow-icon">→</span>';
      }
    });

    tabMasuk.addEventListener('click', () => {
      tabDaftar.classList.remove('active');
      tabMasuk.classList.add('active');
      if (submitBtn) {
        submitBtn.innerHTML = 'Masuk ke PatunganTrack <span class="arrow-icon">→</span>';
      }
    });
  }

  // --- C. Submit Form ke Supabase Asli ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Menahan refresh bawaan browser

      const emailVal = document.getElementById('email')?.value.trim();
      const passwordVal = document.getElementById('password')?.value;
      const isDaftar = tabDaftar?.classList.contains('active');

      if (!emailVal || !passwordVal) {
        alert('Harap isi email dan kata sandi!');
        return;
      }

      // Ubah teks tombol jadi loading
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Memproses...';

      try {
        if (isDaftar) {
          // Eksekusi Register Supabase
          const res = await register(emailVal, passwordVal, 'Pengguna Baru');
          if (res.needsConfirmation) {
            alert('Pendaftaran berhasil! Silakan cek email kamu untuk konfirmasi.');
          } else {
            alert('Pendaftaran berhasil!');
            window.location.href = 'index.html';
          }
        } else {
          // Eksekusi Login Supabase
          await login(emailVal, passwordVal);
          window.location.href = 'index.html'; // Pindah ke dashboard
        }
      } catch (err) {
        // Tampilkan error asli dari database/Supabase
        alert('Gagal: ' + err.message);
      } finally {
        // Kembalikan tombol ke semula
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
});