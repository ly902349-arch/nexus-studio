/**
 * 🤖 Gemini AI Integration - النسخة النهائية
 * الإصدار: 1.0.0
 * التاريخ: ${new Date().toLocaleDateString('ar-EG')}
 */

class GeminiAI {
    constructor() {
        // التحقق من وجود المفتاح
        if (!window.NEXUS_CONFIG || !window.NEXUS_CONFIG.GEMINI_API_KEY) {
            console.error('❌ مفتاح Gemini API غير موجود في الإعدادات');
            throw new Error('Gemini API Key not found in config');
        }
        
        // إعدادات API
        this.apiKey = window.NEXUS_CONFIG.GEMINI_API_KEY;
        this.model = window.NEXUS_CONFIG.AI_SETTINGS.MODEL || 'gemini-pro';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        
        // إعدادات المحادثة
        this.conversationHistory = [];
        this.maxHistory = window.NEXUS_CONFIG.AI_SETTINGS.MAX_HISTORY || 10;
        this.userName = 'مستخدم Nexus';
        this.assistantName = 'Nexa AI';
        
        // الإحصائيات
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            lastRequestTime: null
        };
        
        console.log('🤖 Gemini AI initialized with key:', this.apiKey.substring(0, 15) + '...');
    }

    /**
     * 🔄 إرسال رسالة إلى Gemini API
     */
    async sendMessage(prompt, options = {}) {
        // تحديث الإحصائيات
        this.stats.totalRequests++;
        this.stats.lastRequestTime = new Date().toISOString();
        
        try {
            console.log(`📤 [${this.stats.totalRequests}] إرسال: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
            
            // إضافة إلى تاريخ المحادثة
            this.addToHistory('user', prompt);
            
            // إعداد طلب API
            const requestBody = {
                contents: [{
                    parts: [{ text: this.formatPrompt(prompt, options) }]
                }],
                generationConfig: {
                    temperature: options.temperature || window.NEXUS_CONFIG.AI_SETTINGS.TEMPERATURE || 0.7,
                    topK: options.topK || 40,
                    topP: options.topP || 0.95,
                    maxOutputTokens: options.maxTokens || window.NEXUS_CONFIG.AI_SETTINGS.MAX_TOKENS || 2048,
                }
            };
            
            // إرسال الطلب
            const response = await fetch(
                `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: AbortSignal.timeout(30000) // وقت انتظار 30 ثانية
                }
            );

            // التحقق من الاستجابة
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            // التحقق من بنية الرد
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response structure from Gemini API');
            }

            const aiResponse = data.candidates[0].content.parts[0].text;
            const tokensUsed = data.usageMetadata?.totalTokenCount || 0;
            
            // تحديث الإحصائيات
            this.stats.successfulRequests++;
            this.stats.totalTokens += tokensUsed;
            
            // إضافة الرد إلى التاريخ
            this.addToHistory('assistant', aiResponse);
            
            console.log(`📥 [${this.stats.totalRequests}] استلام: "${aiResponse.substring(0, 50)}${aiResponse.length > 50 ? '...' : ''}"`);
            console.log(`📊 Tokens used: ${tokensUsed}`);
            
            return {
                success: true,
                message: aiResponse,
                tokens: tokensUsed,
                responseTime: new Date().toISOString(),
                requestId: `req_${Date.now()}`,
                stats: { ...this.stats }
            };
            
        } catch (error) {
            // تحديث إحصائيات الفشل
            this.stats.failedRequests++;
            
            console.error(`❌ [${this.stats.totalRequests}] خطأ في Gemini AI:`, error);
            
            // رد احتياطي ذكي
            const fallbackResponse = this.getFallbackResponse(prompt, error);
            
            return {
                success: false,
                message: fallbackResponse,
                error: {
                    message: error.message,
                    type: error.name,
                    code: error.code || 'UNKNOWN'
                },
                requestId: `err_${Date.now()}`,
                stats: { ...this.stats }
            };
        }
    }

    /**
     * 📝 تنسيق الرسالة مع السياق
     */
    formatPrompt(prompt, options) {
        let context = `أنت "Nexa" - مساعد ذكي عربي في منصة Nexus Studio.
الدور: مساعد محتوى عربي احترافي.
اللغة: العربية فقط (الفصحى والعامية المناسبة).
الأسلوب: ودود، مفيد، احترافي، وإبداعي.
المهمة: مساعدة المستخدم في إنشاء وتحسين المحتوى العربي.

التخصصات:
1. كتابة وتحرير السيناريوهات العربية
2. توليد أفكار المحتوى الإبداعية
3. تحليل أداء المحتوى وتقديم توصيات
4. تصميم خطط المحتوى والجرافيك
5. تحضير البث المباشر والمونتاج
6. كتابة النصوص التسويقية والإعلانية

القواعد:
- أجب باللغة العربية فقط
- كن مفيداً وعملياً
- قدم أمثلة وتطبيقات عملية
- انتبه للسياق والجمهور العربي
- استخدم تنسيقاً واضحاً ومنظماً

`;

        // إضافة تاريخ المحادثة
        if (this.conversationHistory.length > 0 && options.useHistory !== false) {
            context += '\n🔍 تاريخ المحادثة:\n';
            const recentHistory = this.conversationHistory.slice(-5);
            recentHistory.forEach(msg => {
                const role = msg.role === 'user' ? this.userName : this.assistantName;
                context += `${role}: ${msg.content}\n`;
            });
            context += '\n';
        }

        // إضافة السياق المحدد
        if (options.context) {
            context += `📌 السياق الإضافي: ${options.context}\n\n`;
        }

        context += `💬 السؤال الحالي من ${this.userName}: ${prompt}\n\n🤖 رد ${this.assistantName}:\n`;

        return context;
    }

    /**
     * 💾 إدارة تاريخ المحادثة
     */
    addToHistory(role, content) {
        const message = {
            role,
            content,
            timestamp: new Date().toISOString(),
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.conversationHistory.push(message);
        
        // الحفاظ على الحد الأقصى
        if (this.conversationHistory.length > this.maxHistory) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistory);
        }
        
        // حفظ في التخزين المحلي (اختياري)
        if (window.NEXUS_CONFIG?.AI_SETTINGS?.ENABLED) {
            this.saveHistory();
        }
    }

    /**
     * 💾 حفظ التاريخ محلياً
     */
    saveHistory() {
        try {
            localStorage.setItem('nexus_ai_history', JSON.stringify({
                history: this.conversationHistory,
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            }));
        } catch (error) {
            console.warn('⚠️ تعذر حفظ تاريخ المحادثة:', error);
        }
    }

    /**
     * 📂 تحميل التاريخ المحفوظ
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('nexus_ai_history');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.history && Array.isArray(data.history)) {
                    this.conversationHistory = data.history.slice(-this.maxHistory);
                    console.log(`📂 تم تحميل ${this.conversationHistory.length} رسالة من التاريخ`);
                }
            }
        } catch (error) {
            console.warn('⚠️ تعذر تحميل تاريخ المحادثة:', error);
        }
    }

    /**
     * 🆘 ردود احتياطية ذكية
     */
    getFallbackResponse(prompt, error) {
        console.log('🔄 استخدام الرد الاحتياطي بسبب:', error.message);
        
        const responses = {
            'فكرة': `💡 لدي عدة أفكار لمحتوى عربي رائع! 

هل تفضل:
1. أفكار تعليمية عملية؟
2. محتوى ترفيهي جذاب؟
3. فيديوهات تحفيزية ملهمة؟

أخبرني بمجال اهتمامك وسأعطيك أفضل الأفكار!`,
            
            'سيناريو': `📝 سأكتب لك سيناريو فيديو احترافي!

لكن أولاً، أخبرني:
🎯 موضوع الفيديو: 
⏱️ المدة المطلوبة: 
👥 الجمهور المستهدف: 
🎨 الأسلوب المفضل: 

وسأبدأ في الكتابة فوراً!`,
            
            'تحليل': `📊 لتحليل أداء المحتوى، أحتاج بعض المعلومات:

1. عدد المشاهدات:
2. نسبة التفاعل:
3. مدة المشاهدة المتوسطة:
4. المنصة المستخدمة:
5. نوع المحتوى:

مع هذه البيانات، سأقدم لك تحليلاً دقيقاً وتوصيات عملية للتحسين!`,
            
            'تصميم': `🎨 لتصميم ثامبريل جذاب، أنصحك بـ:

🔸 الألوان: استخدم تبايناً واضحاً (فاتح/غامق)
🔸 النص: عناوين قصيرة وجذابة
🔸 الصور: صور عالية الجودة وواضحة
🔸 التخطيط: اترك مساحات كافية

هل لديك فكرة محددة للتصميم؟`,
            
            'بث': `📹 لتحضير بث مباشر ناجح:

1. اختر وقتاً مناسباً للجمهور العربي
2. جهز نقاط الحديث الرئيسية
3. أضف عناصر تفاعلية (مسابقات، أسئلة)
4. روج للبث مسبقاً على وسائل التواصل
5. جهز خطة طوارئ للتعامل مع المشاكل الفنية

ما موضوع البث الذي تخطط له؟`
        };
        
        // البحث عن الكلمة المفتاحية
        const promptLower = prompt.toLowerCase();
        for (const [keyword, response] of Object.entries(responses)) {
            if (promptLower.includes(keyword)) {
                return response;
            }
        }
        
        // رد افتراضي ذكي
        return `🤔 أتساءل عن أفضل طريقة لمساعدتك!

للحصول على أفضل نتيجة:
1. كن محدداً في طلبك
2. أخبرني بالتفاصيل المهمة
3. حدد الهدف من المحتوى
4. اختر النوع المناسب (فيديو، منشور، بث مباشر)

حاول مرة أخرى مع مزيد من التفاصيل! 😊`;
    }

    /**
     * 💡 توليد أفكار فيديو
     */
    async generateVideoIdeas(topic, count = 5) {
        const prompt = `توليد ${count} أفكار فيديو عربية احترافية عن: ${topic}

المتطلبات:
✅ كل فكرة يجب أن تحتوي على:
1. العنوان الجذاب (بالعربية)
2. الفكرة الرئيسية (جملة واحدة)
3. الجمهور المستهدف
4. المدة المقترحة
5. 3 نقاط محتوى رئيسية
6. اقتراح للثامبريل
7. الهاشتاقات المناسبة

التنسيق المطلوب:
🎯 الفكرة 1:
العنوان: ...
الفكرة: ...
الجمهور: ...
المدة: ...
النقاط: 1) ... 2) ... 3) ...
الثامبريل: ...
الهاشتاقات: #... #... #...

... وهكذا لباقي الأفكار`;

        return await this.sendMessage(prompt, {
            temperature: 0.8,
            maxTokens: 1500
        });
    }

    /**
     * 📝 كتابة سيناريو فيديو
     */
    async writeVideoScript(topic, duration = 5, style = 'احترافي', audience = 'عربي عام') {
        const prompt = `كتابة سيناريو فيديو عربي كامل

الموضوع: ${topic}
المدة: ${duration} دقائق
الأسلوب: ${style}
الجمهور: ${audience}

المتطلبات:
🎬 الهيكل الكامل:
1. المقدمة (15% من الوقت)
   - جذب الانتباه
   - تقديم الموضوع
   - إثارة الفضول

2. المحتوى الرئيسي (70% من الوقت)
   - النقاط الرئيسية (3-5 نقاط)
   - الأمثلة والتطبيقات
   - الرسوم والبيانات (إن وجدت)

3. الخاتمة (15% من الوقت)
   - تلخيص سريع
   - الدعوة للعمل
   - التفاعل مع المشاهدين

📋 التنسيق المطلوب:
[الزمن] النص
(ملاحظات الإخراج)

مثال:
[0:00-0:30] السلام عليكم ورحمة الله وبركاته! 
(موسيقى هادئة، ظهور المتحدث)

... وهكذا`;

        return await this.sendMessage(prompt, {
            temperature: 0.7,
            maxTokens: 2000
        });
    }

    /**
     * 📊 تحليل أداء المحتوى
     */
    async analyzePerformance(data) {
        const prompt = `تحليل أداء المحتوى العربي وتقديم توصيات عملية

البيانات المتوفرة:
👁️ المشاهدات: ${data.views || 'غير متوفر'}
❤️ التفاعل: ${data.engagement || 'غير متوفر'}%
⏱️ مدة المشاهدة: ${data.watchTime || 'غير متوفر'}
📱 المنصة: ${data.platform || 'غير محدد'}
🎯 نوع المحتوى: ${data.type || 'غير محدد'}

المطلوب:
🔍 التحليل:
1. نقاط القوة (بناءً على البيانات)
2. نقاط الضعف والفرص الضائعة
3. مقارنة بالمعدلات القياسية للمنصة

💡 التوصيات:
1. 3 توصيات عملية فورية للتحسين
2. استراتيجية للمحتوى القادم
3. تحسينات تقنية وفنية
4. نصائح للتفاعل مع الجمهور

📈 التوقعات:
- توقع الأداء بعد التطبيق
- الوقت المتوقع للتحسن
- المقاييس التي يجب تتبعها`;

        return await this.sendMessage(prompt, {
            temperature: 0.6,
            maxTokens: 1800
        });
    }

    /**
     * 🎨 تصميم ثامبريل
     */
    async designThumbnail(videoTitle, style = 'جذاب', platform = 'يوتيوب') {
        const prompt = `تصميم وصف تفصيلي لثامبريل فيديو ${platform}

عنوان الفيديو: ${videoTitle}
النمط المطلوب: ${style}

المتطلبات:
🎨 نظام الألوان:
- الألوان الرئيسية (2-3 ألوان)
- الألوان الثانوية
- تباين الألوان المناسب

📐 التخطيط والتركيب:
- توزيع العناصر
- المساحات والفراغات
- التوازن البصري

🔤 النصوص والعناصر النصية:
- العناوين الرئيسية
- النصوص الثانوية
- الخطوط المناسبة
- أحجام النصوص

🖼️ العناصر البصرية:
- الصور/الرسومات
- الأيقونات
- التأثيرات البصرية

✨ التأثيرات الخاصة:
- الظلال والتدرجات
- التأثيرات البصرية
- الإطارات والحدود

🎯 النصائح التنفيذية:
- البرامج المناسبة للتنفيذ
- الأحجام الموصى بها
- نصائح للتصميم العربي`;

        return await this.sendMessage(prompt, {
            temperature: 0.8,
            maxTokens: 1200
        });
    }

    /**
     * 📹 تحضير بث مباشر
     */
    async prepareLiveStream(topic, duration = 60, audience = 'عام') {
        const prompt = `تحضير خطة بث مباشر عربي احترافي

الموضوع: ${topic}
المدة: ${duration} دقيقة
الجمهور: ${audience}

المتطلبات:
🎯 الخطة الكاملة:

1. التحضير المسبق (قبل البث):
   - التسويق والمتابعة
   - التحضير الفني
   - التحضير المحتوى

2. جدول البث (دقيقة بدقيقة):
   [0-5] الافتتاحية والترحيب
   [6-15] تقديم الموضوع والنقاط الرئيسية
   ... وهكذا

3. نقاط الحديث الرئيسية:
   - النقطة 1 (مع أمثلة)
   - النقطة 2 (مع تطبيقات)
   - النقطة 3 (مع قصص)

4. الأنشطة التفاعلية:
   - الأسئلة المباشرة
   - المسابقات السريعة
   - التصويتات
   - القراءات المباشرة

5. الدعوات للعمل:
   - الاشتراك في القناة
   - المتابعة على وسائل التواصل
   - المشاركة في التعليقات
   - زيارة الروابط

6. خطة الطوارئ:
   - مشاكل فنية متوقعة
   - التعامل مع التعليقات السلبية
   - تأخير أو انقطاع البث`;

        return await this.sendMessage(prompt, {
            temperature: 0.7,
            maxTokens: 2500
        });
    }

    /**
     * 🧹 مسح تاريخ المحادثة
     */
    clearHistory() {
        this.conversationHistory = [];
        try {
            localStorage.removeItem('nexus_ai_history');
        } catch (error) {
            // تجاهل الخطأ
        }
        console.log('🗑️ تم مسح تاريخ المحادثة');
        return true;
    }

    /**
     * 📊 الحصول على إحصائيات
     */
    getStats() {
        return {
            ...this.stats,
            conversationLength: this.conversationHistory.length,
            averageTokens: this.stats.totalRequests > 0 
                ? Math.round(this.stats.totalTokens / this.stats.totalRequests) 
                : 0,
            successRate: this.stats.totalRequests > 0 
                ? Math.round((this.stats.successfulRequests / this.stats.totalRequests) * 100) 
                : 0
        };
    }

    /**
     * 🔧 اختبار الاتصال بـ API
     */
    async testConnection() {
        console.log('🔌 اختبار اتصال Gemini API...');
        
        try {
            const testResponse = await this.sendMessage('مرحباً! ارد بكلمة "نجاح" فقط.', {
                maxTokens: 10,
                temperature: 0.1,
                useHistory: false
            });
            
            return {
                connected: testResponse.success,
                responseTime: testResponse.responseTime,
                message: testResponse.success ? '✅ متصل بنجاح' : '❌ فشل الاتصال',
                details: testResponse
            };
            
        } catch (error) {
            return {
                connected: false,
                message: '❌ خطأ في الاتصال',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// ======================
// 🌍 التصدير العالمي
// ======================

/**
 * تهيئة Gemini AI
 */
function initGeminiAI() {
    try {
        if (!window.NEXUS_CONFIG || !window.NEXUS_CONFIG.GEMINI_API_KEY) {
            console.error('❌ لم يتم العثور على إعدادات Gemini API');
            return null;
        }
        
        const ai = new GeminiAI();
        
        // تحميل التاريخ المحفوظ
        ai.loadHistory();
        
        // اختبار الاتصال التلقائي
        setTimeout(async () => {
            const test = await ai.testConnection();
            console.log(test.connected ? '✅ Gemini API متصل' : '❌ Gemini API غير متصل', test);
        }, 1000);
        
        window.gemini = ai;
        console.log('🚀 Gemini AI جاهز للاستخدام!');
        
        return ai;
        
    } catch (error) {
        console.error('❌ فشل تهيئة Gemini AI:', error);
        return null;
    }
}

/**
 * محادثة مباشرة مع Gemini
 */
async function chatWithGemini(message, options = {}) {
    if (!window.gemini) {
        const ai = initGeminiAI();
        if (!ai) {
            return {
                success: false,
                message: '❌ Gemini AI غير مهيأ',
                error: 'AI_NOT_INITIALIZED'
            };
        }
    }
    
    return await window.gemini.sendMessage(message, options);
}

// جعل الوظائف متاحة عالمياً
window.GeminiAI = GeminiAI;
window.initGeminiAI = initGeminiAI;
window.chatWithGemini = chatWithGemini;

console.log(`
╔═══════════════════════════════════════╗
║         🤖 Gemini AI Loaded          ║
║         Version: 1.0.0               ║
║         API Key: ${window.NEXUS_CONFIG?.GEMINI_API_KEY?.substring(0, 10) || 'NOT_SET'}...        ║
╚═══════════════════════════════════════╝

📌 الوظائف المتاحة:
1. window.gemini - المثيل الرئيسي
2. chatWithGemini('رسالتك') - محادثة مباشرة
3. initGeminiAI() - إعادة التهيئة

🎮 أمثلة الاستخدام:
// محادثة بسيطة
chatWithGemini('أعطني فكرة لفيديو').then(console.log)

// توليد أفكار
window.gemini.generateVideoIdeas('التسويق', 3)

// كتابة سيناريو
window.gemini.writeVideoScript('كيفية إنشاء محتوى', 5)

📞 للدعم: تحقق من وحدة التحكم للتفاصيل
`);