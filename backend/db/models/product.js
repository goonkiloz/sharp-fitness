'use strict';
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    priceCents: { type: DataTypes.INTEGER, allowNull: false },
    billingType: { type: DataTypes.ENUM('one_time', 'monthly'), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    accessLabel: { type: DataTypes.STRING, allowNull: true },
    deliveryDurationDays: { type: DataTypes.INTEGER, allowNull: true }
  });
  Product.associate = models => Product.hasMany(models.Purchase, { foreignKey: 'productId', onDelete: 'CASCADE' });
  return Product;
};
