'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Purchases', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      productId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Products', key: 'id' }, onDelete: 'CASCADE' },
      stripeCheckoutSessionId: { type: Sequelize.STRING, allowNull: true, unique: true },
      stripePaymentIntentId: { type: Sequelize.STRING, allowNull: true },
      stripeSubscriptionId: { type: Sequelize.STRING, allowNull: true },
      amountCents: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'active', 'canceled', 'refunded'), allowNull: false, defaultValue: 'pending' },
      purchasedAt: { type: Sequelize.DATE, allowNull: true },
      serviceEndsAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('Purchases'); }
};
