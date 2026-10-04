'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ContactRequests', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING, allowNull: false },
      contact: { type: Sequelize.STRING, allowNull: false },
      goal: { type: Sequelize.STRING, allowNull: true },
      interestedIn: { type: Sequelize.STRING, allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('new','contacted','closed'), allowNull: false, defaultValue: 'new' },
      notificationSent: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      notificationError: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('ContactRequests');
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ContactRequests_status";');
    }
  }
};
