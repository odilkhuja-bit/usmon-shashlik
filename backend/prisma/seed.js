// ============================================
// USMON SHASHLIK — Database Seed
// ============================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── 1. Settings ─────────────────────────────
  const settings = [
    { key: 'restaurant_name', value: 'USMON SHASHLIK' },
    { key: 'restaurant_phone', value: '+998 90 123 45 67' },
    { key: 'telegram_username', value: '@usmonshashlik' },
    { key: 'delivery_price', value: '20000' },
    { key: 'minimum_order', value: '50000' },
    { key: 'working_hours', value: '09:00-23:00' },
    { key: 'default_language', value: 'uz' },
    { key: 'notification_sound', value: 'true' },
    { key: 'hero_title_uz', value: 'HAQIQIY SHASHLIK.\nHAQIQIY MAZZA.' },
    { key: 'hero_title_ru', value: 'НАСТОЯЩИЙ ШАШЛЫК.\nНАСТОЯЩЕЕ УДОВОЛЬСТВИЕ.' },
    { key: 'hero_image', value: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('  ✅ Settings created');

  // ─── 2. Branches ─────────────────────────────
  const branch1 = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'USMON SHASHLIK — Izza',
      nameRu: 'УСМОН ШАШЛЫК — Изза',
      address: 'Izza',
      addressRu: 'Изза',
      phone: '+998 70 028 83 83',
      latitude: 41.314775,
      longitude: 69.153575,
      workingHours: '09:00-23:00',
      isActive: true,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'USMON SHASHLIK — Yunusobod',
      nameRu: 'УСМОН ШАШЛЫК — Юнусабад',
      address: '989G+FMH, Toshkent, Toshkent Viloyati',
      addressRu: '989G+FMH, Ташкент, Ташкентская область',
      phone: '+998 70 029 93 93',
      latitude: 41.368556,
      longitude: 69.326587,
      workingHours: '10:00-23:00',
      isActive: true,
    },
  });
  console.log('  ✅ 2 branches created');

  // ─── 3. Categories ───────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'shashlik' },
      update: {},
      create: { nameUz: 'Shashlik', nameRu: 'Шашлык', slug: 'shashlik', icon: '🍢', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'salad' },
      update: {},
      create: { nameUz: 'Salatlar', nameRu: 'Салаты', slug: 'salad', icon: '🥗', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'fish' },
      update: {},
      create: { nameUz: 'Baliq', nameRu: 'Рыба', slug: 'fish', icon: '🐟', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'drink' },
      update: {},
      create: { nameUz: 'Ichimliklar', nameRu: 'Напитки', slug: 'drink', icon: '🥤', sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { slug: 'additional' },
      update: {},
      create: { nameUz: "Qo'shimchalar", nameRu: 'Дополнительно', slug: 'additional', icon: '➕', sortOrder: 5 },
    }),
  ]);
  console.log('  ✅ 5 categories created');

  const catMap = {};
  categories.forEach((c) => (catMap[c.slug] = c.id));

  // ─── 4. Products ─────────────────────────────
  const products = [
    // Shashlik
    {
      nameUz: 'Qo\'zi shashlik',
      nameRu: 'Шашлык из баранины',
      descriptionUz: 'Toza qo\'zi go\'shtidan tayyorlangan an\'anaviy shashlik',
      descriptionRu: 'Традиционный шашлык из свежей баранины',
      ingredientsUz: 'Qo\'zi go\'shti, piyoz, zira, tuz, qalampir',
      ingredientsRu: 'Баранина, лук, зира, соль, перец',
      imageUrl: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80',
      price: 85000,
      oldPrice: 100000,
      categoryId: catMap.shashlik,
      sortOrder: 1,
    },
    {
      nameUz: 'Mol go\'shti shashlik',
      nameRu: 'Шашлык из говядины',
      descriptionUz: 'Yumshoq mol go\'shtidan mazali shashlik',
      descriptionRu: 'Нежный шашлык из говядины',
      ingredientsUz: 'Mol go\'shti, piyoz, zaytun moyi, zira',
      ingredientsRu: 'Говядина, лук, оливковое масло, зира',
      imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80',
      price: 75000,
      oldPrice: null,
      categoryId: catMap.shashlik,
      sortOrder: 2,
    },
    {
      nameUz: 'Tovuq shashlik',
      nameRu: 'Шашлык из курицы',
      descriptionUz: 'Marinadlangan tovuq go\'shtidan shashlik',
      descriptionRu: 'Шашлык из маринованной курицы',
      ingredientsUz: 'Tovuq filesi, limon, sarimsoq, zira',
      ingredientsRu: 'Куриное филе, лимон, чеснок, зира',
      imageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&q=80',
      price: 55000,
      oldPrice: 65000,
      categoryId: catMap.shashlik,
      sortOrder: 3,
    },
    {
      nameUz: 'Lyulya kebab',
      nameRu: 'Люля-кебаб',
      descriptionUz: 'Qiyma go\'shtdan tayyorlangan an\'anaviy lyulya',
      descriptionRu: 'Традиционный люля-кебаб из рубленого мяса',
      ingredientsUz: 'Mol qiymasi, piyoz, ko\'katlar, ziravorlar',
      ingredientsRu: 'Говяжий фарш, лук, зелень, специи',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
      price: 45000,
      oldPrice: null,
      categoryId: catMap.shashlik,
      sortOrder: 4,
    },
    // Salatlar
    {
      nameUz: 'Achichuk',
      nameRu: 'Ачичук',
      descriptionUz: 'An\'anaviy o\'zbek salati — pomidor, piyoz, bodring',
      descriptionRu: 'Традиционный узбекский салат — помидоры, лук, огурцы',
      ingredientsUz: 'Pomidor, piyoz, bodring, ko\'katlar',
      ingredientsRu: 'Помидоры, лук, огурцы, зелень',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80',
      price: 25000,
      oldPrice: null,
      categoryId: catMap.salad,
      sortOrder: 1,
    },
    {
      nameUz: 'Sezar salat',
      nameRu: 'Салат Цезарь',
      descriptionUz: 'Klassik Sezar salati tovuq bilan',
      descriptionRu: 'Классический салат Цезарь с курицей',
      ingredientsUz: 'Salat barglari, tovuq, parmasan, krutonlar',
      ingredientsRu: 'Салат, курица, пармезан, крутоны',
      imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80',
      price: 38000,
      oldPrice: 45000,
      categoryId: catMap.salad,
      sortOrder: 2,
    },
    {
      nameUz: 'Grekcha salat',
      nameRu: 'Греческий салат',
      descriptionUz: 'Yangi sabzavotlar va feta pishloq bilan',
      descriptionRu: 'Свежие овощи с сыром фета',
      ingredientsUz: 'Pomidor, bodring, piyoz, zaytun, feta',
      ingredientsRu: 'Помидоры, огурцы, лук, оливки, фета',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
      price: 35000,
      oldPrice: null,
      categoryId: catMap.salad,
      sortOrder: 3,
    },
    // Baliq
    {
      nameUz: 'Forel',
      nameRu: 'Форель',
      descriptionUz: 'Grill qilingan forel baliqi',
      descriptionRu: 'Форель на гриле',
      ingredientsUz: 'Forel, limon, ko\'katlar, zaytun moyi',
      ingredientsRu: 'Форель, лимон, зелень, оливковое масло',
      imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&q=80',
      price: 120000,
      oldPrice: 140000,
      categoryId: catMap.fish,
      sortOrder: 1,
    },
    {
      nameUz: 'Daryo baliq',
      nameRu: 'Речная рыба',
      descriptionUz: 'Mahalliy daryo baliqi, qovurilgan',
      descriptionRu: 'Местная речная рыба, жареная',
      ingredientsUz: 'Daryo baliqi, un, tuz, qalampir',
      ingredientsRu: 'Речная рыба, мука, соль, перец',
      imageUrl: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7a02?w=600&q=80',
      price: 65000,
      oldPrice: null,
      categoryId: catMap.fish,
      sortOrder: 2,
    },
    {
      nameUz: 'Sudak',
      nameRu: 'Судак',
      descriptionUz: 'Pechda pishirilgan sudak baliqi',
      descriptionRu: 'Судак, запечённый в духовке',
      ingredientsUz: 'Sudak, sabzavotlar, limon, ziravorlar',
      ingredientsRu: 'Судак, овощи, лимон, специи',
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
      price: 90000,
      oldPrice: null,
      categoryId: catMap.fish,
      sortOrder: 3,
    },
    // Ichimliklar
    {
      nameUz: 'Coca-Cola 0.5L',
      nameRu: 'Coca-Cola 0.5L',
      descriptionUz: 'Sovuq Coca-Cola',
      descriptionRu: 'Холодная Coca-Cola',
      ingredientsUz: null,
      ingredientsRu: null,
      imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80',
      price: 12000,
      oldPrice: null,
      categoryId: catMap.drink,
      sortOrder: 1,
      isUpsell: true,
    },
    {
      nameUz: 'Fanta 0.5L',
      nameRu: 'Fanta 0.5L',
      descriptionUz: 'Sovuq Fanta',
      descriptionRu: 'Холодная Fanta',
      ingredientsUz: null,
      ingredientsRu: null,
      imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=600&q=80',
      price: 12000,
      oldPrice: null,
      categoryId: catMap.drink,
      sortOrder: 2,
      isUpsell: true,
    },
    {
      nameUz: 'Sprite 0.5L',
      nameRu: 'Sprite 0.5L',
      descriptionUz: 'Sovuq Sprite',
      descriptionRu: 'Холодная Sprite',
      ingredientsUz: null,
      ingredientsRu: null,
      imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&q=80',
      price: 12000,
      oldPrice: null,
      categoryId: catMap.drink,
      sortOrder: 3,
      isUpsell: true,
    },
    {
      nameUz: 'Suv 0.5L',
      nameRu: 'Вода 0.5L',
      descriptionUz: 'Toza ichimlik suvi',
      descriptionRu: 'Чистая питьевая вода',
      ingredientsUz: null,
      ingredientsRu: null,
      imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&q=80',
      price: 5000,
      oldPrice: null,
      categoryId: catMap.drink,
      sortOrder: 4,
    },
    // Qo'shimchalar
    {
      nameUz: 'Non',
      nameRu: 'Лепёшка',
      descriptionUz: 'Tandir non',
      descriptionRu: 'Тандырная лепёшка',
      ingredientsUz: null,
      ingredientsRu: null,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
      price: 8000,
      oldPrice: null,
      categoryId: catMap.additional,
      sortOrder: 1,
    },
    {
      nameUz: 'Sous',
      nameRu: 'Соус',
      descriptionUz: 'Maxsus shashlik sousi',
      descriptionRu: 'Фирменный соус для шашлыка',
      ingredientsUz: null,
      ingredientsRu: null,
      imageUrl: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600&q=80',
      price: 5000,
      oldPrice: null,
      categoryId: catMap.additional,
      sortOrder: 2,
      isUpsell: true,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log(`  ✅ ${products.length} products created`);

  // ─── 5. Stories ───────────────────────────────
  const stories = [
    {
      title: 'Yangi taom! 🔥',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
      bgColor: '#E85D04',
      sortOrder: 1,
    },
    {
      title: 'Chegirma 20%',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
      bgColor: '#DC2626',
      sortOrder: 2,
    },
    {
      title: '2-filial ochildi!',
      imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80',
      bgColor: '#059669',
      sortOrder: 3,
    },
  ];

  for (const story of stories) {
    await prisma.story.create({ data: story });
  }
  console.log('  ✅ Stories created');

  // ─── 6. Admin ─────────────────────────────────
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log(`  ✅ Super Admin created (username: ${adminUsername})`);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log(`   • 2 branches`);
  console.log(`   • 5 categories`);
  console.log(`   • ${products.length} products`);
  console.log(`   • 3 stories`);
  console.log(`   • 1 super admin`);
  console.log(`   • ${settings.length} settings`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
