// ============================================
// USMON SHASHLIK — Admin Translations
// ============================================

const translations = {
  uz: {
    dashboard: 'Boshqaruv Paneli',
    orders: 'Buyurtmalar',
    products: 'Mahsulotlar',
    categories: 'Kategoriyalar',
    branches: 'Filiallar',
    users: 'Mijozlar',
    broadcast: 'Xabarnomalar (Broadcast)',
    analytics: 'Statistika & Tahlil',
    admins: 'Adminlar jamoasi',
    settings: 'Sozlamalar',
    logout: 'Chiqish',

    // Stats
    today_revenue: 'Bugungi tushum',
    today_orders: 'Bugungi buyurtmalar',
    active_orders: 'Faol buyurtmalar',
    total_customers: 'Jami mijozlar',

    // Statuses
    status_NEW: 'Yangi',
    status_CONFIRMED: 'Tasdiqlangan',
    status_PREPARING: 'Tayyorlanmoqda',
    status_READY: 'Tayyor',
    status_DELIVERING: 'Yetkazilmoqda',
    status_COMPLETED: 'Bajarildi',
    status_CANCELLED: 'Bekor qilindi',

    // Actions
    add: 'Qo\'shish',
    edit: 'Tahrirlash',
    delete: 'O\'chirish',
    restore: 'Tiklash',
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    confirm: 'Tasdiqlash',
    export_csv: 'CSV Eksport',
    search: 'Qidirish...',
    filter_by_status: 'Status bo\'yicha',
    filter_by_branch: 'Filial bo\'yicha',
    all: 'Barchasi',
    actions: 'Amallar',
    details: 'Batafsil',

    // Common
    name: 'Nomi',
    price: 'Narxi',
    phone: 'Telefon',
    address: 'Manzil',
    created_at: 'Yaratilgan vaqti',
    status: 'Status',
    total: 'Jami',
    role: 'Roli',
  },
  ru: {
    dashboard: 'Панель управления',
    orders: 'Заказы',
    products: 'Продукты',
    categories: 'Категории',
    branches: 'Филиалы',
    users: 'Клиенты',
    broadcast: 'Рассылка (Broadcast)',
    analytics: 'Аналитика',
    admins: 'Команда админов',
    settings: 'Настройки',
    logout: 'Выйти',

    today_revenue: 'Выручка за сегодня',
    today_orders: 'Заказов сегодня',
    active_orders: 'Активные заказы',
    total_customers: 'Всего клиентов',

    status_NEW: 'Новый',
    status_CONFIRMED: 'Подтверждён',
    status_PREPARING: 'Готовится',
    status_READY: 'Готов',
    status_DELIVERING: 'Доставляется',
    status_COMPLETED: 'Выполнен',
    status_CANCELLED: 'Отменён',

    add: 'Добавить',
    edit: 'Редактировать',
    delete: 'Удалить',
    restore: 'Восстановить',
    save: 'Сохранить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    export_csv: 'Экспорт CSV',
    search: 'Поиск...',
    filter_by_status: 'По статусу',
    filter_by_branch: 'По филиалу',
    all: 'Все',
    actions: 'Действия',
    details: 'Подробнее',

    name: 'Название',
    price: 'Цена',
    phone: 'Телефон',
    address: 'Адрес',
    created_at: 'Дата создания',
    status: 'Статус',
    total: 'Итого',
    role: 'Роль',
  },
};

export function t(key, lang = 'uz') {
  return translations[lang]?.[key] || translations.uz[key] || key;
}

export default translations;
