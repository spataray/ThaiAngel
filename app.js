document.addEventListener('DOMContentLoaded', () => {

    // --- RANDOM BACKGROUND ---
    // This is your exact code for random backgrounds.
    const setRandomBackground = () => {
        const backgroundImages = [
           "images/TAStation-1.JPG", "images/TAStation-2.JPG", "images/TAStation-3.JPG", 
           "images/TAStation-4.JPG", "images/TAStation-5.JPG", "images/TAStation-6.JPG", 
           "images/TAStation-7.JPG", "images/TAStation-8.JPG", "images/TAStation-9.JPG",
           "images/TAStation-10.JPG", "images/TAStation-11.JPG", "images/TAStation-12.JPG",
           "images/TAStation-13.JPG", "images/TAStation-14.JPG", "images/TAStation-15.JPG",
           "images/TAStation-16.JPG", "images/TAStation-17.JPG", "images/TAStation-18.JPG",
           "images/TAStation-19.JPG", "images/TAStation-20.JPG", "images/TAStation-21.JPG",
           "images/TAStation-22.JPG"
        ];
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        const selectedImage = backgroundImages[randomIndex];
        document.body.style.backgroundImage = `url("${selectedImage}")`;
    };

    // Set the background as soon as the page loads
    setRandomBackground();

    // --- DATA MANAGEMENT ---
    const getData = (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    };
    const saveData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    let products = getData('products');
    let requests = getData('requests');

    // --- PAGE NAVIGATION ---
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('nav a');
    const showPage = (pageId) => {
        pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        navLinks.forEach(link => link.classList.toggle('active', link.id === `nav-${pageId.split('-')[1]}`));
    };
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageId = `page-${link.id.split('-')[1]}`;
            showPage(pageId);
        });
    });

    // --- RENDERING FUNCTIONS ---
    const renderProducts = () => {
        const productsList = document.getElementById('products-list');
        productsList.innerHTML = '';
        products.forEach((product, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div>
                    <span class="list-item-details">${product.name}</span>
                    <span class="list-item-distributor">(${product.distributor})</span>
                </div>
                <button class="delete-btn" data-index="${index}">Delete</button>
            `;
            productsList.appendChild(item);
        });
    };
    const renderProductSelect = () => {
        const productSelect = document.getElementById('product-select');
        productSelect.innerHTML = '<option value="">--Please choose a product--</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = `${product.name} (${product.distributor})`;
            productSelect.appendChild(option);
        });
    };
    const renderRequests = () => {
        const requestsList = document.getElementById('requests-list');
        requestsList.innerHTML = '';
        requests.forEach((request, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <span class="list-item-details">${request.name}</span>
                <button class="delete-btn" data-index="${index}">Ordered / Remove</button>
            `;
            requestsList.appendChild(item);
        });
    };
    
    // --- EVENT LISTENERS FOR FORMS AND BUTTONS ---
    document.getElementById('add-product-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const nameInput = document.getElementById('product-name');
        const distributorInput = document.getElementById('product-distributor');
        products.push({ name: nameInput.value, distributor: distributorInput.value });
        saveData('products', products);
        renderProducts();
        renderProductSelect();
        nameInput.value = '';
        distributorInput.value = '';
    });
    document.getElementById('products-list').addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const index = event.target.dataset.index;
            products.splice(index, 1);
            saveData('products', products);
            renderProducts();
            renderProductSelect();
        }
    });
    document.getElementById('request-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const productSelect = document.getElementById('product-select');
        const selectedProductName = productSelect.value;
        if (selectedProductName && !requests.some(req => req.name === selectedProductName)) {
            requests.push({ name: selectedProductName });
            saveData('requests', requests);
            renderRequests();
        }
        productSelect.value = '';
    });
    document.getElementById('requests-list').addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const index = event.target.dataset.index;
            requests.splice(index, 1);
            saveData('requests', requests);
            renderRequests();
        }
    });

    // --- SETTINGS: BACKUP AND RESTORE ---
    document.getElementById('backup-data').addEventListener('click', () => {
        const backupData = { products: products, requests: requests };
        const csvContent = "data:text/csv;charset=utf-8," + JSON.stringify(backupData);
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ta_station_backup.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    document.getElementById('restore-data').addEventListener('click', () => {
        document.getElementById('restore-file-input').click();
    });
    document.getElementById('restore-file-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const restoredData = JSON.parse(e.target.result);
                if (restoredData.products && restoredData.requests) {
                    products = restoredData.products;
                    requests = restoredData.requests;
                    saveData('products', products);
                    saveData('requests', requests);
                    renderAll(); 
                    alert('Data restored successfully!');
                } else {
                    alert('Invalid backup file format.');
                }
            } catch (error) {
                alert('Could not restore data. The file may be corrupt.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    });

    // --- INITIAL RENDER ---
    const renderAll = () => {
        renderProducts();
        renderProductSelect();
        renderRequests();
    };
    renderAll();
});

