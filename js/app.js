// js/app.js
// Menyambungkan HTML ke auth.js dan Supabase. Ini contoh yang bisa
// dikembangkan tim frontend.
import { supabase } from './supabase.js'
import { register, login, logout, getCurrentUser, onAuthChange } from './auth.js'

const $ = (id) => document.getElementById(id)
let currentGroup = null

// ---------- Util ----------
function say(el, text, isError = false) {
  el.textContent = text
  el.classList.toggle('error', isError)
}

async function withLoading(form, fn) {
  const btn = form.querySelector('button[type="submit"]')
  btn.disabled = true
  try { await fn() } finally { btn.disabled = false }
}

const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// ---------- Tampilan ----------
function showAuth() {
  $('auth-view').hidden = false
  $('app-view').hidden = true
}

async function showApp(user) {
  $('auth-view').hidden = true
  $('app-view').hidden = false
  $('user-email').textContent = user.email
  $('expense-section').hidden = true
  currentGroup = null
  await loadGroups()
}

function setTab(isLogin) {
  $('login-form').hidden = !isLogin
  $('register-form').hidden = isLogin
  $('tab-login').setAttribute('aria-selected', isLogin)
  $('tab-register').setAttribute('aria-selected', !isLogin)
  say($('auth-message'), '')
}

$('tab-login').onclick = () => setTab(true)
$('tab-register').onclick = () => setTab(false)

// ---------- Auth ----------
$('login-form').onsubmit = (e) => {
  e.preventDefault()
  const f = e.target
  withLoading(f, async () => {
    try {
      await login(f.email.value.trim(), f.password.value)
      f.reset()
    } catch (err) { say($('auth-message'), err.message, true) }
  })
}

$('register-form').onsubmit = (e) => {
  e.preventDefault()
  const f = e.target
  withLoading(f, async () => {
    try {
      const { needsConfirmation } = await register(f.email.value.trim(), f.password.value, f.name.value.trim())
      f.reset()
      if (needsConfirmation) {
        say($('auth-message'), 'Akun dibuat. Cek email Anda untuk konfirmasi, lalu masuk.')
        setTab(true)
      }
    } catch (err) { say($('auth-message'), err.message, true) }
  })
}

$('logout-btn').onclick = () => logout()

// ---------- Grup ----------
async function loadGroups() {
  const { data, error } = await supabase.from('groups').select('id, name').order('created_at', { ascending: false })
  const ul = $('group-list')
  ul.replaceChildren()
  if (error) return say($('app-message'), 'Gagal memuat grup: ' + error.message, true)
  if (!data.length) {
    const li = document.createElement('li')
    li.className = 'empty'
    li.textContent = 'Belum ada grup. Buat yang pertama di atas.'
    ul.append(li)
    return
  }
  for (const g of data) {
    const li = document.createElement('li')
    const btn = document.createElement('button')
    btn.className = 'pick'
    btn.textContent = g.name
    btn.onclick = () => openGroup(g)
    li.append(btn)
    ul.append(li)
  }
}

$('group-form').onsubmit = (e) => {
  e.preventDefault()
  const f = e.target
  withLoading(f, async () => {
    const user = await getCurrentUser()
    const { data: group, error } = await supabase.from('groups').insert({ name: f.name.value.trim() }).select().single()
    if (error) return say($('app-message'), 'Gagal membuat grup: ' + error.message, true)
    // Pembuat grup otomatis jadi anggota.
    const { error: memberError } = await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })
    if (memberError) return say($('app-message'), 'Gagal menambah anggota: ' + memberError.message, true)
    say($('app-message'), '')
    f.reset()
    await loadGroups()
  })
}

// ---------- Pengeluaran ----------
async function openGroup(group) {
  currentGroup = group
  $('expense-section').hidden = false
  $('group-title').textContent = group.name
  await loadExpenses()
}

async function loadExpenses() {
  const { data, error } = await supabase.from('expenses').select('id, title, amount')
    .eq('group_id', currentGroup.id).order('created_at', { ascending: false })
  const ul = $('expense-list')
  ul.replaceChildren()
  if (error) return say($('app-message'), 'Gagal memuat pengeluaran: ' + error.message, true)
  if (!data.length) {
    const li = document.createElement('li')
    li.className = 'empty'
    li.textContent = 'Belum ada pengeluaran di grup ini.'
    ul.append(li)
    return
  }
  for (const x of data) {
    const li = document.createElement('li')
    const a = document.createElement('span'); a.textContent = x.title
    const b = document.createElement('strong'); b.textContent = rupiah(x.amount)
    li.append(a, b)
    ul.append(li)
  }
}

$('expense-form').onsubmit = (e) => {
  e.preventDefault()
  const f = e.target
  withLoading(f, async () => {
    const { error } = await supabase.from('expenses').insert({
      group_id: currentGroup.id,
      title: f.title.value.trim(),
      amount: Number(f.amount.value),
    })
    if (error) return say($('app-message'), 'Gagal menambah pengeluaran: ' + error.message, true)
    say($('app-message'), '')
    f.reset()
    await loadExpenses()
  })
}

// ---------- Mulai ----------
onAuthChange((user) => (user ? showApp(user) : showAuth()))
getCurrentUser().then((user) => (user ? showApp(user) : showAuth()))
