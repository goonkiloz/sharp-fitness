require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./models');

(async () => {
  const email = (process.env.TRAINER_EMAIL || 'codysharp011@outlook.com').trim().toLowerCase();
  const password = process.env.TRAINER_PASSWORD;
  if (!password) {
    console.log('TRAINER_PASSWORD not set; trainer bootstrap skipped.');
    await sequelize.close();
    return;
  }
  let user = await User.findOne({ where: { email } });
  const hashedPassword = await bcrypt.hash(password, 12);
  if (!user) {
    user = await User.create({
      firstName: process.env.TRAINER_FIRST_NAME || 'Cody',
      lastName: process.env.TRAINER_LAST_NAME || 'Sharp',
      email,
      hashedPassword,
      isTrainer: true
    });
    console.log(`Trainer account created for ${email}.`);
  } else {
    await user.update({ isTrainer: true, hashedPassword });
    console.log(`Trainer account ensured for ${email}.`);
  }
  await sequelize.close();
})().catch(async err => {
  console.error(err);
  try { await sequelize.close(); } catch (_) {}
  process.exit(1);
});
