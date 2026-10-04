'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ContactRequest', {
    name: { type: DataTypes.STRING, allowNull: false },
    contact: { type: DataTypes.STRING, allowNull: false },
    goal: { type: DataTypes.STRING, allowNull: true },
    interestedIn: { type: DataTypes.STRING, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('new','contacted','closed'), allowNull: false, defaultValue: 'new' },
    notificationSent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notificationError: { type: DataTypes.TEXT, allowNull: true }
  });
};
