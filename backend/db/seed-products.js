require('dotenv').config();
const { Product, sequelize } = require('./models');
const products = [
  {
    slug: 'workout-nutrition-program',
    name: 'Workout and nutrition programs',
    description: 'A personalized 16-week workout and nutrition program built for you. Everything Cody delivers stays in your account permanently after purchase.',
    priceCents: 2000,
    billingType: 'one_time',
    accessLabel: '16-week personalized program · lifetime access',
    deliveryDurationDays: 112
  },
  {
    slug: 'online-coaching',
    name: 'Online coaching with nutrition plan',
    description: 'Remote coaching with your training plus a nutrition plan built around your goals.',
    priceCents: 10000,
    billingType: 'monthly',
    accessLabel: 'Monthly coaching · keep all delivered materials',
    deliveryDurationDays: null
  },
  {
    slug: 'one-on-one-coaching',
    name: '1-on-1 coaching, in person or online',
    description: 'Custom programming included, plus weekly check-ins to keep you progressing and accountable.',
    priceCents: 20000,
    billingType: 'monthly',
    accessLabel: 'Monthly coaching · keep all delivered materials',
    deliveryDurationDays: null
  }
];
(async () => {
  try {
    for (const item of products) {
      const [product] = await Product.findOrCreate({ where: { slug: item.slug }, defaults: item });
      await product.update(item);
    }
    console.log('Sharp Fitness products are ready.');
  } finally { await sequelize.close(); }
})().catch(err => { console.error(err); process.exit(1); });
