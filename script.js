const menuFriedChicken = [
    { id: 'dad', nama: "Dada", harga: 9000 },
    { id: 'pat', nama: "Paha Atas", harga: 9000 },
    { id: 'pab', nama: "Paha Bawah", harga: 7000 },
    { id: 'say', nama: "Sayap", harga: 7000 },
    { id: 'nas', nama: "Nasi", harga: 3000 },
    { id: 'sam', nama: "Sambal Bawang", harga: 3000 }
];

let cart = {};
let totalHarga = 0;

function renderMenu() {
    const menuDiv = document.getElementById('menu-items');
    menuDiv.innerHTML = menuFriedChicken.map(item => `
        <div class="menu-card" onclick="updateItemQuantity('${item.id}', 1)">
            <span class="menu-name">${item.nama}</span>
            <span class="menu-price">Rp ${item.harga.toLocaleString('id-ID')}</span>
        </div>
    `).join('');
}

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
            const itemTotal = item.harga * item.quantity;
            totalHarga += itemTotal;
            
            const li = document.createElement('div');
            li.className = 'cart-item';
            // Sekarang cuma ada 2 bagian utama: info dan actions
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

// Fungsi untuk memformat input menjadi ribuan (titik)
function formatRibuan(input) {
    // Ambil angka saja
    let value = input.value.replace(/[^0-9]/g, "");
    
    // Format ke ribuan
    if (value) {
        input.value = parseInt(value).toLocaleString('id-ID');
    } else {
        input.value = "";
    }
    
    // Jalankan hitung kembalian
    hitungKembalian();
}

// Update fungsi hitung kembalian agar mengabaikan titik saat menghitung
function hitungKembalian() {
    const cashInput = document.getElementById('cash-amount');
    const changeSpan = document.getElementById('change-amount');
    if (!cashInput || !changeSpan) return;

    // Bersihkan titik sebelum dihitung
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

function tampilkanRiwayat() {
    const antrean = JSON.parse(localStorage.getItem('antrean_kasir')) || [];
    const body = document.getElementById('history-body');
    let income = 0;
    
    body.innerHTML = antrean.length ? antrean.slice().reverse().map(data => {
        income += data.total;
        return `<tr>
            <td>${data.tanggal.split(' ')[1]?.substring(0,5) || '--:--'}</td>
            <td>${data.item}</td>
            <td>Rp ${data.total.toLocaleString()}</td>
        </tr>`;
    }).join('') : '<tr><td colspan="3" style="text-align:center; padding:15px; color:#999;">Belum ada penjualan.</td></tr>';
    
    document.getElementById('grand-total-income').innerText = `Rp ${income.toLocaleString('id-ID')}`;
}
let metodePembayaran = "Tunai";

function togglePaymentMethod(method) {
    metodePembayaran = method;
    const cashInput = document.getElementById('cash-amount');
    const inputGroup = document.getElementById('cash-input-group');

    if (method === "QRIS") {
        // Jika QRIS, otomatis isi dengan total harga
        cashInput.value = totalHarga.toLocaleString('id-ID');
        cashInput.readOnly = true; // Kunci input karena QRIS biasanya uang pas
        inputGroup.style.opacity = "0.5"; 
    } else {
        cashInput.value = "";
        cashInput.readOnly = false;
        inputGroup.style.opacity = "1";
    }
    hitungKembalian();
}

// MODIFIKASI FUNGSI SIMPAN (Tanpa Popup)
function simpanKeLokal() {
    const cartItems = Object.values(cart);
    const cashRaw = document.getElementById('cash-amount').value.replace(/\./g, "");
    const cash = parseFloat(cashRaw) || 0;

    // Validasi tetap ada, tapi tanpa alert (tombol bisa dibuat mati jika tidak valid)
    if (cartItems.length === 0 || cash < totalHarga) return;

    const transaksiBaru = {
        tanggal: new Date().toLocaleString('id-ID'),
        item: Object.values(cart).map(i => `${i.nama}(${i.quantity})`).join(", "),
        total: totalHarga,
        metode: metodePembayaran 
    };

    let antrean = JSON.parse(localStorage.getItem('antrean_kasir')) || [];
    antrean.push(transaksiBaru);
    localStorage.setItem('antrean_kasir', JSON.stringify(antrean));

    // Alert dihapus, langsung jalankan fungsi bersih-bersih
    resetCart();
    tampilkanRiwayat();
    
    // Kembalikan ke metode Tunai
    const tunaiRadio = document.querySelector('input[value="Tunai"]');
    if (tunaiRadio) {
        tunaiRadio.checked = true;
        togglePaymentMethod('Tunai');
    }
}

async function exportKeSheets() {
    const data = JSON.parse(localStorage.getItem('antrean_kasir')) || [];
    if (!data.length) return alert("Kosong!");
    
    const SCRIPT_URL = "URL_WEB_APP_GOOGLE_SCRIPT_ANDA";
    try {
        for (let row of data) {
            await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(row) });
        }
        alert("Berhasil!");
        localStorage.removeItem('antrean_kasir');
        tampilkanRiwayat();
    } catch (e) { alert("Gagal!"); }
}

function resetCart() { cart = {}; document.getElementById('cash-amount').value = ''; updateDisplay(); }

window.onload = () => { renderMenu(); updateDisplay(); tampilkanRiwayat(); };
