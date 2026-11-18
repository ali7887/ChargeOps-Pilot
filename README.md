# ChargeOps Pilot — سامانه پایش عملیات شارژینگ (پایلوت آزمایشی)

**نسخه:** 0.1.0 (MVP)  
**محیط اجرا:** Next.js 16+ App Router (TypeScript) + Supabase PostgreSQL  
**سیاست داده:** کاملاً ساختگی (Synthetic Data Only) — بدون اتصال به شبکه یا سامانه‌های واقعی  
**مخزن گیت‌هاب:** [https://github.com/ali7887/ChargeOps-Pilot.git](https://github.com/ali7887/ChargeOps-Pilot.git)  

---

> ### ⚠️ هشدار و مرز ایمنی (Safety Boundary)
> **«دموی داده‌های مصنوعی؛ بدون اتصال به شبکه یا سامانه واقعی»**  
> این سامانه یک محصول رسمی شرکت ایرانسل نیست، به هیچ یک از زیرساخت‌ها، سوئیچ‌ها، پایگاه‌داده‌ها یا شبکه‌های عملیاتی متصل نبوده و هیچ‌گونه اقدام عملیاتی (مانند بازنشانی، شارژ مجدد، تغییر کانفیگ یا اجرای دستورات شبکه) انجام نمی‌دهد. تمامی رویدادها و مستندات این پروژه کاملاً ساختگی و فرضی هستند.

---

## ۱. اهداف و قابلیت‌های سامانه

1. **داشبورد شاخص‌ها (Deterministic Metrics Dashboard):** محاسبه دترمینستیک شاخص‌های شارژینگ در بازهزمانی `[from, to)` بر اساس ساعت شروع تراکنش (Inception)، تفکیک رویدادهای با تأخیر (Late-arriving)، گزارش مجزای تراکنش‌های معلق (Pending) و برگشتی (Reversed) خارج از مخرج کسر و برگرداندن `N/A` در مخرج صفر.
2. **پایگاه دانش عملیاتی (Operational Runbooks Retrieval):** بازیابی لغوی دقیق کدهای خطا و جستجوی تمام‌متن (Full-Text Search) در ران‌بوک‌های ساختگی فعال با استناد صریح به `doc_id`، `version` و `section_id` و پالایش مستندات منسوخ‌شده یا پیش‌نویس.
3. **دستیار هوشمند امن (Safe Assistant):** مسیریابی در چهار مسیر اصلی (Analytics, Knowledge, Combined, Unsupported) با امتناع خودکار در برابر درخواست‌های مداخله در پرامپت (Prompt Injection)، پرسش‌های اثبات‌نشده علت ریشه‌ای (Root Cause) و درخواست‌های اجرای عملیات شبکه (Reset / Retry).
4. **امنیت و کنترل دسترسی (Invitation Auth & RBAC):** احراز هویت مبتنی بر دعوت (Invitation-only)، سطوح دسترسی `admin` و `viewer`، تفکیک دسترسی در روت‌های سرور و فعال‌سازی Row Level Security (RLS) در پایگاه‌داده.

---

## ۲. پیش‌نیازهای سیستمی

- **Node.js:** نسخه 20 به بالا (تست‌شده روی Node.js v22.22.3)
- **مدیر بسته‌ها (Package Manager):** npm (نسخه 11+)
- **Git:** جهت مدیریت نسخه کدهای منبع

---

## ۳. راه‌اندازی و اجرای محلی

### گام ۱: دریافت کدها
```bash
git clone https://github.com/ali7887/ChargeOps-Pilot.git
cd ChargeOps-Pilot
```

### گام ۲: نصب وابستگی‌ها
```bash
npm install
```

### گام ۳: تنظیم متغیرهای محیطی
یک فایل `.env.local` بر اساس الگوی `.env.example` بسازید:
```bash
cp .env.example .env.local
```
مقادیر مورد نیاز:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
AI_PROVIDER=none
DEMO_DATA_ONLY=true
```

### گام ۴: اعمال ساختار پایگاه‌داده و داده‌های ساختگی در Supabase

> **نکته وضعیت پروژه جاری:** در پروژه متصل فعلی، تمامی مایگریشن‌ها و داده‌های ساختگی زیر روی پایگاه داده زنده Supabase اجرا و راستی‌آزمایی شده‌اند و نیازی به اجرای مجدد آن‌ها برای استقرار جاری نیست.

در صورت راه‌اندازی یک پروژه جدید Supabase (Fresh Setup)، اسکریپت‌های زیر باید **دقیقاً به ترتیب** در بخش **SQL Editor** کنسول Supabase اجرا شوند:
1. **ساختار جداول، ایندکس‌ها و RLS پایه:** فایل `supabase/migrations/20261117000000_initial_schema.sql`
2. **امن‌سازی و محدودسازی سطح دسترسی جداول (Principle of Least Privilege):** فایل `supabase/migrations/20261118000000_restrict_application_table_privileges.sql` (سلب دسترسی‌های مستقیم `anon`، اعطای فقط `SELECT` به `authenticated` و حفظ دسترسی کامل برای `service_role`)
3. **داده‌های نمونه ساختگی:** فایل `supabase/seed.sql` (۱۲ رویداد شارژینگ و ۵ بخش ران‌بوک نمونه)

### گام ۵: اجرای آزمون‌ها و بررسی کیفیت کدها
```bash
# بررسی انواع داده (Typecheck)
npm run typecheck

# بررسی استانداردهای کدنویسی (Lint)
npm run lint

# اجرای تمامی آزمون‌های واحد، RBAC، لبه‌ای و ۱۲ سوال طلایی (۴۷ تست در ۶ سوئیت)
npm test

# ایجاد بیلد بهینه تولید (Production Build)
npm run build
```

### گام ۶: اجرای برنامه در محیط توسعه
```bash
npm run dev
```
برنامه در آدرس `http://localhost:3000` در دسترس خواهد بود.

---

## ۳.۱. آماده‌سازی و استقرار در Vercel (Production Deployment)

جهت استقرار نسخه تولیدی روی پلتفرم Vercel:

1. **اتصال مخزن:** مخزن گیت‌هاب `ali7887/ChargeOps-Pilot` را در پنل کاربری Vercel اضافه (Import) کنید.
2. **شاخه اصلی:** شاخه `main` را انتخاب نمایید (چارچوب Next.js به‌صورت خودکار تشخیص داده می‌شود).
3. **تنظیم متغیرهای محیطی در Vercel:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   AI_PROVIDER=none
   DEMO_DATA_ONLY=true
   ```
4. **تنظیم آدرس‌های مجاز در Supabase (Authentication):**
   - در داشبورد Supabase > **Authentication** > **URL Configuration**:
     - مقدار **Site URL** را برابر با آدرس دامنه Vercel (مانند `https://chargeops-pilot.vercel.app`) قرار دهید.
     - در بخش **Redirect URLs**، آدرس‌های مجاز شامل `https://chargeops-pilot.vercel.app/**` و `http://localhost:3000/**` را اضافه فرمایید.
5. **شروع استقرار (Deploy):** دکمه Deploy را کلیک نموده و پس از اتمام ساخت، پیوند تولیدی را بررسی فرمایید.

---

## ۴. پرسش‌های طلایی ارزیابی (Golden Evaluation Questions)

سامانه دارای ۱۲ آزمون مرجع طلایی (طبق بند ۹ سند `MASTER_PROMPT.md`) است که در فایل `tests/golden_questions.test.ts` به‌صورت خودکار ارزیابی می‌شوند:
1. شمارش تراکنش‌های موفق و ناموفق در بازه زمانی مشخص.
2. محاسبه نرخ موفقیت با مخرج کسر آشکار.
3. بازگرداندن مقدار `N/A` در صورت صفر بودن مخرج.
4. گزارش مجزای وضعیت‌های معلق (pending) و برگشتی (reversed) بدون ورود به مخرج.
5. استعلام دقیق کد خطای `E_SYN_TIMEOUT` همراه با استناد رسمی (`doc_id`, `version`, `section_id`).
6. استعلام کد خطای ناشناخته و اعلام صادقانه عدم وجود بدون ساخت داده کاذب.
7. امتناع مستند از پاسخ به پرسش‌های حدس علت ریشه‌ای تراکنش.
8. تشخیص بازه زمانی مبهم و درخواست شفاف‌سازی پنجره زمانی از کاربر.
9. مسدودسازی درخواست عملیات ادمین توسط کاربر با دسترسی `viewer`.
10. رد درخواست‌های فاقد احراز هویت با خطای ۴۰۱.
11. خنثی‌سازی و رد حملات تزریق پرامپت (Prompt Injection) جهت افشای اسرار.
12. رد درخواست‌های بازنشانی یا ریست سرویس‌ها به علت Read-Only بودن سامانه.

---

## ۵. ساختار پروژه

```text
ChargeOps Pilot/
├── MASTER_PROMPT.md                  # مرجع اصلی الزامات و دستورالعمل اجرایی
├── HANDOFF.md                        # سند وضعیت و لاگ مراحل توسعه (Single Source of Truth)
├── README.md                         # راهنمای فارسی راه‌اندازی و معماری
├── .env.example                      # نمونه متغیرهای محیطی امن
├── .gitignore                        # قوانین نادیده‌گرفتن فایل‌های حساس
├── package.json                      # پیکربندی اسکریپت‌ها و پکیج‌ها
├── tsconfig.json                     # تنظیمات تایپ‌اسکریپت
├── tailwind.config.ts                # تم رابط کاربری سازمانی (Light Mode Only)
├── next.config.ts                    # تنظیمات سرور و Security Headers
├── proxy.ts                          # پراکسی مدیریت سشن Next.js 16
├── app/
│   ├── layout.tsx                    # قالب پایه شامل هدر، ناوبری و بنر سلب مسئولیت
│   ├── page.tsx                      # صفحه اصلی شامل داشبورد و دستیار
│   ├── login/page.tsx                # فرم ورود مبتنی بر دعوت
│   ├── error.tsx                     # مدیریت خطای امن سمت کاربر
│   ├── not-found.tsx                 # صفحه خطای ۴۰۴ سفارشی
│   ├── global-error.tsx              # مدیریت خطاهای سراسری
│   ├── globals.css                   # استایل‌های پایه Tailwind
│   └── api/
│       ├── admin/users/route.ts      # مدیریت کاربران و دعوت (Admin Only)
│       ├── assistant/route.ts        # پردازش پرسش و پاسخ دستیار
│       ├── auth/me/route.ts          # استعلام مشخصات و نقش کاربر جاری
│       ├── dashboard/metrics/route.ts# محاسبه دترمینستیک شاخص‌های داشبورد
│       └── retrieval/runbooks/route.ts # بازیابی لغوی ران‌بوک‌های عملیاتی
├── components/
│   ├── Dashboard.tsx                 # کامپوننت شاخص‌ها، فیلتر زمان و خطاهای پرتکرار
│   └── Assistant.tsx                 # کامپوننت چت دستیار و پرسش‌های طلایی
├── lib/
│   ├── auth.ts                       # منطق احراز هویت و RBAC سمت سرور
│   ├── metrics.ts                    # موتور دترمینستیک محاسبه شاخص‌های شارژینگ
│   ├── retrieval.ts                  # موتور بازیابی لغوی و اعتبارسنجی ران‌بوک‌ها
│   ├── answer.ts                     # موتور تصمیم‌گیری، مسیریابی و قالب پاسخ‌ها
│   └── supabase/
│       ├── client.ts                 # کلاینت مرورگر Supabase
│       ├── server.ts                 # کلاینت SSR سرور با مدیریت کوکی‌ها
│       └── admin.ts                  # کلاینت ادمین با محافظت امنیتی عدم دسترسی در مرورگر
├── supabase/
│   ├── migrations/
│   │   ├── 20261117000000_initial_schema.sql # تعریف جداول و پالیسی‌های RLS
│   │   └── 20261118000000_restrict_application_table_privileges.sql # سلب دسترسی anon/auth و اعمال اصل حداقل دسترسی
│   └── seed.sql                      # داده‌های ساختگی و ران‌بوک‌های نمونه
└── tests/
    ├── foundation.test.ts            # تست سلامت پایه
    ├── auth.test.ts                  # تست‌های کنترل دسترسی و احراز هویت
    ├── metrics.test.ts               # تست‌های حالت‌های لبه‌ای شاخص‌ها (Edge-Cases)
    ├── retrieval.test.ts             # تست‌های بازیابی و استنادات ران‌بوک
    ├── privilege_remediation.test.ts # تست‌های اعتبارسنجی محدودسازی دسترسی پایگاه‌داده
    └── golden_questions.test.ts      # تست ۱۲ سوال طلایی
```

---

## ۶. محدودیت‌های شناخته‌شده و سلب مسئولیت

- تمامی داده‌ها، کدهای خطا، نام سرویس‌ها و ران‌بوک‌های موجود در این مخزن ساختگی هستند.
- در نسخه ۱، بازیابی دانش به‌صورت Lexical / Full-Text است و نباید به عنوان Semantic RAG معرفی شود.
- عملیات شبکه یا تعامل عملیاتی با سامانه‌ها کاملاً مسدود و غیرفعال است (Read-Only).
