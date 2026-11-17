-- ChargeOps Pilot: Synthetic Seed Data
-- Strictly fictional demonstration dataset (DEMO_DATA_ONLY)

-- 1. Synthetic Runbook Sections
insert into public.runbook_sections 
  (doc_id, version, section_id, title, content, error_codes, status, effective_from, effective_to, synthetic)
values
  (
    'RB-SYN-001',
    'v1.2',
    'SEC-TIMEOUT',
    'مدیریت خطای تایم‌اوت سوئیچ شارژینگ (E_SYN_TIMEOUT)',
    'خطای E_SYN_TIMEOUT زمانی رخ می‌دهد که تراکنش در پنجره زمانی مجاز (۵ ثانیه) پاسخی از نود پایین‌دستی دریافت نکند. راهکار مجاز: بررسی وضعیت قطعی در پایگاه داده محلی و پرهیز از تکرار درخواست تا زمان تعیین تکلیف نهایی تراکنش.',
    array['E_SYN_TIMEOUT'],
    'active',
    '2026-01-01T00:00:00Z',
    null,
    true
  ),
  (
    'RB-SYN-001',
    'v1.2',
    'SEC-FUNDS',
    'رسیدگی به خطای عدم موجودی اعتبار مشترک (E_SYN_INSUFFICIENT_FUNDS)',
    'کد خطای E_SYN_INSUFFICIENT_FUNDS نشان‌دهنده ناکافی بودن اعتبار ریالی یا حجم بسته کاربر جهت انجام عملیات است. تراکنش به صورت قطعی ناموفق تلقی شده و نباید مجدداً تلاش خودکار انجام شود.',
    array['E_SYN_INSUFFICIENT_FUNDS'],
    'active',
    '2026-01-01T00:00:00Z',
    null,
    true
  ),
  (
    'RB-SYN-002',
    'v1.0',
    'SEC-NET-DROP',
    'خطای قطعی نشست شبکه در حین ارسال رویداد (E_SYN_NETWORK_DROP)',
    'کد خطای E_SYN_NETWORK_DROP ناشی از قطع ارتباط سوکت TCP پیش از تکمیل هندشیک شارژینگ است. در صورتی که تراکنش به وضعیت بازگشتی (reversed) درنیامده باشد، تراکنش پس از اعتبارسنجی مجدد توسط کلاینت قابل ارسال مجدد است.',
    array['E_SYN_NETWORK_DROP'],
    'active',
    '2026-01-01T00:00:00Z',
    null,
    true
  ),
  (
    'RB-SYN-003',
    'v1.0',
    'SEC-GATEWAY',
    'خطای عدم پاسخ‌دهی گیت‌وی پرداخت فرضی (E_SYN_GATEWAY_ERR)',
    'کد خطای E_SYN_GATEWAY_ERR نشان‌دهنده خطای ۵۰۲/۵۰۴ از درگاه متصل است. در این حالت تراکنش به وضعیت تعلیق (pending) وارد شده و منتظر پیام مغایرت‌گیری سیستمی می‌ماند.',
    array['E_SYN_GATEWAY_ERR'],
    'active',
    '2026-01-01T00:00:00Z',
    null,
    true
  ),
  (
    'RB-SYN-004',
    'v0.9',
    'SEC-DEPRECATED',
    'دستورالعمل منسوخ‌شده بررسی سهمیه قدیمی (E_SYN_OLD_LIMIT)',
    'این مستند منسوخ شده است و نباید در پاسخ‌های عملیاتی فعال استناد شود.',
    array['E_SYN_OLD_LIMIT'],
    'deprecated',
    '2025-01-01T00:00:00Z',
    '2025-12-31T23:59:59Z',
    true
  )
on conflict (doc_id, version, section_id) do nothing;


-- 2. Synthetic Charging Events
insert into public.charging_events
  (event_id, transaction_id, attempt_id, event_at, ingested_at, status, error_code, service_type, amount, synthetic)
values
  -- Transaction 1: Straightforward success
  ('EVT-1001', 'TX-2026-0001', 'ATT-1', '2026-11-14T08:00:00Z', '2026-11-14T08:00:01Z', 'success', null, 'data', 15000, true),

  -- Transaction 2: Multi-attempt: first attempt failed with timeout, second attempt succeeded
  ('EVT-1002', 'TX-2026-0002', 'ATT-1', '2026-11-14T08:05:00Z', '2026-11-14T08:05:01Z', 'failed', 'E_SYN_TIMEOUT', 'voice', 2500, true),
  ('EVT-1003', 'TX-2026-0002', 'ATT-2', '2026-11-14T08:05:15Z', '2026-11-14T08:05:16Z', 'success', null, 'voice', 2500, true),

  -- Transaction 3: Definite failure (insufficient funds)
  ('EVT-1004', 'TX-2026-0003', 'ATT-1', '2026-11-14T08:10:00Z', '2026-11-14T08:10:02Z', 'failed', 'E_SYN_INSUFFICIENT_FUNDS', 'sms', 500, true),

  -- Transaction 4: Timeout without recovery
  ('EVT-1005', 'TX-2026-0004', 'ATT-1', '2026-11-14T08:15:00Z', '2026-11-14T08:15:02Z', 'failed', 'E_SYN_TIMEOUT', 'subscription', 50000, true),

  -- Transaction 5: Network drop then reversed
  ('EVT-1006', 'TX-2026-0005', 'ATT-1', '2026-11-14T08:20:00Z', '2026-11-14T08:20:01Z', 'failed', 'E_SYN_NETWORK_DROP', 'data', 30000, true),
  ('EVT-1007', 'TX-2026-0005', 'ATT-2', '2026-11-14T08:20:10Z', '2026-11-14T08:20:11Z', 'reversed', null, 'data', 30000, true),

  -- Transaction 6: Pending gateway transaction
  ('EVT-1008', 'TX-2026-0006', 'ATT-1', '2026-11-14T08:25:00Z', '2026-11-14T08:25:02Z', 'pending', 'E_SYN_GATEWAY_ERR', 'subscription', 100000, true),

  -- Transaction 7: Late-arriving event example
  -- Event happened at 08:30:00Z, but was ingested late at 08:45:00Z
  ('EVT-1009', 'TX-2026-0007', 'ATT-1', '2026-11-14T08:30:00Z', '2026-11-14T08:45:00Z', 'success', null, 'data', 20000, true),

  -- Transaction 8: Multiple retries ending in failure
  ('EVT-1010', 'TX-2026-0008', 'ATT-1', '2026-11-14T08:32:00Z', '2026-11-14T08:32:01Z', 'failed', 'E_SYN_NETWORK_DROP', 'voice', 4000, true),
  ('EVT-1011', 'TX-2026-0008', 'ATT-2', '2026-11-14T08:32:10Z', '2026-11-14T08:32:11Z', 'failed', 'E_SYN_NETWORK_DROP', 'voice', 4000, true),
  ('EVT-1012', 'TX-2026-0008', 'ATT-3', '2026-11-14T08:32:25Z', '2026-11-14T08:32:26Z', 'failed', 'E_SYN_NETWORK_DROP', 'voice', 4000, true)
on conflict (event_id) do nothing;
