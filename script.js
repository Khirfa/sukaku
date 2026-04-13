const menuFriedChicken = [
    { id: 'dad', nama: "Dada", harga: 9000 },
    { id: 'pat', nama: "Paha Atas", harga: 9000 },
    { id: 'say', nama: "Sayap", harga: 7000 },
    { id: 'pab', nama: "Paha Bawah", harga: 7000 },
    { id: 'nas', nama: "Nasi", harga: 3000 },
    { id: 'sam', nama: "Sambal Bawang", harga: 3000 }
];

let cart = {};
let totalHarga = 0;
let metodePembayaran = "Tunai";

// 1. Render Menu Utama
function renderMenu() {
    const menuDiv = document.getElementById('menu-items');
    if (!menuDiv) return;
    menuDiv.innerHTML = menuFriedChicken.map(item => `
        <div class="menu-card" onclick="updateItemQuantity('${item.id}', 1)">
            <span class="menu-name">${item.nama}</span>
            <span class="menu-price">Rp ${item.harga.toLocaleString('id-ID')}</span>
        </div>
    `).join('');
}

// 2. Kelola Jumlah Item di Keranjang
function updateItemQuantity(itemId, change) {
    const item = menuFriedChicken.find(m => m.id === itemId);
    if (!cart[itemId]) {
        if (change > 0) cart[itemId] = { ...item, quantity: 1 };
    } else {
        cart[itemId].quantity += change;
        if (cart[itemId].quantity <= 0) delete cart[itemId];
    }
    updateDisplay();
}

// 3. Update Tampilan Keranjang (Detail Pesanan)
function updateDisplay() {
    const cartList = document.getElementById('cart-list');
    const totalSpan = document.getElementById('total-price');
    const cashInput = document.getElementById('cash-amount');
    
    if (!cartList) return;
    cartList.innerHTML = '';
    totalHarga = 0;
    
    const cartItems = Object.values(cart);

    if (cartItems.length === 0) {
        cartList.innerHTML = '<p class="empty-cart-msg">Keranjang masih kosong.</p>';
        if(cashInput) cashInput.disabled = true;
    } else {
        if(cashInput) cashInput.disabled = false;
        cartItems.forEach(item => {
            totalHarga += (item.harga * item.quantity);
            
            const li = document.createElement('div');
            li.className = 'cart-item';
            li.innerHTML = `
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.nama}</span>
                    <span class="cart-item-price">@ Rp ${item.harga.toLocaleString('id-ID')}</span>
                </div>
                <div class="cart-item-actions">
                    <button onclick="event.stopPropagation(); updateItemQuantity('${item.id}', -1)" class="btn-qty btn-minus">-</button>
                    <span class="cart-item-qty">${item.quantity}</span>
                    <button onclick="event.stopPropagation(); updateItemQuantity('${item.id}', 1)" class="btn-qty btn-plus">+</button>
                </div>
            `;
            cartList.appendChild(li);
        });
    }
    
    if(totalSpan) totalSpan.innerText = `Rp ${totalHarga.toLocaleString('id-ID')}`;
    hitungKembalian();
}

// 4. Format Input Uang (Ribuan)
function formatRibuan(input) {
    let value = input.value.replace(/[^0-9]/g, "");
    if (value) {
        input.value = parseInt(value).toLocaleString('id-ID');
    } else {
        input.value = "";
    }
    hitungKembalian();
}

// 5. Hitung Kembalian Otomatis
function hitungKembalian() {
    const cashInput = document.getElementById('cash-amount');
    const changeSpan = document.getElementById('change-amount');
    if (!cashInput || !changeSpan) return;

    const cashRaw = cashInput.value.replace(/\./g, "");
    const cash = parseFloat(cashRaw) || 0;
    const kembalian = cash - totalHarga;
    
    if (totalHarga === 0 || cash === 0) {
        changeSpan.innerText = "Rp 0";
        changeSpan.style.color = "#757575";
    } else if (kembalian < 0) {
        changeSpan.innerText = "Uang Kurang!";
        changeSpan.style.color = "#b71c1c";
    } else {
        changeSpan.innerText = `Rp ${kembalian.toLocaleString('id-ID')}`;
        changeSpan.style.color = "#2e7d32";
    }
}

// 6. Pilih Metode Pembayaran (Tunai/QRIS)
function togglePaymentMethod(method) {
    metodePembayaran = method;
    const cashInput = document.getElementById('cash-amount');
    const inputGroup = document.getElementById('cash-input-group');

    if (method === "QRIS") {
        cashInput.value = totalHarga.toLocaleString('id-ID');
        cashInput.readOnly = true;
        if(inputGroup) inputGroup.style.opacity = "0.5"; 
    } else {
        cashInput.value = "";
        cashInput.readOnly = false;
        if(inputGroup) inputGroup.style.opacity = "1";
    }
    hitungKembalian();
}

// 7. Simpan Transaksi (Tanpa Popup)
function simpanKeLokal() {
    const cartItems = Object.values(cart);
    const cashRaw = document.getElementById('cash-amount').value.replace(/\./g, "");
    const cash = parseFloat(cashRaw) || 0;

    if (cartItems.length === 0 || cash < totalHarga) return;

    // Format item per baris: Nama (Qty)
    const itemString = cartItems.map(i => `${i.nama} (${i.quantity})`).join("<br>");

    const transaksiBaru = {
        tanggal: new Date().toLocaleString('id-ID'),
        item: itemString,
        total: totalHarga,
        metode: metodePembayaran 
    };

    let antrean = JSON.parse(localStorage.getItem('antrean_kasir')) || [];
    antrean.push(transaksiBaru);
    localStorage.setItem('antrean_kasir', JSON.stringify(antrean));

    resetCart();
    tampilkanRiwayat();

    // Kembalikan UI ke Tunai
    const tunaiRadio = document.querySelector('input[value="Tunai"]');
    if(tunaiRadio) {
        tunaiRadio.checked = true;
        togglePaymentMethod('Tunai');
    }
}

// 8. Render Tabel Riwayat
function tampilkanRiwayat() {
    const antrean = JSON.parse(localStorage.getItem('antrean_kasir')) || [];
    const body = document.getElementById('history-body');
    if (!body) return;

    let income = 0;
    body.innerHTML = antrean.length ? antrean.slice().reverse().map(data => {
        income += data.total;
        return `<tr>
            <td>${data.tanggal.split(' ')[1]?.substring(0,5) || '--:--'}</td>
            <td>${data.item}</td>
            <td>Rp ${data.total.toLocaleString('id-ID')}</td>
        </tr>`;
    }).join('') : '<tr><td colspan="3" style="text-align:center; padding:15px; color:#999;">Belum ada penjualan.</td></tr>';
    
    document.getElementById('grand-total-income').innerText = `Rp ${income.toLocaleString('id-ID')}`;
}

// 9. Reset Keranjang
function resetCart() { 
    cart = {}; 
    const cashInput = document.getElementById('cash-amount');
    if(cashInput) cashInput.value = ''; 
    updateDisplay(); 
}

// 10. Hapus Semua Data (Uji Coba)
function hapusSemuaRiwayat() {
    localStorage.removeItem('antrean_kasir');
    tampilkanRiwayat();
}

// Fitur PWA: Registrasi Service Worker (Agar bisa Offline)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('SW Terdaftar'))
            .catch(err => console.log('SW Gagal', err));
    });
}

window.onload = () => { renderMenu(); updateDisplay(); tampilkanRiwayat(); };
