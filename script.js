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
    const cartItems = Object.values(cart);
    totalHarga = cartItems.reduce((acc, item) => acc + (item.harga * item.quantity), 0);
    
    if (cartItems.length === 0) {
        cartList.innerHTML = '<p class="empty-cart-msg">Keranjang masih kosong.</p>';
        document.getElementById('cash-amount').disabled = true;
    } else {
        document.getElementById('cash-amount').disabled = false;
        cartList.innerHTML = cartItems.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nama}</div>
                    <small>@${item.harga.toLocaleString()}</small>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-qty" onclick="event.stopPropagation(); updateItemQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn-qty btn-plus" onclick="event.stopPropagation(); updateItemQuantity('${item.id}', 1)">+</button>
                </div>
                <div class="cart-item-subtotal">Rp ${(item.harga * item.quantity).toLocaleString()}</div>
            </div>
        `).join('');
    }
    document.getElementById('total-price').innerText = `Rp ${totalHarga.toLocaleString('id-ID')}`;
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

// Update fungsi simpanKeLokal untuk mencatat metode
function simpanKeLokal() {
    const cartItems = Object.values(cart);
    const cashRaw = document.getElementById('cash-amount').value.replace(/\./g, "");
    const cash = parseFloat(cashRaw) || 0;

    if (cartItems.length === 0) return alert("Pilih menu dulu!");
    if (cash < totalHarga) return alert("Uang pembayaran kurang!");

    const transaksiBaru = {
        tanggal: new Date().toLocaleString('id-ID'),
        item: Object.values(cart).map(i => `${i.nama}(${i.quantity})`).join(", "),
        total: totalHarga,
        metode: metodePembayaran // Catat Tunai atau QRIS
    };

    let antrean = JSON.parse(localStorage.getItem('antrean_kasir')) || [];
    antrean.push(transaksiBaru);
    localStorage.setItem('antrean_kasir', JSON.stringify(antrean));

    alert(`✅ Berhasil! (Metode: ${metodePembayaran})`);
    resetCart();
    tampilkanRiwayat();
    
    // Kembalikan ke Tunai setelah simpan
    document.querySelector('input[value="Tunai"]').checked = true;
    togglePaymentMethod('Tunai');
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