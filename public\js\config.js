/**
 * 🔐 إعدادات Nexus Studio - ملف الإعدادات الرئيسي
 * ⚠️ هذا الملف لا يرفع إلى GitHub!
 */

const NEXUS_CONFIG = {
    // ======================
    // 🔑 API Keys - مفتاح Gemini API
    // ======================
    GEMINI_API_KEY: 'AIzaSyC3LF_6zMoGFQjapSu3imzLVW6GJ6e8sWY',
    
    // ======================
    // 📱 إعدادات التطبيق
    // ======================
    APP_VERSION: '1.0.0',
    APP_NAME: 'Nexus Studio',
    APP_DESCRIPTION: 'منصة المحتوى الذكية المطورة من iPhone',
    APP_URL: 'https://nexus-studio.vercel.app',
    
    // ======================
    // 🤖 إعدادات الذكاء الاصطناعي
    // ======================
    AI_SETTINGS: {
        MODEL: 'gemini-pro',
        TEMPERATURE: 0.7,
        MAX_TOKENS: 2048,
        LANGUAGE: 'ar',
        MAX_HISTORY: 10,
        ENABLED: true
    },
    
    // ======================
    // 🎨 إعدادات التصميم
    // ======================
    THEME: {
        PRIMARY_COLOR: '#6366f1',
        SECONDARY_COLOR: '#8b5cf6',
        ACCENT_COLOR: '#ec4899',
        SUCCESS_COLOR: '#10b981',
        WARNING_COLOR: '#f59e0b',
        DANGER_COLOR: '#ef4444',
        BACKGROUND: '#ffffff',
        TEXT_PRIMARY: '#111827',
        TEXT_SECONDARY: '#6b7280'
    },
    
    // ======================
    // 🌐 إعدادات اللغة
    // ======================
    LANGUAGE: {
        CODE: 'ar',
        DIRECTION: 'rtl',
        FONT: 'Cairo',
        LOCALE: 'ar-EG'
    },
    
    // ======================
    // ⚡ إعدادات الأداء
    // ======================
    PERFORMANCE: {
        CACHE_ENABLED: true,
        CACHE_DURATION: 3600, // ثانية
        LAZY_LOAD: true,
        COMPRESSION: true
    },
    
    // ======================
    // 📊 إعدادات التحليلات
    // ======================
    ANALYTICS: {
        ENABLED: true,
        TRACK_PAGEVIEWS: true,
        TRACK_EVENTS: true,
        TRACK_ERRORS: true
    },
    
    // ======================
    // 🔒 إعدادات الأمان
    // ======================
    SECURITY: {
        ENCRYPT_KEYS: false,
        VALIDATE_INPUTS: true,
        SANITIZE_HTML: true,
        CORS_ENABLED: true
    },
    
    // ======================
    // 🛠️ إعدادات التطوير
    // ======================
    DEVELOPMENT: {
        DEBUG: true,
        LOG_LEVEL: 'info', // debug, info, warn, error
        CONSOLE_LOG: true,
        SHOW_ERRORS: true
    }
};

// جعل الإعدادات متاحة عالمياً
window.NEXUS_CONFIG = NEXUS_CONFIG;

// رسالة تحميل
console.log(`
╔═══════════════════════════════════════╗
║      🚀 Nexus Studio v1.0.0          ║
║      🤖 Gemini AI مفعل                ║
║      📱 مطور من iPhone               ║
╚═══════════════════════════════════════╝

✅ الإعدادات جاهزة
🔗 الموقع: ${NEXUS_CONFIG.APP_URL}
🔐 المفتاح: ${NEXUS_CONFIG.GEMINI_API_KEY.substring(0, 10)}...
📊 الوضع: ${NEXUS_CONFIG.DEVELOPMENT.DEBUG ? 'تطوير' : 'إنتاج'}
🌐 اللغة: ${NEXUS_CONFIG.LANGUAGE.CODE}

📌 استخدام: window.NEXUS_CONFIG
`);