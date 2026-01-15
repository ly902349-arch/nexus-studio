/**
 * Nexus Studio - التطبيق الرئيسي
 * النسخة 1.0 - قابل للنسخ
 */

class NexusApp {
    constructor() {
        this.currentTheme = 'light';
        this.currentPage = 'home';
        this.isLoading = false;
    }
    
    // تهيئة التطبيق
    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.checkAuth();
        this.setupServiceWorker();
    }
    
    // تحميل الوضع الفاتح/الداكن
    loadTheme() {
        const savedTheme = localStorage.getItem('nexus-theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    // تبديل الوضع
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        localStorage.setItem('nexus-theme', newTheme);
    }
    
    // تعيين الوضع
    setTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        
        // تحديث زر الوضع
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) {
            themeBtn.innerHTML = theme === 'light' 
                ? '<i class="fas fa-moon"></i>'
                : '<i class="fas fa-sun"></i>';
        }
    }
    
    // التحقق من المصادقة
    checkAuth() {
        const token = localStorage.getItem('nexus-token');
        if (token) {
            this.user = this.decodeToken(token);
            this.updateUIForAuth(true);
        } else {
            this.updateUIForAuth(false);
        }
    }
    
    // تحديث الواجهة حسب حالة المصادقة
    updateUIForAuth(isAuthenticated) {
        const authElements = document.querySelectorAll('.auth-only');
        const guestElements = document.querySelectorAll('.guest-only');
        
        if (isAuthenticated) {
            authElements.forEach(el => el.style.display = '');
            guestElements.forEach(el => el.style.display = 'none');
            
            // تحديث معلومات المستخدم
            const userElements = document.querySelectorAll('.user-name');
            userElements.forEach(el => {
                el.textContent = this.user?.name || 'مستخدم';
            });
        } else {
            authElements.forEach(el => el.style.display = 'none');
            guestElements.forEach(el => el.style.display = '');
        }
    }
    
    // تسجيل الدخول
    async login(email, password) {
        this.showLoading();
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('nexus-token', data.token);
                this.user = data.user;
                this.updateUIForAuth(true);
                this.navigate('dashboard');
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            this.showError('خطأ في الاتصال بالخادم');
        } finally {
            this.hideLoading();
        }
    }
    
    // تسجيل الخروج
    logout() {
        localStorage.removeItem('nexus-token');
        this.user = null;
        this.updateUIForAuth(false);
        this.navigate('home');
    }
    
    // التنقل بين الصفحات
    navigate(page, params = {}) {
        this.currentPage = page;
        
        // تحديث URL
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        history.pushState({ page }, '', url);
        
        // تحميل الصفحة
        this.loadPage(page, params);
    }
    
    // تحميل الصفحة
    async loadPage(page, params) {
        this.showLoading();
        
        try {
            const response = await fetch(`src/pages/${page}.html`);
            const html = await response.text();
            
            document.getElementById('content').innerHTML = html;
            
            // تشغيل سكريبتات الصفحة
            this.runPageScript(page, params);
            
            // تحديث القائمة النشطة
            this.updateActiveNav(page);
        } catch (error) {
            document.getElementById('content').innerHTML = `
                <div class="error-container">
                    <h2>خطأ في تحميل الصفحة</h2>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="app.navigate('home')">
                        العودة للرئيسية
                    </button>
                </div>
            `;
        } finally {
            this.hideLoading();
        }
    }
    
    // تشغيل سكريبتات الصفحة
    runPageScript(page, params) {
        switch(page) {
            case 'dashboard':
                this.initDashboard(params);
                break;
            case 'editor':
                this.initEditor(params);
                break;
            case 'analytics':
                this.initAnalytics(params);
                break;
            case 'collaboration':
                this.initCollaboration(params);
                break;
        }
    }
    
    // تحديث القائمة النشطة
    updateActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    // إعداد Service Worker
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registered:', registration);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed:', error);
                    });
            });
        }
    }
    
    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تغيير الوضع
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
            
            // التنقل
            if (e.target.closest('[data-page]')) {
                e.preventDefault();
                const page = e.target.closest('[data-page]').dataset.page;
                this.navigate(page);
            }
            
            // تسجيل الخروج
            if (e.target.closest('.logout-btn')) {
                this.logout();
            }
        });
        
        // زر الرجوع
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigate(e.state.page);
            }
        });
    }
    
    // إظهار التحميل
    showLoading() {
        this.isLoading = true;
        const overlay = document.getElementById('loading');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }
    
    // إخفاء التحميل
    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loading');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    // إظهار خطأ
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">✕</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    // إظهار نجاح
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-toast';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">✕</button>
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }
    
    // فك تشفير Token
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    }
    
    // تهيئة Dashboard
    initDashboard(params) {
        console.log('Dashboard initialized with:', params);
        // TODO: تحميل بيانات Dashboard
    }
    
    // تهيئة Editor
    initEditor(params) {
        console.log('Editor initialized with:', params);
        // TODO: تحميل محرر الفيديو
    }
    
    // تهيئة Analytics
    initAnalytics(params) {
        console.log('Analytics initialized with:', params);
        // TODO: تحميل التحليلات
    }
    
    // تهيئة Collaboration
    initCollaboration(params) {
        console.log('Collaboration initialized with:', params);
        // TODO: تحميل نظام التعاون
    }
}

// تهيئة التطبيق
const app = new NexusApp();

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// جعل التطبيق متاحاً عالمياً
window.app = app;