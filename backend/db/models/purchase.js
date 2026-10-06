'use strict';
module.exports = (sequelize, DataTypes) => {
  const Purchase = sequelize.define('Purchase', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    stripeCheckoutSessionId: { type: DataTypes.STRING, allowNull: true, unique: true },
    stripePaymentIntentId: { type: DataTypes.STRING, allowNull: true },
    stripeSubscriptionId: { type: DataTypes.STRING, allowNull: true },
    amountCents: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'active', 'canceled', 'refunded'), allowNull: false, defaultValue: 'pending' },
    purchasedAt: { type: DataTypes.DATE, allowNull: true },
    serviceEndsAt: { type: DataTypes.DATE, allowNull: true },
    currentPeriodEnd: {type: DataTypes.DATE, allowNull: true},
    cancelAtPeriodEnd: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    cancelAt: {type: DataTypes.DATE, allowNull: true}
  });
  Purchase.associate = models => {
    Purchase.belongsTo(models.User, { foreignKey: 'userId' });
    Purchase.belongsTo(models.Product, { foreignKey: 'productId' });
  };
  return Purchase;
};
