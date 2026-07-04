// State management
let state = {
  entries: [],
  smartcardBalance: 0,
  historyLog: [],
  viewMode: 'compact', // 'compact' or 'detail'
  activeTab: 'home', // 'home' or 'history'
  modalState: {
    type: 'masuk', // 'masuk' or 'keluar'
    category: 'modal' // 'modal', 'beban', 'transfer', 'pengambilan', 'infaq'
  }
};

// DOM Elements
const elTotalBalance = document.getElementById('totalBalance');
const elTopUangBelakang = document.getElementById('topUangBelakang');
const elSmartcardBalanceLabel = document.getElementById('smartcardBalanceLabel');
const elBukuBalanceLabel = document.getElementById('bukuBalanceLabel');
const elEntriesCount = document.getElementById('entriesCount');
const elNominalList = document.getElementById('nominalList');
const elSearchInput = document.getElementById('searchInput');
const elHistoryTimeline = document.getElementById('historyTimeline');

// Navigation Tabs
const elNavHome = document.getElementById('navHome');
const elNavHistory = document.getElementById('navHistory');
const elViewHome = document.getElementById('viewHome');
const elViewHistory = document.getElementById('viewHistory');

// View Controls
const elBtnViewCompact = document.getElementById('btnViewCompact');
const elBtnViewDetail = document.getElementById('btnViewDetail');

// Modals
const elNominalModal = document.getElementById('nominalModal');
const elSmartcardModal = document.getElementById('smartcardModal');
const elEntryIndex = document.getElementById('entryIndex');
const elNominalForm = document.getElementById('nominalForm');
const elSmartcardForm = document.getElementById('smartcardForm');
const elNominalModalTitle = document.getElementById('nominalModalTitle');

// Inputs
const elInputNominal = document.getElementById('inputNominal');
const elInputNominalFormatted = document.getElementById('inputNominalFormatted');
const elInputKeterangan = document.getElementById('inputKeterangan');
const elInputTanggal = document.getElementById('inputTanggal');
const elInputSmartcard = document.getElementById('inputSmartcard');
const elInputSmartcardFormatted = document.getElementById('inputSmartcardFormatted');

// Buttons
const elBtnEditSmartcard = document.getElementById('btnEditSmartcard');
const elBtnOpenAddModal = document.getElementById('btnOpenAddModal');
const elBtnCloseNominalModal = document.getElementById('btnCloseNominalModal');
const elBtnCancelNominalModal = document.getElementById('btnCancelNominalModal');
const elBtnCloseSmartcardModal = document.getElementById('btnCloseSmartcardModal');
const elBtnCancelSmartcardModal = document.getElementById('btnCancelSmartcardModal');

// Type Toggles
const elTypeMasuk = document.getElementById('typeMasuk');
const elTypeKeluar = document.getElementById('typeKeluar');

// Categories
const categoryPills = document.querySelectorAll('.category-pill');

// ----------------------------------------------------
// UTILITIES
// ----------------------------------------------------

// Format number to Rupiah format
function formatRupiah(number) {
  const isNegative = number < 0;
  const absNumber = Math.abs(number);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(absNumber);
  
  return isNegative ? `-${formatted}` : formatted;
}

// Generate unique ID
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Get current date string (YYYY-MM-DD)
function getCurrentDateString() {
  const d = new Date();
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

// Log changes to audit history
function logEvent(action, targetName, changes = null) {
  const timestamp = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  
  const logItem = {
    id: generateId(),
    timestamp,
    action, // 'tambah', 'ubah', 'hapus', 'saldo_smartcard'
    targetName,
    changes // { old: X, new: Y }
  };
  
  state.historyLog.unshift(logItem);
  localStorage.setItem('smartcard_history', JSON.stringify(state.historyLog));
}

// ----------------------------------------------------
// CORE CALCULATIONS
// ----------------------------------------------------

function calculateTotals() {
  // Sum of book entries: masuk is positive, keluar is negative
  const totalBuku = state.entries.reduce((sum, entry) => {
    const val = Number(entry.nominal);
    return entry.tipe === 'masuk' ? sum + val : sum - val;
  }, 0);
  
  const totalBalance = Number(state.smartcardBalance) + totalBuku;
  
  return {
    totalBuku,
    totalBalance
  };
}

// ----------------------------------------------------
// RENDERERS
// ----------------------------------------------------

function renderApp() {
  const { totalBuku, totalBalance } = calculateTotals();
  
  // Update Header Card Values
  elTopUangBelakang.innerText = formatRupiah(totalBuku);
  elTotalBalance.innerText = formatRupiah(totalBalance);
  elSmartcardBalanceLabel.innerText = formatRupiah(state.smartcardBalance);
  elBukuBalanceLabel.innerText = formatRupiah(totalBuku);
  
  // Set text color if book balance goes negative (warning)
  if (totalBuku < 0) {
    elBukuBalanceLabel.style.color = 'var(--danger)';
    elTopUangBelakang.style.background = 'rgba(239, 68, 68, 0.2)';
  } else {
    elBukuBalanceLabel.style.color = 'inherit';
    elTopUangBelakang.style.background = 'rgba(255, 255, 255, 0.15)';
  }
  
  // Render Lists
  renderNominalList();
  renderHistoryTimeline();
}

function renderNominalList() {
  const searchQuery = elSearchInput.value.toLowerCase();
  
  // Filter entries based on search query
  const filteredEntries = state.entries.filter(entry => {
    return (
      entry.keterangan.toLowerCase().includes(searchQuery) ||
      entry.nominal.toString().includes(searchQuery) ||
      entry.kategori.toLowerCase().includes(searchQuery) ||
      entry.tanggal.includes(searchQuery)
    );
  });
  
  elEntriesCount.innerText = `${filteredEntries.length} Catatan`;
  elNominalList.innerHTML = '';
  
  if (filteredEntries.length === 0) {
    elNominalList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 14px;">
        Tidak ada catatan nominal ditemukan.
      </div>
    `;
    return;
  }
  
  // Sort entries by date descending, then ID descending
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    return new Date(b.tanggal) - new Date(a.tanggal);
  });
  
  sortedEntries.forEach((entry, idx) => {
    const card = document.createElement('div');
    card.className = `nominal-card ${entry.tipe}`;
    card.dataset.id = entry.id;
    
    // Toggle detail view or compact view
    const isCompact = state.viewMode === 'compact';
    
    // Format date string (YYYY-MM-DD -> DD/MM/YYYY)
    const dateParts = entry.tanggal.split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0].substring(2)}` : entry.tanggal;
    
    if (isCompact) {
      card.innerHTML = `
        <div class="card-left">
          <span class="card-title">${entry.keterangan}</span>
        </div>
        <div class="card-right">
          <span class="card-amount ${entry.tipe}">
            ${entry.tipe === 'masuk' ? '+' : '-'}${formatRupiah(entry.nominal).replace('Rp', '').trim()}
          </span>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="card-left">
          <span class="card-title">${entry.keterangan}</span>
          <div class="card-meta">
            <span class="card-badge ${entry.kategori}">${entry.kategori}</span>
            <span>${formattedDate}</span>
          </div>
        </div>
        <div class="card-right">
          <span class="card-amount ${entry.tipe}">
            ${entry.tipe === 'masuk' ? '+' : '-'}${formatRupiah(entry.nominal)}
          </span>
        </div>
      `;
    }
    
    // Add inline actions panel if card is tapped/selected
    card.addEventListener('click', (e) => {
      // Prevent toggling if clicked on action buttons
      if (e.target.closest('.card-action-btn')) return;
      
      const alreadyExpanded = card.querySelector('.card-actions');
      
      // Collapse all other expanded cards first
      document.querySelectorAll('.nominal-card').forEach(c => {
        const actionPanel = c.querySelector('.card-actions');
        if (actionPanel) actionPanel.remove();
      });
      
      if (!alreadyExpanded) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';
        actionsDiv.innerHTML = `
          <button class="card-action-btn edit">Ubah</button>
          <button class="card-action-btn delete">Hapus</button>
        `;
        
        // Add events for edit and delete
        actionsDiv.querySelector('.edit').addEventListener('click', () => {
          openEditModal(entry.id);
        });
        
        actionsDiv.querySelector('.delete').addEventListener('click', () => {
          deleteEntry(entry.id);
        });
        
        card.querySelector('.card-left').appendChild(actionsDiv);
      }
    });
    
    elNominalList.appendChild(card);
  });
}

function renderHistoryTimeline() {
  elHistoryTimeline.innerHTML = '';
  
  if (state.historyLog.length === 0) {
    elHistoryTimeline.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 14px;">
        Belum ada riwayat aktivitas edit.
      </div>
    `;
    return;
  }
  
  state.historyLog.forEach(log => {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    let changeDetails = '';
    if (log.changes) {
      changeDetails = `
        <div class="history-changes">
          <div class="change-line">
            <span>Sebelum:</span>
            <span class="change-val-old">${log.changes.old}</span>
          </div>
          <div class="change-line">
            <span>Sesudah:</span>
            <span class="change-val-new">${log.changes.new}</span>
          </div>
        </div>
      `;
    }
    
    item.innerHTML = `
      <div class="history-header">
        <span>${log.timestamp}</span>
        <span class="history-action">${log.action}</span>
      </div>
      <div class="history-desc">${log.targetName}</div>
      ${changeDetails}
    `;
    
    elHistoryTimeline.appendChild(item);
  });
}

// ----------------------------------------------------
// STATE MUTATIONS (DATA CONTROLLERS)
// ----------------------------------------------------

function addEntry(nominal, keterangan, tanggal, tipe, kategori) {
  const newEntry = {
    id: generateId(),
    nominal: Number(nominal),
    keterangan,
    tanggal,
    tipe,
    kategori
  };
  
  state.entries.unshift(newEntry);
  saveData();
  
  logEvent('tambah', `${keterangan} (${tipe === 'masuk' ? '+' : '-'}${formatRupiah(nominal)})`);
  renderApp();
}

function editEntry(id, nominal, keterangan, tanggal, tipe, kategori) {
  const entryIndex = state.entries.findIndex(e => e.id === id);
  if (entryIndex === -1) return;
  
  const oldEntry = { ...state.entries[entryIndex] };
  const updatedEntry = {
    id,
    nominal: Number(nominal),
    keterangan,
    tanggal,
    tipe,
    kategori
  };
  
  state.entries[entryIndex] = updatedEntry;
  saveData();
  
  // Format details for the audit trail
  const oldText = `${oldEntry.keterangan} - ${oldEntry.tipe === 'masuk' ? '+' : '-'}${formatRupiah(oldEntry.nominal)} (${oldEntry.tanggal})`;
  const newText = `${keterangan} - ${tipe === 'masuk' ? '+' : '-'}${formatRupiah(nominal)} (${tanggal})`;
  
  logEvent('ubah', `Ubah catatan: ${keterangan}`, { old: oldText, new: newText });
  renderApp();
}

function deleteEntry(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;
  
  if (confirm(`Apakah Anda yakin ingin menghapus catatan "${entry.keterangan}"?`)) {
    state.entries = state.entries.filter(e => e.id !== id);
    saveData();
    
    logEvent('hapus', `Hapus catatan: ${entry.keterangan} (${entry.tipe === 'masuk' ? '+' : '-'}${formatRupiah(entry.nominal)})`);
    renderApp();
  }
}

function updateSmartcardBalance(newBalance) {
  const oldVal = formatRupiah(state.smartcardBalance);
  const newVal = formatRupiah(newBalance);
  
  state.smartcardBalance = Number(newBalance);
  localStorage.setItem('smartcard_balance', state.smartcardBalance);
  
  logEvent('saldo_smartcard', 'Update Saldo Smartcard', { old: oldVal, new: newVal });
  renderApp();
}

function saveData() {
  localStorage.setItem('smartcard_entries', JSON.stringify(state.entries));
}

// ----------------------------------------------------
// UI ACTIONS & EVENT LISTENERS
// ----------------------------------------------------

// Handle navigation tab switches
function switchTab(tabId) {
  state.activeTab = tabId;
  
  if (tabId === 'home') {
    elNavHome.classList.add('active');
    elNavHistory.classList.remove('active');
    elViewHome.style.display = 'block';
    elViewHistory.style.display = 'none';
  } else {
    elNavHome.classList.remove('active');
    elNavHistory.classList.add('active');
    elViewHome.style.display = 'none';
    elViewHistory.style.display = 'block';
  }
  
  // Reset search and close expanded action items on tab switch
  elSearchInput.value = '';
  renderApp();
  
  // Scroll back to top
  document.getElementById('scrollArea').scrollTop = 0;
}

// Handle view mode toggle (Ringkas vs Detail)
function switchViewMode(mode) {
  state.viewMode = mode;
  if (mode === 'compact') {
    elBtnViewCompact.classList.add('active');
    elBtnViewDetail.classList.remove('active');
  } else {
    elBtnViewCompact.classList.remove('active');
    elBtnViewDetail.classList.add('active');
  }
  renderNominalList();
}

// Setup Form Category Pills Selection
categoryPills.forEach(pill => {
  pill.addEventListener('click', () => {
    categoryPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.modalState.category = pill.dataset.cat;
  });
});

// Setup Form Type Toggles
function setModalType(type) {
  state.modalState.type = type;
  if (type === 'masuk') {
    elTypeMasuk.classList.add('active');
    elTypeKeluar.classList.remove('active');
  } else {
    elTypeMasuk.classList.remove('active');
    elTypeKeluar.classList.add('active');
  }
}

elTypeMasuk.addEventListener('click', () => setModalType('masuk'));
elTypeKeluar.addEventListener('click', () => setModalType('keluar'));

// Modals Open/Close Helper
function openModal(modalEl) {
  modalEl.classList.add('active');
}

function closeModal(modalEl) {
  modalEl.classList.remove('active');
}

// Prep add modal
elBtnOpenAddModal.addEventListener('click', () => {
  elNominalModalTitle.innerText = "Tambah Nominal Baru";
  elEntryIndex.value = ''; // empty means create new
  elNominalForm.reset();
  
  // Set default form values
  setModalType('masuk');
  categoryPills.forEach(p => p.classList.remove('active'));
  document.querySelector('[data-cat="modal"]').classList.add('active');
  state.modalState.category = 'modal';
  
  elInputTanggal.value = getCurrentDateString();
  elInputNominalFormatted.innerText = formatRupiah(0);
  
  openModal(elNominalModal);
});

// Prep edit modal
function openEditModal(entryId) {
  const entry = state.entries.find(e => e.id === entryId);
  if (!entry) return;
  
  elNominalModalTitle.innerText = "Ubah Catatan Nominal";
  elEntryIndex.value = entry.id;
  
  elInputNominal.value = entry.nominal;
  elInputNominalFormatted.innerText = formatRupiah(entry.nominal);
  elInputKeterangan.value = entry.keterangan;
  elInputTanggal.value = entry.tanggal;
  
  setModalType(entry.tipe);
  
  categoryPills.forEach(p => {
    if (p.dataset.cat === entry.kategori) {
      p.classList.add('active');
      state.modalState.category = entry.kategori;
    } else {
      p.classList.remove('active');
    }
  });
  
  openModal(elNominalModal);
}

// Save Nominal Entry Form Handler
elNominalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const id = elEntryIndex.value;
  const nominal = Number(elInputNominal.value);
  const keterangan = elInputKeterangan.value.trim();
  const tanggal = elInputTanggal.value;
  const tipe = state.modalState.type;
  const kategori = state.modalState.category;
  
  if (id) {
    // Update existing
    editEntry(id, nominal, keterangan, tanggal, tipe, kategori);
  } else {
    // Create new
    addEntry(nominal, keterangan, tanggal, tipe, kategori);
  }
  
  closeModal(elNominalModal);
});

// Smartcard Modal Handlers
elBtnEditSmartcard.addEventListener('click', () => {
  elInputSmartcard.value = state.smartcardBalance;
  elInputSmartcardFormatted.innerText = formatRupiah(state.smartcardBalance);
  openModal(elSmartcardModal);
  elInputSmartcard.focus();
});

elSmartcardForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newBal = Number(elInputSmartcard.value);
  updateSmartcardBalance(newBal);
  closeModal(elSmartcardModal);
});

// Form Cancel Buttons
elBtnCancelNominalModal.addEventListener('click', () => closeModal(elNominalModal));
elBtnCloseNominalModal.addEventListener('click', () => closeModal(elNominalModal));
elBtnCancelSmartcardModal.addEventListener('click', () => closeModal(elSmartcardModal));
elBtnCloseSmartcardModal.addEventListener('click', () => closeModal(elSmartcardModal));

// Search event listener
elSearchInput.addEventListener('input', () => {
  renderNominalList();
});

// Live amount formatter hints
elInputNominal.addEventListener('input', () => {
  const val = Number(elInputNominal.value) || 0;
  elInputNominalFormatted.innerText = formatRupiah(val);
});

elInputSmartcard.addEventListener('input', () => {
  const val = Number(elInputSmartcard.value) || 0;
  elInputSmartcardFormatted.innerText = formatRupiah(val);
});

// Navigation Bar buttons click
elNavHome.addEventListener('click', () => switchTab('home'));
elNavHistory.addEventListener('click', () => switchTab('history'));

// View Controls
elBtnViewCompact.addEventListener('click', () => switchViewMode('compact'));
elBtnViewDetail.addEventListener('click', () => switchViewMode('detail'));

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------

function init() {
  // Load Entries
  const localEntries = localStorage.getItem('smartcard_entries');
  if (localEntries) {
    state.entries = JSON.parse(localEntries);
  } else {
    state.entries = INITIAL_ENTRIES; // Loaded from src/data.js
    localStorage.setItem('smartcard_entries', JSON.stringify(state.entries));
  }
  
  // Load Smartcard Balance
  const localSmartcard = localStorage.getItem('smartcard_balance');
  if (localSmartcard !== null) {
    state.smartcardBalance = Number(localSmartcard);
  } else {
    state.smartcardBalance = INITIAL_SMARTCARD_BALANCE; // Loaded from src/data.js
    localStorage.setItem('smartcard_balance', state.smartcardBalance);
  }
  
  // Load History
  const localHistory = localStorage.getItem('smartcard_history');
  if (localHistory) {
    state.historyLog = JSON.parse(localHistory);
  } else {
    state.historyLog = [
      {
        id: generateId(),
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        action: 'system',
        targetName: 'Sistem diinisialisasi dengan data buku default'
      }
    ];
    localStorage.setItem('smartcard_history', JSON.stringify(state.historyLog));
  }
  
  // Initial UI Render
  renderApp();
}

// Bootstrapping
window.addEventListener('DOMContentLoaded', init);
