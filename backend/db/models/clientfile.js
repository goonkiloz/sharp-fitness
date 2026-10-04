'use strict';
module.exports = (sequelize, DataTypes) => {
  const ClientFile = sequelize.define('ClientFile', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    uploadedById: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    storageKey: { type: DataTypes.STRING, allowNull: false, unique: true },
    originalName: { type: DataTypes.STRING, allowNull: false },
    mimeType: { type: DataTypes.STRING, allowNull: false },
    sizeBytes: { type: DataTypes.BIGINT, allowNull: false }
  });
  ClientFile.associate = models => {
    ClientFile.belongsTo(models.User, { foreignKey: 'userId', as: 'Client' });
    ClientFile.belongsTo(models.User, { foreignKey: 'uploadedById', as: 'UploadedBy' });
  };
  return ClientFile;
};
