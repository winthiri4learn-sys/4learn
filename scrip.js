// Local Storage Keys
const ITEM_STORAGE_KEY = 'posItems';
const SALE_HISTORY_KEY = 'posSalesHistory';
const PURCHASE_HISTORY_KEY = 'posPurchaseHistory';
const SETTINGS_KEY = 'posSettings';
const INFO_KEY = 'posBusinessInfo';

// Global Data Models
let items = JSON.parse(localStorage.getItem(ITEM_STORAGE_KEY)) || [];
let salesHistory = JSON.parse(localStorage.getItem(SALE_HISTORY_KEY)) || [];
let purchaseHistory = JSON.parse(localStorage.getItem(PURCHASE_HISTORY_KEY)) || [];
let cart = [];

let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
    currency: 'ကျပ်',
    taxRate: 0 // Default 0% tax
};
let businessInfo = JSON.parse(localStorage.getItem(INFO_KEY)) || {
    name: 'Win Thiri POS',
    phone: '',
    address: ''
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialization
    loadSettingsAndInfo();
    updateCartDisplay();
    renderItems();
    renderHistory('sale'); 
    showPage('sales'); 
    
    // 2. Attach Event Listeners
    document.getElementById('item-form').addEventListener('submit', saveItem);
    document.getElementById('settings-form').addEventListener('submit', saveSettings);
    document.getElementById('info-form').addEventListener('submit', saveBusinessInfo);
    document.getElementById('item-search').addEventListener('input', renderItems);
    
    // Purchase Form Event Listener
    document.getElementById('purchase-form').addEventListener('submit', savePurchase);
});

// --- UI Navigation and Utilities ---

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Reset views/forms when switching pages
    if (pageId === 'item-management') {
        renderItems();
        showItemForm(false); 
        document.getElementById('item-form').reset(); 
        document.getElementById('item-id').value = ''; 
        document.getElementById('save-item-btn').textContent = 'ပစ္စည်း သိမ်းဆည်းမည်';
    } else if (pageId === 'history') {
        showHistory('sale'); 
    } else if (pageId === 'settings') {
        // Ensure forms are reset and purchase list is rendered when entering settings
        showPurchaseForm(false); 
        document.getElementById('purchase-form').reset();
        document.getElementById('purchase-id').value = '';
        document.getElementById('save-purchase-btn').textContent = 'မှတ်တမ်း သိမ်းဆည်းမည်';
        renderPurchaseRecords();
    }
}

function loadSettingsAndInfo() {
    // Load Settings
    document.getElementById('currency').value = settings.currency;
    document.getElementById('tax-rate').value = settings.taxRate;
    document.getElementById('tax-rate-display').textContent = settings.taxRate;
    
    // Load Business Info
    document.getElementById('business-name').value = businessInfo.name;
    document.getElementById('phone').value = businessInfo.phone;
    document.getElementById('address').value = businessInfo.address;
    document.querySelector('.app-title').textContent = businessInfo.name;
}

// ------------------------------------
// --- Item Management (CRUD) Functions ---
// ------------------------------------

function showItemForm(show = true) {
    const container = document.getElementById('item-form-container');
    if (show) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function saveItem(event) {
    event.preventDefault();
    const id = document.getElementById('item-id').value;
    const name = document.getElementById('item-name').value.trim();
    
    // Allow purchasePrice to be 0 or empty (will be parsed as 0)
    const purchasePrice = parseFloat(document.getElementById('purchase-price').value) || 0; 
    const salePrice = parseFloat(document.getElementById('sale-price').value);
    const stock = parseInt(document.getElementById('item-stock').value);

    // Check for mandatory fields (Name, Sale Price, Stock)
    if (!name || isNaN(salePrice) || isNaN(stock)) {
        alert("ပစ္စည်းအမည်၊ ရောင်းစျေးနှင့် စတော့ခ် အရေအတွက်များကို ပြည့်စုံစွာ ထည့်သွင်းပါ။");
        return;
    }

    if (id) {
        // Edit existing item
        const index = items.findIndex(item => item.id === parseInt(id));
        if (index > -1) {
            items[index] = { id: parseInt(id), name, purchasePrice, salePrice, stock };
            alert(`"${name}" ကို ပြင်ဆင်သိမ်းဆည်းပြီးပါပြီ။`);
        }
    } else {
        // Add new item
        const newItem = {
            id: Date.now(),
            name,
            purchasePrice,
            salePrice,
            stock
        };
        items.unshift(newItem); 
        alert(`"${name}" ကို အသစ်ထည့်သွင်းပြီးပါပြီ။`);
    }

    localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(items));
    document.getElementById('item-form').reset(); 
    document.getElementById('item-id').value = ''; 
    document.getElementById('save-item-btn').textContent = 'ပစ္စည်း သိမ်းဆည်းမည်';
    showItemForm(false); 
    renderItems(); 
}

function editItem(id) {
    const item = items.find(i => i.id === id);
    if (item) {
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('purchase-price').value = item.purchasePrice;
        document.getElementById('sale-price').value = item.salePrice;
        document.getElementById('item-stock').value = item.stock;
        document.getElementById('save-item-btn').textContent = `"${item.name}" ကို ပြင်ဆင်မည်`;
        showItemForm(true); 
    }
}

function deleteItem(id) {
    const item = items.find(i => i.id === id);
    if (confirm(`ပစ္စည်း "${item.name}" ကို အပြီးတိုင် ဖျက်ပစ်ရန် သေချာပါသလား။`)) {
        items = items.filter(i => i.id !== id);
        localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(items));
        renderItems();
    }
}

function renderItems() {
    const itemList = document.getElementById('item-list');
    const itemGrid = document.getElementById('item-grid');
    const searchTerm = document.getElementById('item-search') ? document.getElementById('item-search').value.toLowerCase() : '';
    
    itemList.innerHTML = '';
    itemGrid.innerHTML = '';

    const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm));

    if (filteredItems.length === 0 && searchTerm === '') {
        itemList.innerHTML = '<li style="color: #E53935;">ပစ္စည်းစာရင်း မရှိသေးပါ။ Item Tab မှ ထည့်သွင်းပါ။</li>';
    } else if (filteredItems.length === 0 && searchTerm !== '') {
        itemList.innerHTML = '<li>ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းမတွေ့ပါ။</li>';
        itemGrid.innerHTML = '<p style="padding: 10px; text-align: center; color: #777;">ပစ္စည်းမတွေ့ပါ</p>';
        return;
    }

    filteredItems.forEach(item => {
        // Item Management List View
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-details">
                <strong>${item.name}</strong><br>
                <span>ရောင်းစျေး: ${item.salePrice} ${settings.currency}</span> | 
                <small>ရင်းနှီးငွေ: ${item.purchasePrice} ${settings.currency}</small> |
                <strong style="color: ${item.stock <= 5 ? '#E53935' : '#00796b'};">စတော့ခ်: ${item.stock}</strong>
            </div>
            <div class="action-buttons">
                <button class="edit-btn" onclick="editItem(${item.id})"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteItem(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        itemList.appendChild(li);

        // Sales Grid View
        const tile = document.createElement('div');
        tile.className = 'item-tile';
        tile.onclick = () => addToCart(item.id);
        tile.innerHTML = `
            <span>${item.name}</span>
            <small>${item.salePrice} ${settings.currency}</small>
            <small style="color: ${item.stock <= 5 ? '#E53935' : '#777'}; display: block;">စတော့ခ်: ${item.stock}</small>
        `;
        itemGrid.appendChild(tile);
    });
}

// ------------------------------------
// --- Purchase Management (CRUD) Functions ---
// ------------------------------------

function showPurchaseForm(show = true) {
    const container = document.getElementById('purchase-form-container');
    if (show) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function savePurchase(event) {
    event.preventDefault();
    const id = document.getElementById('purchase-id').value;
    const name = document.getElementById('purchase-item-name').value.trim();
    const quantity = parseInt(document.getElementById('purchase-qty').value);
    const totalAmount = parseFloat(document.getElementById('purchase-total').value);

    if (!name || isNaN(quantity) || isNaN(totalAmount) || quantity <= 0) {
        alert("ဝယ်ယူမှု အချက်အလက်များကို ပြည့်စုံစွာ ထည့်သွင်းပါ။");
        return;
    }
    
    const singlePrice = (totalAmount / quantity).toFixed(2);
    let stockUpdated = false;

    if (id) {
        // Edit existing record - (Stock adjustment is complex for edits, we'll keep simple history update)
        const index = purchaseHistory.findIndex(record => record.id === parseInt(id));
        if (index > -1) {
            purchaseHistory[index] = { 
                id: parseInt(id), 
                name, 
                quantity, 
                total: totalAmount.toFixed(2),
                price: parseFloat(singlePrice),
                date: purchaseHistory[index].date 
            };
            alert(`ဝယ်ယူမှု မှတ်တမ်းကို ပြင်ဆင်ပြီးပါပြီ။ (စတော့ခ်ကို ကိုယ်တိုင်ချိန်ညှိရန် လိုအပ်နိုင်ပါသည်။)`);
        }
    } else {
        // Add new record
        const newRecord = {
            id: Date.now(),
            name,
            quantity,
            total: totalAmount.toFixed(2),
            price: parseFloat(singlePrice),
            date: new Date().toLocaleString('my-MM', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        };
        purchaseHistory.unshift(newRecord);

        // NEW LOGIC: Find item by name and increase stock
        const itemToUpdate = items.find(item => item.name.toLowerCase() === name.toLowerCase());
        
        if (itemToUpdate) {
            itemToUpdate.stock += quantity;
            localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(items));
            stockUpdated = true;
        }

        alert(`ဝယ်ယူမှု မှတ်တမ်းအသစ် "${name} x ${quantity}" ကို ထည့်သွင်းပြီးပါပြီ။ ${stockUpdated ? 'ပစ္စည်း စတော့ခ်ကို အလိုအလျောက် တိုးပေးလိုက်ပါသည်။' : '(Item List တွင် မတွေ့သောကြောင့် စတော့ခ် မတိုးပါ။)'}`);
    }

    localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(purchaseHistory));
    document.getElementById('purchase-form').reset();
    document.getElementById('purchase-id').value = '';
    document.getElementById('save-purchase-btn').textContent = 'မှတ်တမ်း သိမ်းဆည်းမည်';
    showPurchaseForm(false);
    renderPurchaseRecords();
    renderHistory('purchase'); 
    renderItems(); // Refresh Item Grid and List to show new stock level
}

function editPurchase(id) {
    const record = purchaseHistory.find(r => r.id === id);
    if (record) {
        document.getElementById('purchase-id').value = record.id;
        document.getElementById('purchase-item-name').value = record.name;
        document.getElementById('purchase-qty').value = record.quantity;
        document.getElementById('purchase-total').value = record.total;
        document.getElementById('save-purchase-btn').textContent = `မှတ်တမ်း ID ${record.id.toString().slice(-4)} ကို ပြင်ဆင်မည်`;
        showPurchaseForm(true); 
    }
}

function removePurchase(id) {
    const record = purchaseHistory.find(r => r.id === id);
    if (confirm(`ဝယ်ယူမှု "${record.name}" မှတ်တမ်းကို ဖျက်ပစ်ရန် သေချာပါသလား။`)) {
        
        // When deleting a purchase record, we should also undo the stock increase (if it was added)
        const itemToUpdate = items.find(item => item.name.toLowerCase() === record.name.toLowerCase());

        if (itemToUpdate) {
            itemToUpdate.stock -= record.quantity; // Reduce stock by the purchased quantity
            localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(items));
            alert(`ဝယ်ယူမှု မှတ်တမ်း ဖျက်သိမ်းပြီးပါပြီ။ (စတော့ခ် ${record.quantity} ခု ပြန်နုတ်လိုက်ပါသည်။)`);
        } else {
            alert(`ဝယ်ယူမှု မှတ်တမ်း ဖျက်သိမ်းပြီးပါပြီ။`);
        }
        
        purchaseHistory = purchaseHistory.filter(r => r.id !== id);
        localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(purchaseHistory));
        
        renderPurchaseRecords();
        renderHistory('purchase');
        renderItems(); // Refresh Item Grid and List
    }
}

function renderPurchaseRecords() {
    const listContainer = document.getElementById('purchase-management-list');
    listContainer.innerHTML = '';

    if (purchaseHistory.length === 0) {
        listContainer.innerHTML = '<li>ဝယ်ယူမှု မှတ်တမ်း မရှိသေးပါ။</li>';
        return;
    }

    purchaseHistory.forEach(record => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-details">
                <strong>${record.name}</strong> (x ${record.quantity})<br>
                <small>စုစုပေါင်း: ${record.total} ${settings.currency}</small> | 
                <small>တစ်ယူနစ်စျေး: ${record.price} ${settings.currency}</small>
            </div>
            <div class="action-buttons">
                <button class="edit-btn" onclick="editPurchase(${record.id})"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="removePurchase(${record.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        listContainer.appendChild(li);
    });
}


// ------------------------------------
// --- Sales and History Functions ---
// ------------------------------------

function addToCart(itemId, quantityChange = 1) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    let cartItem = cart.find(c => c.id === itemId);

    if (cartItem) {
        // Update quantity
        const newQty = cartItem.quantity + quantityChange;
        if (newQty > item.stock) {
            alert(`ပစ္စည်းအရေအတွက်သည် စတော့ခ်အရေအတွက် (${item.stock}) ထက် မကျော်လွန်နိုင်ပါ။`);
            return;
        } else if (newQty > 0) {
            cartItem.quantity = newQty;
        } else {
            // Remove if quantity is 0 or less
            cart = cart.filter(c => c.id !== itemId);
        }
    } else if (quantityChange > 0 && item.stock > 0) {
        // Add new item
        cart.push({ 
            id: item.id, 
            name: item.name, 
            salePrice: item.salePrice, 
            purchasePrice: item.purchasePrice, 
            quantity: 1 
        });
    }

    updateCartDisplay();
}

function updateCartDisplay() {
    const cartList = document.getElementById('cart-list');
    cartList.innerHTML = '';
    let subTotal = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<li style="justify-content: center; color: #999;">စာရင်းရှင်းရန် ပစ္စည်းမရှိပါ။</li>';
    } else {
        cart.forEach(c => {
            const itemTotal = c.salePrice * c.quantity;
            subTotal += itemTotal;
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="item-name">${c.name}</span>
                <div class="cart-actions">
                    <button onclick="addToCart(${c.id}, -1)">-</button>
                    <span style="font-weight: bold; margin: 0 5px;">${c.quantity}</span>
                    <button onclick="addToCart(${c.id}, 1)">+</button>
                </div>
                <strong>${itemTotal.toFixed(2)} ${settings.currency}</strong>
            `;
            cartList.appendChild(li);
        });
    }

    const taxAmount = subTotal * (settings.taxRate / 100);
    const grandTotal = subTotal + taxAmount;
    
    document.getElementById('sub-total').textContent = `${subTotal.toFixed(2)} ${settings.currency}`;
    document.getElementById('tax-amount').textContent = `${taxAmount.toFixed(2)} ${settings.currency}`;
    document.getElementById('total-amount').textContent = `${grandTotal.toFixed(2)} ${settings.currency}`;
}

function clearCart() {
    if (confirm("လက်ရှိ အရောင်းစာရင်းကို လုံးဝရှင်းလင်းမလား။")) {
        cart = [];
        updateCartDisplay();
    }
}

function checkout() {
    if (cart.length === 0) {
        alert("အရောင်းပြုလုပ်ရန် ပစ္စည်းများ ထည့်သွင်းပါ။");
        return;
    }

    const subTotal = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
    const taxAmount = subTotal * (settings.taxRate / 100);
    const grandTotal = subTotal + taxAmount;

    if (confirm(`စုစုပေါင်း ငွေပမာဏ: ${grandTotal.toFixed(2)} ${settings.currency}။ အရောင်းလုပ်ငန်းကို အတည်ပြုပါ။`)) {
        
        // 1. Create New Sale Record
        const newSale = {
            id: Date.now(),
            items: JSON.parse(JSON.stringify(cart)),
            subTotal: subTotal.toFixed(2),
            tax: taxAmount.toFixed(2),
            total: grandTotal.toFixed(2),
            date: new Date().toLocaleString('my-MM', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        };
        salesHistory.unshift(newSale);
        localStorage.setItem(SALE_HISTORY_KEY, JSON.stringify(salesHistory));

        // 2. Update Stock in the items array (Deduct from stock)
        cart.forEach(cartItem => {
            const itemIndex = items.findIndex(i => i.id === cartItem.id);
            if (itemIndex > -1) {
                items[itemIndex].stock -= cartItem.quantity;
            }
        });
        localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(items));
        
        // 3. Reset
        cart = []; 
        updateCartDisplay();
        renderItems(); 
        alert("အရောင်းပြုလုပ်ခြင်း အောင်မြင်ပါသည်။");
    }
}

function showHistory(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick*="'${type}'"]`).classList.add('active');
    
    document.querySelectorAll('#history-content ul').forEach(ul => ul.classList.remove('active'));
    document.getElementById(`${type}-history-list`).classList.add('active');

    renderHistory(type);
}

function renderHistory(type) {
    const historyList = document.getElementById(`${type}-history-list`);
    const data = (type === 'sale') ? salesHistory : purchaseHistory;
    const title = (type === 'sale') ? "ရောင်းချမှု" : "ဝယ်ယူမှု";

    historyList.innerHTML = '';

    if (data.length === 0) {
        historyList.innerHTML = `<li>${title} မှတ်တမ်း မရှိသေးပါ။</li>`;
        return;
    }

    data.forEach(record => {
        const li = document.createElement('li');
        // Check for 'items' array (for sales) or 'quantity' (for purchases)
        const itemCount = record.items ? record.items.reduce((sum, item) => sum + item.quantity, 0) : record.quantity || 1;
        
        li.innerHTML = `
            <div class="item-details">
                <strong>${title} ID: ${record.id.toString().slice(-6)}</strong><br>
                <span>ပစ္စည်းအရေအတွက်: ${itemCount} ${title === 'ဝယ်ယူမှု' ? 'ခု' : 'မျိုး'}</span> | 
                <small>ရက်စွဲ: ${record.date}</small>
            </div>
            <strong>${record.total || record.subTotal} ${settings.currency}</strong>
            <div class="action-buttons">
                <button class="delete-btn" onclick="deleteHistory('${type}', ${record.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        historyList.appendChild(li);
    });
}

function deleteHistory(type, id) {
    if (!confirm(`${type === 'sale' ? 'ရောင်းချမှု' : 'ဝယ်ယူမှု'} မှတ်တမ်း ID ${id.toString().slice(-6)} ကို ဖျက်ရန် သေချာပါသလား။`)) return;

    if (type === 'sale') {
        salesHistory = salesHistory.filter(r => r.id !== id);
        localStorage.setItem(SALE_HISTORY_KEY, JSON.stringify(salesHistory));
    } else if (type === 'purchase') {
        // When deleting purchase from history, undo stock change
        const record = purchaseHistory.find(r => r.id === id);
        if(record) {
             const itemToUpdate = items.find(item => item.name.toLowerCase() === record.name.toLowerCase());
            if (itemToUpdate) {
                itemToUpdate.stock -= record.quantity; // Reduce stock by the purchased quantity
                localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(items));
            }
        }
        
        purchaseHistory = purchaseHistory.filter(r => r.id !== id);
        localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(purchaseHistory));
    }
    
    renderHistory(type);
    if(type === 'purchase') {
        renderPurchaseRecords(); 
        renderItems();
    }
}

// ------------------------------------
// --- Settings and Info Functions ---
// ------------------------------------

function saveSettings(event) {
    event.preventDefault();
    settings.currency = document.getElementById('currency').value.trim() || 'ကျပ်';
    settings.taxRate = parseFloat(document.getElementById('tax-rate').value) || 0;
    
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.getElementById('tax-rate-display').textContent = settings.taxRate;
    alert("စနစ်ပြင်ဆင်မှုများ သိမ်းဆည်းပြီးပါပြီ။");
    updateCartDisplay(); 
}

function saveBusinessInfo(event) {
    event.preventDefault();
    businessInfo.name = document.getElementById('business-name').value;
    businessInfo.phone = document.getElementById('phone').value;
    businessInfo.address = document.getElementById('address').value;
    
    localStorage.setItem(INFO_KEY, JSON.stringify(businessInfo));
    document.querySelector('.app-title').textContent = businessInfo.name; 
    alert("လုပ်ငန်းအချက်အလက် သိမ်းဆည်းပြီးပါပြီ။");
}
