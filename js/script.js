document.addEventListener('DOMContentLoaded', () => {
    // Debounce utility function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Authentication State
    let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    let userData = JSON.parse(localStorage.getItem('userData')) || {};
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let orders = JSON.parse(localStorage.getItem('orders')) || [];

    // Elements
    const cartCount = document.getElementById('cart-count');
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const authForm = document.getElementById('auth-form');
    const authBtn = document.getElementById('auth-btn');
    const authTitle = document.getElementById('auth-title');
    const toggleAuth = document.getElementById('toggle-auth');
    const registerFields = document.getElementById('register-fields');
    const logoutBtn = document.getElementById('logout-btn');
    const userName = document.getElementById('user-name');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');

    // Initialize cart with quantity if not present
    cart = cart.map(item => ({
        ...item,
        quantity: item.quantity || 1
    }));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();

    // Check login status for account page
    function checkAuth() {
        const isAccountPage = document.documentElement.dataset.page === 'account';
        if (isAccountPage && authSection && dashboardSection) {
            if (isLoggedIn) {
                authSection.classList.add('d-none');
                dashboardSection.classList.remove('d-none');
                if (userName) userName.textContent = userData.fullName || 'User';
                if (profileName) profileName.textContent = userData.fullName || 'N/A';
                if (profileEmail) profileEmail.textContent = userData.email || 'N/A';
            } else {
                authSection.classList.remove('d-none');
                dashboardSection.classList.add('d-none');
            }
        }
    }

    checkAuth();

    // Toggle between login and register
    let isRegisterMode = false;
    if (toggleAuth) {
        toggleAuth.addEventListener('click', (e) => {
            e.preventDefault();
            isRegisterMode = !isRegisterMode;
            if (authTitle) authTitle.textContent = isRegisterMode ? 'Register' : 'Login';
            if (authBtn) authBtn.textContent = isRegisterMode ? 'Register' : 'Login';
            if (toggleAuth) toggleAuth.textContent = isRegisterMode ? 'Already have an account? Login here' : 'Need an account? Register here';
            if (registerFields) registerFields.classList.toggle('d-none', !isRegisterMode);
            if (authForm) authForm.reset();
            if (authForm) authForm.classList.remove('was-validated');
        });
    }

    // Handle form submission
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!authForm.checkValidity()) {
                authForm.classList.add('was-validated');
                return;
            }

            const email = document.getElementById('email')?.value?.trim();
            const password = document.getElementById('password')?.value?.trim();

            if (!email || !password) {
                alert('Please fill in all required fields.');
                return;
            }

            if (isRegisterMode) {
                const fullName = document.getElementById('fullName')?.value?.trim();
                if (!fullName) {
                    alert('Please enter your full name.');
                    return;
                }
                userData = { email, password, fullName };
                localStorage.setItem('userData', JSON.stringify(userData));
                localStorage.setItem('isLoggedIn', 'true');
                isLoggedIn = true;
                alert('Registration successful! You are now logged in.');
            } else {
                const storedUser = JSON.parse(localStorage.getItem('userData'));
                if (storedUser && storedUser.email === email && storedUser.password === password) {
                    localStorage.setItem('isLoggedIn', 'true');
                    isLoggedIn = true;
                    alert('Login successful!');
                } else {
                    alert('Invalid email or password.');
                    return;
                }
            }

            authForm.reset();
            authForm.classList.remove('was-validated');
            checkAuth();
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.setItem('isLoggedIn', 'false');
            isLoggedIn = false;
            userData = {};
            localStorage.setItem('userData', JSON.stringify(userData));
            alert('You have been logged out.');
            checkAuth();
        });
    }

    // Edit Profile Functionality
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        if (!isLoggedIn) {
            alert('Please login or register to edit your profile.');
            window.location.href = 'account.html';
            return;
        }
        const editFullName = document.getElementById('fullName');
        const editEmail = document.getElementById('email');
        if (editFullName) editFullName.value = userData.fullName || '';
        if (editEmail) editEmail.value = userData.email || '';

        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!editProfileForm.checkValidity()) {
                editProfileForm.classList.add('was-validated');
                return;
            }

            const fullName = document.getElementById('fullName')?.value?.trim();
            const email = document.getElementById('email')?.value?.trim();
            const password = document.getElementById('password')?.value?.trim();
            const confirmPassword = document.getElementById('confirmPassword')?.value?.trim();

            if (!fullName || !email) {
                alert('Please fill in all required fields.');
                return;
            }

            if (password && password !== confirmPassword) {
                const confirmPasswordInput = document.getElementById('confirmPassword');
                if (confirmPasswordInput) confirmPasswordInput.classList.add('is-invalid');
                return;
            }

            userData.fullName = fullName;
            userData.email = email;
            if (password) userData.password = password;

            localStorage.setItem('userData', JSON.stringify(userData));
            alert('Profile updated successfully!');
            window.location.href = 'account.html';
        });
    }

    // Link Edit Profile button from account.html
    const editProfileBtn = document.getElementById('edit-profile');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            window.location.href = 'editProfile.html';
        });
    }

    // Add to Cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (!isLoggedIn) {
                alert('Please login or register to add items to your cart.');
                window.location.href = 'account.html';
                return;
            }

            let product, price;
            try {
                product = e.target.dataset.product || button.closest('.card-body')?.querySelector('.card-title')?.textContent?.trim();
                price = parseFloat(e.target.dataset.price) || parseFloat(
                    button.closest('.card-body')?.querySelector('.card-text')?.textContent?.match(/GH₵\d+(\.\d+)?/)?.[0]?.replace('GH₵', '')
                );

                if (!product || isNaN(price)) {
                    throw new Error('Invalid product or price');
                }

                const existingItem = cart.find(item => item.product === product);
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    cart.push({ product, price, quantity: 1 });
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
                alert(`${product} added to cart!`);
            } catch (error) {
                console.error('Error adding to cart:', error);
                alert('Failed to add item to cart. Please try again.');
            }
        });
    });

    // Update cart display function with loading spinner
    function updateCartDisplay() {
        const loadingSpinner = document.getElementById('cart-loading');
        if (loadingSpinner) loadingSpinner.style.display = 'block';

        const cartItems = document.querySelector('.cart-items');
        const cartTotal = document.getElementById('cart-total');

        if (cartItems) {
            if (!isLoggedIn) {
                cartItems.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">Please login or register to view your cart.</td>
                    </tr>
                `;
            } else if (cart.length === 0) {
                cartItems.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">Your cart is empty.</td>
                    </tr>
                `;
            } else {
                const isCheckoutPage = window.location.pathname.includes('checkout.html');
                if (isCheckoutPage) {
                    cartItems.innerHTML = cart.map((item) => `
                        <tr>
                            <td>${item.product}</td>
                            <td>${item.quantity}</td>
                            <td>GH₵${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('');
                } else {
                    cartItems.innerHTML = cart.map((item, index) => `
                        <tr>
                            <td>${item.product}</td>
                            <td>GH₵${item.price.toFixed(2)}</td>
                            <td>
                                <div class="quantity-control">
                                    <button class="btn btn-outline-secondary btn-sm decrease-quantity" data-index="${index}">-</button>
                                    <input type="number" class="form-control quantity-input" data-index="${index}" value="${item.quantity}" min="1" max="99">
                                    <button class="btn btn-outline-secondary btn-sm increase-quantity" data-index="${index}">+</button>
                                </div>
                            </td>
                            <td>GH₵${(item.price * item.quantity).toFixed(2)}</td>
                            <td>
                                <button class="btn btn-danger btn-sm remove-item" data-index="${index}">Remove</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }

            if (!window.location.pathname.includes('checkout.html') && isLoggedIn) {
                document.querySelectorAll('.remove-item').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const index = parseInt(e.target.dataset.index);
                        cart.splice(index, 1);
                        localStorage.setItem('cart', JSON.stringify(cart));
                        updateCartDisplay();
                    });
                });

                document.querySelectorAll('.increase-quantity').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const index = parseInt(e.target.dataset.index);
                        cart[index].quantity = Math.min(cart[index].quantity + 1, 99);
                        localStorage.setItem('cart', JSON.stringify(cart));
                        updateCartDisplay();
                    });
                });

                document.querySelectorAll('.decrease-quantity').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const index = parseInt(e.target.dataset.index);
                        if (cart[index].quantity > 1) {
                            cart[index].quantity--;
                            localStorage.setItem('cart', JSON.stringify(cart));
                            updateCartDisplay();
                        }
                    });
                });

                document.querySelectorAll('.quantity-input').forEach(input => {
                    input.addEventListener('change', debounce((e) => {
                        const index = parseInt(e.target.dataset.index);
                        const value = parseInt(e.target.value);
                        if (value >= 1) {
                            cart[index].quantity = Math.min(value, 99);
                            localStorage.setItem('cart', JSON.stringify(cart));
                            updateCartDisplay();
                        } else {
                            e.target.value = cart[index].quantity;
                            alert('Quantity must be at least 1.');
                        }
                    }, 300));
                });
            }
        }

        if (cartTotal) {
            const total = isLoggedIn ? cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
            cartTotal.textContent = `Total: GH₵${total.toFixed(2)}`;
        }

        if (cartCount) {
            cartCount.textContent = isLoggedIn ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
        }

        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }

    // Clear Cart functionality
    const clearCartBtn = document.getElementById('clearCart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (!isLoggedIn) {
                alert('Please login or register to manage your cart.');
                window.location.href = 'account.html';
                return;
            }
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
            alert('Cart cleared!');
        });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isLoggedIn) {
                alert('Please login or register to proceed to checkout.');
                window.location.href = 'account.html';
                return;
            }
            if (cart.length === 0) {
                alert('Your cart is empty. Add some items before checking out!');
            } else {
                window.location.href = 'checkout.html';
            }
        });
    }

    // Place Order functionality
    const placeOrderBtn = document.getElementById('placeOrder');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isLoggedIn) {
                alert('Please login or register to place an order.');
                window.location.href = 'account.html';
                return;
            }
            const checkoutForm = document.getElementById('checkout-form');
            if (checkoutForm.checkValidity()) {
                const formData = {
                    fullName: document.getElementById('fullName')?.value?.trim(),
                    email: document.getElementById('email')?.value?.trim(),
                    address: document.getElementById('address')?.value?.trim(),
                    city: document.getElementById('city')?.value?.trim(),
                    postalCode: document.getElementById('postalCode')?.value?.trim(),
                    country: document.getElementById('country')?.value?.trim(),
                    paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value,
                    orderItems: [...cart],
                    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    orderId: 'ORD' + Date.now(),
                    date: new Date().toLocaleDateString(),
                    status: 'Pending'
                };

                orders.push(formData);
                localStorage.setItem('orders', JSON.stringify(orders));
                console.log('Order Details:', formData);

                alert('Order placed successfully! Thank you for your purchase.');
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
                window.location.href = 'index.html';
            } else {
                checkoutForm.classList.add('was-validated');
            }
        });
    }

    // Display Order History
    function displayOrderHistory() {
        const orderBody = document.getElementById('order-history-body');
        const noOrdersMessage = document.getElementById('no-orders-message');
        if (orderBody) {
            if (!isLoggedIn) {
                orderBody.innerHTML = '';
                if (noOrdersMessage) noOrdersMessage.textContent = 'Please login or register to view your order history.';
                if (noOrdersMessage) noOrdersMessage.style.display = 'block';
            } else if (orders.length === 0) {
                orderBody.innerHTML = '';
                if (noOrdersMessage) noOrdersMessage.textContent = 'No orders found.';
                if (noOrdersMessage) noOrdersMessage.style.display = 'block';
            } else {
                if (noOrdersMessage) noOrdersMessage.style.display = 'none';
                orderBody.innerHTML = orders.map(order => `
                    <tr>
                        <td>${order.orderId}</td>
                        <td>${order.date}</td>
                        <td>${order.orderItems.map(item => `${item.product} (x${item.quantity})`).join(', ')}</td>
                        <td>GH₵${order.total.toFixed(2)}</td>
                        <td><span class="badge badge-${order.status.toLowerCase()}">${order.status}</span></td>
                        <td>
                            <button class="btn btn-outline-success btn-sm view-order" data-order-id="${order.orderId}">View</button>
                        </td>
                    </tr>
                `).join('');

                document.querySelectorAll('.view-order').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const orderId = e.target.dataset.orderId;
                        const order = orders.find(o => o.orderId === orderId);
                        if (order) {
                            alert(`Order Details:\nID: ${order.orderId}\nDate: ${order.date}\nItems: ${order.orderItems.map(item => `${item.product} (x${item.quantity})`).join(', ')}\nTotal: GH₵${order.total.toFixed(2)}\nStatus: ${order.status}`);
                        }
                    });
                });
            }
        }
    }

    if (document.documentElement.dataset.page === 'orderHistory') {
        displayOrderHistory();
    }

    // Update dashboard order history
    const orderHistoryDiv = document.getElementById('order-history');
    if (orderHistoryDiv && document.documentElement.dataset.page === 'account') {
        if (!isLoggedIn) {
            orderHistoryDiv.innerHTML = '<p>Please login or register to view your orders.</p>';
        } else if (orders.length === 0) {
            orderHistoryDiv.innerHTML = '<p>No orders yet.</p>';
        } else {
            orderHistoryDiv.innerHTML = `
                <ul class="list-group">
                    ${orders.slice(0, 3).map(order => `
                        <li class="list-group-item">
                            Order #${order.orderId} - ${order.date} - GH₵${order.total.toFixed(2)} 
                            <span class="badge badge-${order.status.toLowerCase()} ms-2">${order.status}</span>
                        </li>
                    `).join('')}
                </ul>
                <a href="orderHistory.html" class="btn btn-outline-success mt-3">View All Orders</a>
            `;
        }
    }

    // Scroll to Top functionality
    const scrollTopBtn = document.getElementById('scrollTop');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            scrollTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // EmailJS Integration for Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // Initialize EmailJS with the public key
        emailjs.init('1E4CYQCxZx4PzPPbQ');

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!contactForm.checkValidity()) {
                contactForm.classList.add('was-validated');
                return;
            }

            const formData = {
                from_name: document.getElementById('name')?.value?.trim(),
                from_email: document.getElementById('email')?.value?.trim(),
                phone: document.getElementById('phone')?.value?.trim(),
                subject: document.getElementById('subject')?.value?.trim(),
                message: document.getElementById('message')?.value?.trim(),
                preferred_contact: document.getElementById('preferredContact')?.value?.trim(),
                company_name: document.getElementById('companyName')?.value?.trim() || 'N/A'
            };

            emailjs.send('service_4hyrzhb', 'template_n9hl7qn', formData)
                .then(() => {
                    alert('Message sent successfully! We will get back to you soon.');
                    contactForm.reset();
                    contactForm.classList.remove('was-validated');
                }, (error) => {
                    console.error('EmailJS error:', error);
                    alert('Failed to send message. Please try again later.');
                });
        });
    }

    // Newsletter Signup
    const newsletterForm = document.querySelector('footer form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for subscribing!');
        });
    }

    // Product Filtering, Sorting and Pagination
    const products = document.querySelectorAll('.product-item');
    const productList = document.getElementById('productList');
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryFilters = document.querySelectorAll('.filter-category');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    const sortSelect = document.getElementById('sortSelect');

    if (productList && pagination) {
        const itemsPerPage = 9;
        let currentPage = 1;
        let filteredProducts = Array.from(products);

        if (priceRange && priceValue) {
            priceRange.addEventListener('input', () => {
                priceValue.textContent = `GH₵0 - GH₵${priceRange.value}`;
                filterProducts();
            });
        }

        function filterProducts() {
            const searchTerm = searchInput?.value.toLowerCase() || '';
            const selectedCategories = Array.from(categoryFilters)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => checkbox.value);
            const maxPrice = priceRange ? parseInt(priceRange.value) : Infinity;

            filteredProducts = Array.from(products).filter(product => {
                const title = product.querySelector('.card-title')?.textContent.toLowerCase() || '';
                const category = product.getAttribute('data-category') || '';
                const price = parseFloat(product.getAttribute('data-price')) || 0;

                return title.includes(searchTerm) &&
                       (selectedCategories.length === 0 || selectedCategories.includes(category)) &&
                       price <= maxPrice;
            });

            currentPage = 1;
            displayProducts();
            updatePagination();
        }

        function sortProducts(criteria) {
            if (criteria === 'price-asc') {
                filteredProducts.sort((a, b) => parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price')));
            } else if (criteria === 'price-desc') {
                filteredProducts.sort((a, b) => parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price')));
            }
            displayProducts();
            updatePagination();
        }

        function displayProducts() {
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;

            products.forEach(product => product.style.display = 'none');
            filteredProducts.slice(start, end).forEach(product => product.style.display = 'block');
        }

        function updatePagination() {
            const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
            pagination.innerHTML = '';

            const prevLi = document.createElement('li');
            prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
            prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
            prevLi.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentPage > 1) {
                    currentPage--;
                    displayProducts();
                    updatePagination();
                }
            });
            pagination.appendChild(prevLi);

            for (let i = 1; i <= totalPages; i++) {
                const li = document.createElement('li');
                li.className = `page-item ${i === currentPage ? 'active' : ''}`;
                li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
                li.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentPage = i;
                    displayProducts();
                    updatePagination();
                });
                pagination.appendChild(li);
            }

            const nextLi = document.createElement('li');
            nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
            nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
            nextLi.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentPage < totalPages) {
                    currentPage++;
                    displayProducts();
                    updatePagination();
                }
            });
            pagination.appendChild(nextLi);
        }

        if (searchBtn) searchBtn.addEventListener('click', filterProducts);
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') filterProducts();
            });
        }
        categoryFilters.forEach(checkbox => checkbox.addEventListener('change', filterProducts));
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => sortProducts(e.target.value));
        }

        filterProducts();
    }
});