
import { supabase } from './supabase.js';

const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');
const message = document.querySelector('#message');

// Register akun baru
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      message.textContent = error.message;
      return;
    }

    message.textContent = data.session
      ? 'Registrasi berhasil!'
      : 'Registrasi berhasil. Periksa email untuk verifikasi.';

    if (data.session) {
      window.location.href = 'dashboard.html';
    }
  });
}

// Login akun
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      message.textContent = error.message;
      return;
    }

    window.location.href = 'dashboard.html';
  });
}
