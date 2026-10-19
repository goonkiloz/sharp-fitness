'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SiteContents', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      draft: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
      published: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
      previous: { type: Sequelize.JSON, allowNull: true },
      publishedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('SiteContents');
  }
};
