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
    
    // Jika sedang mode QRIS, update nominal otomatis saat item berubah
    if(metodePembayaran === "QRIS") togglePaymentMethod("QRIS");
    
    hitungKembalian();
}

function formatRibuan(input) {
    let value = input.value.replace(/[^0-9]/g, "");
    if (value) input.value = parseInt(value).toLocaleString('id-ID');
    else input.value = "";
    hitungKembalian();
}

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

function togglePaymentMethod(method) {
    metodePembayaran = method;
    const cashInput = document.getElementById('cash-amount');
    const inputGroup = document.getElementById('cash-input-group');
    const qrisArea = document.getElementById('qris-display-area');

    if (method === "QRIS") {
        cashInput.value = totalHarga.toLocaleString('id-ID');
        cashInput.readOnly = true;
        if(inputGroup) inputGroup.style.opacity = "0.5"; 
        
        qrisArea.style.display = "block";
        qrisArea.innerHTML = `
            <div style="background: white; padding: 15px; border-radius: 15px; text-align: center; border: 2px solid #fbc02d; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <span style="font-size: 11px; font-weight: 800; color: #757575;">TOTAL SCAN:</span>
                <h2 style="color: #b71c1c; margin-bottom: 10px; font-weight: 900;">Rp ${totalHarga.toLocaleString('id-ID')}</h2>
                <img src="qris.jpg" style="width: 100%; max-width: 180px; border-radius: 8px;">
                <p style="font-size: 10px; color: #777; margin-top: 8px;">*Pelanggan masukkan nominal manual</p>
            </div>
        `;
    } else {
        cashInput.value = "";
        cashInput.readOnly = false;
        if(inputGroup) inputGroup.style.opacity = "1";
        qrisArea.style.display = "none";
    }
    hitungKembalian();
}

function simpanKeLokal() {
    const cartItems = Object.values(cart);
    const cashRaw = document.getElementById('cash-amount').value.replace(/\./g, "");
    const cash = parseFloat(cashRaw) || 0;

    if (cartItems.length === 0 || cash < totalHarga) return;

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
}

let isCopying = false; // Tambahkan variabel kontrol di luar fungsi

async function salinLaporan() {
    // Jika sedang dalam proses animasi "Berhasil Disalin", hentikan klik tambahan
    if (isCopying) return;

    const antrean = JSON.parse(localStorage.getItem('antrean_kasir')) || [];
    if (antrean.length === 0) return;

    let totalOmzet = 0;
    let rekapMenu = {};

    antrean.forEach((transaksi) => {
        totalOmzet += transaksi.total;
        const items = transaksi.item.split("<br>");
        items.forEach(itemStr => {
            const match = itemStr.match(/(.*)\s\((\d+)\)/);
            if (match) {
                const namaMenu = match[1].trim();
                const qty = parseInt(match[2]);
                rekapMenu[namaMenu] = (rekapMenu[namaMenu] || 0) + qty;
            }
        });
    });

    let teks = `*LAPORAN DETAIL SUKAKU*\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n----------------------------\n*RINCIAN TERJUAL:*\n`;
    for (const [menu, jumlah] of Object.entries(rekapMenu)) {
        teks += `• ${menu}: *${jumlah}*\n`;
    }
    teks += `----------------------------\n✅ *Total Transaksi:* ${antrean.length}\n💰 *TOTAL OMZET:* *Rp ${totalOmzet.toLocaleString('id-ID')}*\n----------------------------`;

    try {
        await navigator.clipboard.writeText(teks);
        
        // Aktifkan status sedang menyalin
        isCopying = true;
        
        const btn = document.getElementById('btn-lapor');
        const oldText = btn.innerHTML;
        const oldBg = btn.style.background; // Simpan warna asli

        btn.innerHTML = `<i class="fas fa-check"></i> BERHASIL DISALIN!`;
        btn.style.background = "#2e7d32";
        btn.style.pointerEvents = "none"; // Nonaktifkan klik secara fisik

        setTimeout(() => { 
            btn.innerHTML = oldText; 
            btn.style.background = oldBg || "#075E54"; 
            btn.style.pointerEvents = "auto"; // Aktifkan kembali klik
            isCopying = false; // Reset status
        }, 2000);

    } catch (err) { 
        console.error('Gagal salin', err); 
        isCopying = false;
    }
}

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

function resetCart() { 
    cart = {}; 
    const cashInput = document.getElementById('cash-amount');
    if(cashInput) cashInput.value = ''; 
    const tunaiRadio = document.querySelector('input[value="Tunai"]');
    if(tunaiRadio) { tunaiRadio.checked = true; togglePaymentMethod('Tunai'); }
    updateDisplay(); 
}

function hapusSemuaRiwayat() {
    if(confirm("Hapus semua riwayat hari ini?")) {
        localStorage.removeItem('antrean_kasir');
        tampilkanRiwayat();
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(err => console.log(err));
    });
}

window.onload = () => { renderMenu(); updateDisplay(); tampilkanRiwayat(); };
