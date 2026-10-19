'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('SiteContent', {
  draft: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  published: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  previous: { type: DataTypes.JSON, allowNull: true },
  publishedAt: { type: DataTypes.DATE, allowNull: true }
});
