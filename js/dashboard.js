import { supabase } from './supabase.js';

const message = document.querySelector('#message');
const groupList = document.querySelector('#groupList');
const userEmail = document.querySelector('#userEmail');

// Memastikan pengguna sudah login
const { data: { user }, error: userError } =
  await supabase.auth.getUser();

if (userError || !user) {
  window.location.href = 'index.html';
} else {
  userEmail.textContent = `Login sebagai: ${user.email}`;
  await loadGroups();
}

// Mengambil grup yang dapat diakses pengguna
async function loadGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    message.textContent = error.message;
    return;
  }

  groupList.replaceChildren();

  if (data.length === 0) {
    groupList.textContent = 'Belum ada grup patungan.';
    return;
  }

  data.forEach((group) => {
    const item = document.createElement('li');
    item.textContent = group.name;
    groupList.appendChild(item);
  });
}

// Membuat grup dan mendaftarkan pembuat sebagai anggota
document.querySelector('#groupForm')
  .addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.querySelector('#groupName')
      .value.trim();

    if (!name) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        created_by: user.id
      })
      .select('id, name')
      .single();

    if (groupError) {
      message.textContent = groupError.message;
      return;
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id
      });

    if (memberError) {
      message.textContent =
        'Grup dibuat, tetapi pendaftaran anggota gagal: ' +
        memberError.message;
      return;
    }

    message.textContent = 'Grup berhasil dibuat.';
    document.querySelector('#groupName').value = '';

    await loadGroups();
  });

// Logout
document.querySelector('#logoutButton')
  .addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      message.textContent = error.message;
      return;
    }

    window.location.href = 'index.html';
  });
