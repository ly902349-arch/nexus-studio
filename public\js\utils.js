/**
 * Nexus Studio - أدوات مساعدة
 * النسخة 1.0 - قابل للنسخ
 */

class NexusUtils {
    constructor() {
        this.apiBaseUrl = 'https://api.nexusstudio.dev';
        this.version = '1.0.0';
    }
    
    // تحقق من صحة البريد الإلكتروني
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // تحقق من قوة كلمة المرور
    checkPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        return strength;
    }
    
    // تنسيق التاريخ
    formatDate(date, format = 'ar-EG') {
        const d = new Date(date);
        return d.toLocaleDateString(format, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }
    
    // تنسيق الوقت
    formatTime(date) {
        const d = new Date(date);
        return d.toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // تنسيق الأرقام
    formatNumber(num) {
        return new Intl.NumberFormat('ar-EG').format(num);
    }
    
    // تقصير النص
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // نسخ للنصوص
    copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => this.showToast('تم النسخ', 'success'))
            .catch(() => this.showToast('فشل النسخ', 'error'));
    }
    
    // تحميل ملف
    async uploadFile(file, type = 'image') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/upload`, {
                method: 'POST',
                body: formData
            });
            
            return await response.json();
        } catch (error) {
            throw new Error('فشل رفع الملف');
        }
    }
    
    // جلب البيانات
    async fetchData(endpoint, options = {}) {
        const token = localStorage.getItem('nexus-token');
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                ...options,
                headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }
    
    // التخزين المحلي
    setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage error:', error);
        }
    }
    
    getStorage(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    }
    
    removeStorage(key) {
        localStorage.removeItem(key);
    }
    
    // توليد ID فريد
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // إظهار Toast
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">✕</button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
    
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    // إظهار Modal
    showModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        ✕
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${buttons.map(btn => 
                        `<button class="btn btn-${btn.type}" onclick="${btn.onclick}">
                            ${btn.text}
                        </button>`
                    ).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        return modal;
    }
    
    // إخفاء Modal
    hideModal(modal) {
        if (modal && modal.parentNode) {
            modal.remove();
        }
    }
    
    // تشفير بسيط
    encrypt(text) {
        return btoa(encodeURIComponent(text));
    }
    
    // فك تشفير
    decrypt(encrypted) {
        return decodeURIComponent(atob(encrypted));
    }
    
    // التحقق من الاتصال بالإنترنت
    checkOnline() {
        return navigator.onLine;
    }
    
    // تتبع الاتصال
    setupConnectionListener() {
        window.addEventListener('online', () => {
            this.showToast('تم استعادة الاتصال بالإنترنت', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('فقدان الاتصال بالإنترنت', 'warning');
        });
    }
    
    // تهيئة الأخطاء
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showToast('حدث خطأ غير متوقع', 'error');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showToast('حدث خطأ في المعالجة', 'error');
        });
    }
}

// تهيئة الأدوات
const utils = new NexusUtils();

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    utils.setupConnectionListener();
    utils.setupErrorHandling();
});

// جعل الأدوات متاحة عالمياً
window.utils = utils;