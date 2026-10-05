'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ClientFiles', 'productId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Products', key: 'id' },
      onDelete: 'SET NULL'
    });
    await queryInterface.addIndex('ClientFiles', ['productId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('ClientFiles', ['productId']);
    await queryInterface.removeColumn('ClientFiles', 'productId');
  }
};
