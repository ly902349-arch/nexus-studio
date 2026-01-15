/**
 * Nexa AI - المساعد الذكي
 * النسخة 1.0 - قابل للنسخ
 */

class NexaAI {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
    }
    
    // تهيئة Nexa AI
    init() {
        this.loadMessages();
        this.setupWidget();
        this.setupEventListeners();
    }
    
    // تحميل المحادثات السابقة
    loadMessages() {
        const saved = localStorage.getItem('nexa-chat-history');
        if (saved) {
            this.messages = JSON.parse(saved);
        } else {
            this.messages = [{
                id: 1,
                type: 'nexa',
                content: 'مرحباً! أنا Nexa، مساعدك الذكي في Nexus Studio. كيف يمكنني مساعدتك اليوم؟',
                timestamp: new Date().toISOString()
            }];
        }
    }
    
    // حفظ المحادثات
    saveMessages() {
        localStorage.setItem('nexa-chat-history', JSON.stringify(this.messages));
    }
    
    // إعداد واجهة الـ Widget
    setupWidget() {
        const widgetHTML = `
            <div class="nexa-toggle" onclick="nexa.toggleChat()">
                <i class="fas fa-robot"></i>
            </div>
            
            <div class="nexa-chat-window">
                <div class="nexa-chat-header">
                    <div class="nexa-chat-avatar">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div class="nexa-chat-info">
                        <h3>Nexa AI</h3>
                        <p>مساعدك الذكي</p>
                    </div>
                    <div class="nexa-chat-status online"></div>
                    <button class="nexa-close" onclick="nexa.toggleChat()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="nexa-chat-messages" id="nexaMessages">
                    ${this.renderMessages()}
                </div>
                
                <div class="nexa-quick-actions">
                    <button onclick="nexa.quickAction('ideas')">
                        <i class="fas fa-lightbulb"></i>
                        أفكار محتوى
                    </button>
                    <button onclick="nexa.quickAction('edit')">
                        <i class="fas fa-edit"></i>
                        تحسين نص
                    </button>
                    <button onclick="nexa.quickAction('analyze')">
                        <i class="fas fa-chart-line"></i>
                        تحليل أداء
                    </button>
                </div>
                
                <div class="nexa-chat-input">
                    <textarea 
                        id="nexaInput" 
                        placeholder="اسألني عن أي شيء في المحتوى..."
                        rows="1"
                        onkeydown="nexa.handleKeyDown(event)"
                    ></textarea>
                    <button onclick="nexa.sendMessage()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('nexaWidget').innerHTML = widgetHTML;
    }
    
    // تبديل حالة الدردشة
    toggleChat() {
        this.isOpen = !this.isOpen;
        const window = document.querySelector('.nexa-chat-window');
        
        if (this.isOpen) {
            window.classList.add('show');
            document.getElementById('nexaInput').focus();
            this.scrollToBottom();
        } else {
            window.classList.remove('show');
        }
    }
    
    // إرسال رسالة
    async sendMessage() {
        const input = document.getElementById('nexaInput');
        const message = input.value.trim();
        
        if (!message || this.isTyping) return;
        
        // إضافة رسالة المستخدم
        this.addMessage('user', message);
        input.value = '';
        this.adjustTextarea();
        
        // مؤشر الكتابة
        this.showTypingIndicator();
        
        try {
            // محاكاة استجابة Nexa
            const response = await this.getAIResponse(message);
            
            // إخفاء مؤشر الكتابة
            this.hideTypingIndicator();
            
            // إضافة رد Nexa
            this.addMessage('nexa', response);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('nexa', 'عذراً، حدث خطأ. حاول مرة أخرى.');
        }
    }
    
    // إضافة رسالة
    addMessage(sender, content) {
        const message = {
            id: Date.now(),
            type: sender,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        this.saveMessages();
        this.renderMessages();
        this.scrollToBottom();
    }
    
    // عرض الرسائل
    renderMessages() {
        const messagesHTML = this.messages.map(msg => `
            <div class="nexa-message ${msg.type}">
                <div class="nexa-message-content">${this.formatMessage(msg.content)}</div>
                <div class="nexa-message-time">
                    ${this.formatTime(msg.timestamp)}
                </div>
            </div>
        `).join('');
        
        const container = document.getElementById('nexaMessages');
        if (container) {
            container.innerHTML = messagesHTML;
        }
        
        return messagesHTML;
    }
    
    // تنسيق الرسالة
    formatMessage(content) {
        // تحويل الروابط
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, url => 
            `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
        );
    }
    
    // تنسيق الوقت
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ar-EG', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // مؤشر الكتابة
    showTypingIndicator() {
        this.isTyping = true;
        const container = document.getElementById('nexaMessages');
        
        const indicator = document.createElement('div');
        indicator.className = 'nexa-typing-indicator';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        
        container.appendChild(indicator);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // التمرير لأسفل
    scrollToBottom() {
        const container = document.getElementById('nexaMessages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    // تعديل حجم Textarea
    adjustTextarea() {
        const textarea = document.getElementById('nexaInput');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    // التعامل مع مفاتيح الكتابة
    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        } else if (event.key === 'Enter' && event.shiftKey) {
            // يسمح بالسطر الجديد
        } else {
            setTimeout(() => this.adjustTextarea(), 0);
        }
    }
    
    // إجراءات سريعة
    quickAction(action) {
        const actions = {
            ideas: 'ساعدني في توليد أفكار لمحتوى فيديو جديد',
            edit: 'تحسين نص الفيديو التالي: ',
            analyze: 'حلل أداء آخر فيديو نشرته'
        };
        
        const input = document.getElementById('nexaInput');
        input.value = actions[action] || '';
        input.focus();
        this.adjustTextarea();
    }
    
    // الحصول على رد AI (محاكاة)
    async getAIResponse(userMessage) {
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const responses = [
            "هذه فكرة رائعة! هل تريدني أن أوسع فيها؟",
            "يمكنني مساعدتك في تحسين هذا المحتوى. إليك بعض الاقتراحات...",
            "بناءً على تحليل أدائك السابق، أنصحك بـ...",
            "لاحظت أن جمهورك يستجيب جيداً لمثل هذا النوع من المحتوى.",
            "هل تريد البدء في إنشاء محتوى بناءً على هذه الفكرة الآن؟",
            "لدي اقتراحات لتحسين العنوان والوصف لزيادة التفاعل.",
            "بناءً على اتجاهات السوق الحالية، هذا التوقيت ممتاز للنشر.",
            "يمكنني مساعدتك في كتابة سيناريو محترف لهذا الفيديو."
        ];
        
        // محاكاة تحليل الرسالة
        const message = userMessage.toLowerCase();
        
        if (message.includes('فكرة') || message.includes('موضوع')) {
            return "لدي عدة أفكار لمحتوى مميز:\n1. تعليمي: كيف تبدأ في...\n2. ترفيهي: أفضل 10...\n3. تحفيزي: قصص نجاح...\nأيها تفضل؟";
        }
        
        if (message.includes('تحليل') || message.includes('أداء')) {
            return "بناءً على بياناتك:\n- متوسط المشاهدة: 75%\n- التفاعل: أعلى من المعدل\n- وقت المشاهدة: 4:30 دقيقة\nاقتراح: حاول إضافة عناصر تفاعلية.";
        }
        
        if (message.includes('تحسين') || message.includes('نص')) {
            return "لتحسين النص:\n1. ابدأ بسؤال جذاب\n2. استخدم قصصاً قصيرة\n3. أضف دعوات واضحة للعمل\n4. ختم بملخص سريع\nهل تريد تطبيق هذه التعديلات؟";
        }
        
        // رد عشوائي
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // إعادة بناء الرسائل عند فتح الدردشة
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nexa-toggle')) {
                setTimeout(() => this.renderMessages(), 100);
            }
        });
        
        // تحديث حجم Textarea عند الكتابة
        document.addEventListener('input', (e) => {
            if (e.target.id === 'nexaInput') {
                this.adjustTextarea();
            }
        });
    }
}

// تهيئة Nexa AI
const nexa = new NexaAI();

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    nexa.init();
});

// جعل Nexa متاحاً عالمياً
window.nexa = nexa;