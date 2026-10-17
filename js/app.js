// State
const state = {
    expenses: [],
    memberCount: 0
};

// DOM
const totalExpenseEl = document.querySelector('#total-expense');
const perPersonEl = document.querySelector('#per-person');
const emptyStateEl = document.querySelector('#empty-state');

// Format Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(amount);
}

// Hitung dan render hasil
function updateSummary() {
    const isExpenseEmpty = state.expenses.length === 0;

    // Toggle empty state
    if (emptyStateEl) {
        emptyStateEl.style.display = isExpenseEmpty ? 'block' : 'none';
    }

    // Hitung total pengeluaran
    const totalExpense = state.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Hitung patungan (cegah bagi nol)
    const perPersonExpense = state.memberCount > 0 ? totalExpense / state.memberCount : 0;

    // Render ke DOM
    if (totalExpenseEl) {
        totalExpenseEl.textContent = formatRupiah(totalExpense);
    }

    if (perPersonEl) {
        perPersonEl.textContent = formatRupiah(perPersonExpense);
    }
}

// Helper update data
function addExpense(name, amount) {
    state.expenses.push({ id: Date.now(), name, amount: Number(amount) });
    updateSummary();
}

function setMemberCount(count) {
    state.memberCount = Math.max(0, parseInt(count, 10) || 0);
    updateSummary();
}

// Inisialisasi
updateSummary();