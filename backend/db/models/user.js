'use strict';
const bcrypt = require('bcryptjs');
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    hashedPassword: { type: DataTypes.STRING, allowNull: false },
    stripeCustomerId: { type: DataTypes.STRING, allowNull: true },
    isTrainer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  });
  User.associate = models => {
    User.hasMany(models.Purchase, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.ClientFile, { foreignKey: 'userId', as: 'ClientFiles', onDelete: 'CASCADE' });
    User.hasMany(models.ClientFile, { foreignKey: 'uploadedById', as: 'UploadedFiles', onDelete: 'CASCADE' });
  };
  User.prototype.validatePassword = function(password) { return bcrypt.compare(password, this.hashedPassword); };
  return User;
};
