// State management
let state = {
  entries: [],
  smartcardBalance: 0,
  historyLog: [],
  viewMode: 'compact', // 'compact' or 'detail'
  activeTab: 'home', // 'home' or 'history'
  lastUpdated: null,
  modalState: {
    type: 'masuk', // 'masuk' or 'keluar'
    category: 'modal' // 'modal', 'beban', 'transfer', 'pengambilan', 'infaq'
  }
};

// DOM Elements
const elTotalBalance = document.getElementById('totalBalance');
const elSmartcardBalanceLabel = document.getElementById('smartcardBalanceLabel');
const elBukuBalanceLabel = document.getElementById('bukuBalanceLabel');
const elEntriesCount = document.getElementById('entriesCount');
const elNominalList = document.getElementById('nominalList');
const elHistoryTimeline = document.getElementById('historyTimeline');

// Navigation Tabs
const elNavHome = document.getElementById('navHome');
const elNavHistory = document.getElementById('navHistory');
const elViewsSlider = document.getElementById('viewsSlider');

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

// ----------------------------------------------------
// UTILITIES
// ----------------------------------------------------

// FLIP Animation Utility for smooth DOM reordering
function animateDOM(container, domMutationCallback) {
  const children = Array.from(container.children);
  const rects = new Map();
  
  // First
  children.forEach(child => {
    rects.set(child, child.getBoundingClientRect());
  });
  
  // Execute Mutation
  domMutationCallback();
  
  // Last & Invert & Play
  const newChildren = Array.from(container.children);
  newChildren.forEach(child => {
    const oldRect = rects.get(child);
    if (!oldRect) return; // New element
    
    const newRect = child.getBoundingClientRect();
    const deltaY = oldRect.top - newRect.top;
    
    if (deltaY !== 0) {
      child.style.transform = `translateY(${deltaY}px)`;
      child.style.transition = 'none';
      
      requestAnimationFrame(() => {
        child.style.transform = '';
        child.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    }
  });
}

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

// Update last modified timestamp
function triggerUpdateTimestamp() {
  state.lastUpdated = new Date().toISOString();
  localStorage.setItem('smartcard_last_updated', state.lastUpdated);
}

// Format timestamp to hh:mm dd month yyyy
function formatLastUpdated(dateString) {
  if (!dateString) return 'Update Terakhir: -';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Update Terakhir: -';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `Update Terakhir: ${hours}:${minutes} ${day} ${month} ${year}`;
}

// Log changes to audit history
function logEvent(action, targetName, changes = null, entryId = null) {
  const timestamp = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  
  const logItem = {
    id: generateId(),
    timestamp,
    action, // 'tambah', 'ubah', 'hapus', 'saldo_smartcard'
    targetName,
    changes, // { old: X, new: Y }
    entryId
  };
  
  state.historyLog.unshift(logItem);
  localStorage.setItem('smartcard_history', JSON.stringify(state.historyLog));
}

// ----------------------------------------------------
// CORE CALCULATIONS
// ----------------------------------------------------

function calculateTotals() {
  // Sum of book entries: all entries are summed up without subtraction
  const totalBuku = state.entries.reduce((sum, entry) => {
    return sum + Number(entry.nominal);
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
  elTotalBalance.innerText = formatRupiah(totalBalance);
  elSmartcardBalanceLabel.innerText = formatRupiah(state.smartcardBalance);
  elBukuBalanceLabel.innerText = formatRupiah(totalBuku);
  
  // Render last updated time
  const elLastUpdatedLabel = document.getElementById('lastUpdatedLabel');
  if (elLastUpdatedLabel) {
    elLastUpdatedLabel.innerText = formatLastUpdated(state.lastUpdated);
  }
  
  // Render Lists
  renderNominalList();
  renderHistoryTimeline();
}

// ----------------------------------------------------
// DRAG AND DROP & TOUCH SORTING
// ----------------------------------------------------

let touchDragState = {
  card: null,
  placeholder: null,
  startY: 0,
  initialTop: 0,
  initialLeft: 0,
  elements: []
};

function reorderEntries(draggedId, targetId, insertAfter) {
  const draggedIdx = state.entries.findIndex(e => e.id === draggedId);
  if (draggedIdx === -1) return;
  const [draggedEntry] = state.entries.splice(draggedIdx, 1);
  
  let targetIdx = state.entries.findIndex(e => e.id === targetId);
  if (insertAfter) {
    targetIdx += 1;
  }
  
  state.entries.splice(targetIdx, 0, draggedEntry);
  saveData();
  renderNominalList();
}

function setupDragAndDrop(card, entryId) {
  const handle = card.querySelector('.drag-handle');
  if (handle) {
    handle.addEventListener('mousedown', () => card.setAttribute('draggable', true));
    handle.addEventListener('touchstart', () => card.setAttribute('draggable', true), {passive: true});
    handle.addEventListener('mouseup', () => card.removeAttribute('draggable'));
    handle.addEventListener('mouseleave', () => card.removeAttribute('draggable'));
    handle.addEventListener('touchend', () => card.removeAttribute('draggable'));
  }
  
  card.addEventListener('dragstart', (e) => {
    // Delay adding the class so browser drag ghost takes snapshot of normal card
    setTimeout(() => {
      card.classList.add('dragging');
    }, 0);
    e.dataTransfer.setData('text/plain', entryId);
    e.dataTransfer.effectAllowed = 'move';
  });
  
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    card.removeAttribute('draggable');
    renderNominalList();
  });
}

function setupListDragAndDrop() {
  elNominalList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingCard = document.querySelector('.dragging');
    if (!draggingCard) return;
    
    const currentY = e.clientY;
    const elements = Array.from(elNominalList.children).filter(el => 
      el.classList.contains('nominal-card') && el !== draggingCard && !el.classList.contains('nominal-placeholder')
    );
    
    let closestEl = null;
    let minDistance = Infinity;
    let insertAfter = false;
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const dist = Math.abs(currentY - midY);
      if (dist < minDistance) {
        minDistance = dist;
        closestEl = el;
        insertAfter = currentY > midY;
      }
    });
    
    if (closestEl) {
      const targetSibling = insertAfter ? closestEl.nextElementSibling : closestEl;
      if (draggingCard.nextElementSibling !== targetSibling && draggingCard !== targetSibling) {
        animateDOM(elNominalList, () => {
          elNominalList.insertBefore(draggingCard, targetSibling);
        });
      }
    }
  });

  elNominalList.addEventListener('drop', (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;
    
    const draggingCard = document.querySelector(`[data-id="${draggedId}"]`);
    if (!draggingCard) return;
    
    draggingCard.classList.remove('dragging');
    
    const elements = Array.from(elNominalList.children).filter(el => 
      el.classList.contains('nominal-card') && el !== draggingCard && !el.classList.contains('nominal-placeholder')
    );
    const dIndex = Array.from(elNominalList.children).indexOf(draggingCard);
    
    let referenceEl = elements.find(el => {
       return Array.from(elNominalList.children).indexOf(el) > dIndex;
    });
    
    let targetId = null;
    let insertAfter = false;
    if (referenceEl) {
       targetId = referenceEl.dataset.id;
    } else {
       const lastEl = elements[elements.length - 1];
       if (lastEl) {
         targetId = lastEl.dataset.id;
         insertAfter = true;
       }
    }
    
    if (targetId && targetId !== draggedId) {
      reorderEntries(draggedId, targetId, insertAfter);
    } else {
      renderNominalList();
    }
  });
}

function setupTouchDrag(card, entryId) {
  card.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.drag-handle')) return;
    if (e.target.closest('.card-action-btn')) return;
    
    const touch = e.touches[0];
    const rect = card.getBoundingClientRect();
    
    const placeholder = document.createElement('div');
    placeholder.className = `nominal-card ${state.viewMode === 'compact' ? 'compact' : 'detail'} nominal-placeholder`;
    placeholder.style.height = `${rect.height}px`;
    placeholder.style.minHeight = `${rect.height}px`;
    
    card.parentNode.insertBefore(placeholder, card);
    
    touchDragState.card = card;
    touchDragState.placeholder = placeholder;
    touchDragState.startY = touch.clientY;
    touchDragState.initialTop = rect.top;
    touchDragState.initialLeft = rect.left;
    
    card.style.position = 'fixed';
    card.style.top = `${rect.top}px`;
    card.style.left = `${rect.left}px`;
    card.style.width = `${rect.width}px`;
    card.style.transform = `translate3d(0, 0, 0)`;
    card.classList.add('dragging-touch');
    card.style.zIndex = '1000';
    card.style.transition = 'none';
  }, { passive: true });

  card.addEventListener('touchmove', (e) => {
    if (!touchDragState.card || touchDragState.card !== card) return;
    if (e.cancelable) e.preventDefault();
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchDragState.startY;
    card.style.transform = `translate3d(0, ${deltaY}px, 0)`;
    
    const currentY = touch.clientY;
    const elements = Array.from(elNominalList.children).filter(el => 
      el.classList.contains('nominal-card') && el !== card && el !== touchDragState.placeholder && !el.classList.contains('bottom-limit-indicator')
    );
    
    let closestEl = null;
    let minDistance = Infinity;
    let insertAfter = false;
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const dist = Math.abs(currentY - midY);
      
      if (dist < minDistance) {
        minDistance = dist;
        closestEl = el;
        insertAfter = currentY > midY;
      }
    });
    
    if (closestEl) {
      const targetSibling = insertAfter ? closestEl.nextElementSibling : closestEl;
      if (touchDragState.placeholder.nextElementSibling !== targetSibling && touchDragState.placeholder !== targetSibling) {
        animateDOM(elNominalList, () => {
          elNominalList.insertBefore(touchDragState.placeholder, targetSibling);
        });
      }
    }
  }, { passive: false });

  card.addEventListener('touchend', (e) => {
    if (!touchDragState.card || touchDragState.card !== card) return;
    
    const placeholder = touchDragState.placeholder;
    const placeholderRect = placeholder.getBoundingClientRect();
    
    const targetDeltaY = placeholderRect.top - touchDragState.initialTop;
    const targetDeltaX = placeholderRect.left - touchDragState.initialLeft;
    
    card.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    card.style.transform = `translate3d(${targetDeltaX}px, ${targetDeltaY}px, 0)`;
    
    setTimeout(() => {
      const elements = Array.from(elNominalList.children).filter(el => 
        el.classList.contains('nominal-card') && el !== card && el !== placeholder && !el.classList.contains('bottom-limit-indicator')
      );
      const pIndex = Array.from(elNominalList.children).indexOf(placeholder);
      
      let referenceEl = elements.find(el => {
         return Array.from(elNominalList.children).indexOf(el) > pIndex;
      });
      
      placeholder.remove();
      card.classList.remove('dragging-touch');
      card.style.position = '';
      card.style.top = '';
      card.style.left = '';
      card.style.width = '';
      card.style.transition = '';
      card.style.zIndex = '';
      
      let insertAfter = false;
      let targetId = null;
      if (referenceEl) {
         targetId = referenceEl.dataset.id;
      } else {
         const lastEl = elements[elements.length - 1];
         if (lastEl) {
           targetId = lastEl.dataset.id;
           insertAfter = true;
         }
      }
      
      if (targetId && targetId !== entryId) {
         reorderEntries(entryId, targetId, insertAfter);
      } else {
         renderNominalList();
      }
      
      touchDragState.card = null;
      touchDragState.placeholder = null;
    }, 250);
  });
}

function renderNominalList() {
  elEntriesCount.innerText = `${state.entries.length} Catatan`;
  elNominalList.innerHTML = '';
  
  if (state.entries.length === 0) {
    elNominalList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 14px;">
        Tidak ada catatan nominal ditemukan.
      </div>
    `;
    return;
  }
  
  state.entries.forEach((entry, idx) => {
    const card = document.createElement('div');
    card.dataset.id = entry.id;
    
    const isCompact = state.viewMode === 'compact';
    card.className = `nominal-card ${isCompact ? 'compact' : 'detail'}`;
    
    const dateParts = entry.tanggal.split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0].substring(2)}` : entry.tanggal;
    
    // Unified HTML Structure
    card.innerHTML = `
      <div class="card-left">
        <span class="card-title">${entry.keterangan}</span>
        <div class="card-meta">
          <span class="card-date">${formattedDate}</span>
        </div>
      </div>
      <div class="card-right">
        <span class="card-amount">${isCompact ? formatRupiah(entry.nominal).replace('Rp', '').trim() : formatRupiah(entry.nominal)}</span>
      </div>
      <div class="drag-handle" aria-label="Drag to reorder">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line></svg>
      </div>
    `;
    
    // Setup reordering listeners
    setupDragAndDrop(card, entry.id);
    setupTouchDrag(card, entry.id);
    
    // Click actions
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-action-btn')) return;
      
      if (state.viewMode === 'compact') {
        // Compact mode: go straight to edit modal
        openEditModal(entry.id);
      } else {
        // Detail mode: expand to show edit and delete actions
        const alreadyExpanded = card.querySelector('.card-actions');
        
        // Collapse all other expanded cards first
        document.querySelectorAll('.nominal-card').forEach(c => {
          c.classList.remove('has-actions');
          const actionPanel = c.querySelector('.card-actions');
          if (actionPanel) actionPanel.remove();
        });
        
        if (!alreadyExpanded) {
          card.classList.add('has-actions');
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'card-actions';
          actionsDiv.innerHTML = `
            <button class="card-action-btn edit">Ubah</button>
            <button class="card-action-btn delete">Hapus</button>
          `;
          
          actionsDiv.querySelector('.edit').addEventListener('click', (ev) => {
            ev.stopPropagation();
            openEditModal(entry.id);
          });
          
          actionsDiv.querySelector('.delete').addEventListener('click', (ev) => {
            ev.stopPropagation();
            deleteEntry(entry.id);
          });
          
          card.appendChild(actionsDiv);
        }
      }
    });
    
    elNominalList.appendChild(card);
  });
  
  // Add bottom limit indicator
  if (state.entries.length > 0) {
    const bottomLimit = document.createElement('div');
    bottomLimit.className = 'bottom-limit-indicator';
    bottomLimit.innerText = 'Akhir Daftar Nominal';
    elNominalList.appendChild(bottomLimit);
  }
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
  
  if (state.historyLog.length > 0) {
    const bottomLimit = document.createElement('div');
    bottomLimit.className = 'bottom-limit-indicator';
    bottomLimit.innerText = 'Akhir Riwayat Edit';
    elHistoryTimeline.appendChild(bottomLimit);
  }
}

// ----------------------------------------------------
// STATE MUTATIONS (DATA CONTROLLERS)
// ----------------------------------------------------

function addEntry(nominal, keterangan, tanggal, tipe = 'masuk', kategori = 'modal') {
  const newEntry = {
    id: generateId(),
    nominal: Number(nominal),
    keterangan,
    tanggal,
    tipe,
    kategori
  };
  
  state.entries.unshift(newEntry);
  triggerUpdateTimestamp();
  saveData();
  
  logEvent('tambah', `${keterangan} (${formatRupiah(nominal)})`, null, newEntry.id);
  renderApp();
}

// In edit mode: tipe and kategori default to masuk/modal. Updated entry triggers timestamp.
function editEntry(id, nominal, keterangan, tanggal, tipe = 'masuk', kategori = 'modal') {
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
  triggerUpdateTimestamp();
  saveData();
  
  const oldText = `${oldEntry.keterangan} - ${formatRupiah(oldEntry.nominal)} (${oldEntry.tanggal})`;
  const newText = `${keterangan} - ${formatRupiah(nominal)} (${tanggal})`;
  
  logEvent('ubah', `Ubah catatan: ${keterangan}`, { old: oldText, new: newText }, id);
  renderApp();
}

function deleteEntry(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;
  
  if (confirm(`Apakah Anda yakin ingin menghapus catatan "${entry.keterangan}"?`)) {
    state.entries = state.entries.filter(e => e.id !== id);
    triggerUpdateTimestamp();
    saveData();
    
    // Remove all associated history logs for this entry
    state.historyLog = state.historyLog.filter(log => log.entryId !== id);
    localStorage.setItem('smartcard_history', JSON.stringify(state.historyLog));
    
    renderApp();
  }
}

function updateSmartcardBalance(newBalance) {
  const oldVal = formatRupiah(state.smartcardBalance);
  const newVal = formatRupiah(newBalance);
  
  state.smartcardBalance = Number(newBalance);
  localStorage.setItem('smartcard_balance', state.smartcardBalance);
  triggerUpdateTimestamp();
  
  logEvent('saldo_smartcard', 'Update Total Uang Modal', { old: oldVal, new: newVal });
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
    elViewsSlider.style.transform = 'translateX(0)';
  } else {
    elNavHome.classList.remove('active');
    elNavHistory.classList.add('active');
    elViewsSlider.style.transform = 'translateX(-50%)';
  }
  
  renderApp();
  
  // Smooth scroll past the header if it's currently taking up the screen
  const headerHeight = document.querySelector('.header-card').offsetHeight;
  const scrollArea = document.getElementById('scrollArea');
  if (scrollArea.scrollTop < headerHeight / 2) {
    scrollArea.scrollTo({
      top: headerHeight,
      behavior: 'smooth'
    });
  }
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
  
  // Transition class names on the existing card elements
  const cards = document.querySelectorAll('.nominal-card');
  cards.forEach(card => {
    const entryId = card.dataset.id;
    const entry = state.entries.find(e => e.id === entryId);
    if (!entry) return;
    
    const elAmount = card.querySelector('.card-amount');
    
    if (mode === 'compact') {
      card.classList.add('compact');
      card.classList.remove('detail');
      if (elAmount) elAmount.innerText = formatRupiah(entry.nominal).replace('Rp', '').trim();
      
      // Collapse expanded action overlays in compact view
      const actionPanel = card.querySelector('.card-actions');
      if (actionPanel) actionPanel.remove();
    } else {
      card.classList.add('detail');
      card.classList.remove('compact');
      if (elAmount) elAmount.innerText = formatRupiah(entry.nominal);
    }
  });
}

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
  
  if (state.viewMode === 'compact') {
    document.getElementById('formGroupTanggal').style.display = 'none';
  } else {
    document.getElementById('formGroupTanggal').style.display = 'block';
  }
  
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
  
  if (state.viewMode === 'compact') {
    document.getElementById('formGroupTanggal').style.display = 'none';
    elInputTanggal.value = getCurrentDateString();
  } else {
    document.getElementById('formGroupTanggal').style.display = 'block';
    elInputTanggal.value = entry.tanggal;
  }
  
  openModal(elNominalModal);
}

// Save Nominal Entry Form Handler
elNominalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const id = elEntryIndex.value;
  const nominal = Number(elInputNominal.value);
  const keterangan = elInputKeterangan.value.trim();
  const tanggal = elInputTanggal.value;
  
  if (id) {
    editEntry(id, nominal, keterangan, tanggal);
  } else {
    addEntry(nominal, keterangan, tanggal);
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

// Auto-hide bottom nav on scroll
const scrollArea = document.getElementById('scrollArea');
const bottomNav = document.querySelector('.bottom-nav');

// Initial check
if (scrollArea.scrollTop <= 10) {
  bottomNav.classList.add('nav-hidden');
}

scrollArea.addEventListener('scroll', () => {
  if (scrollArea.scrollTop <= 10) {
    bottomNav.classList.add('nav-hidden');
  } else {
    bottomNav.classList.remove('nav-hidden');
  }
});

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
  
  // Load Last Updated Timestamp
  state.lastUpdated = localStorage.getItem('smartcard_last_updated') || null;
  
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
  
  // Setup global drag events for desktop list
  setupListDragAndDrop();
}

// Bootstrapping
window.addEventListener('DOMContentLoaded', init);
