'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Purchases',
      'currentPeriodEnd',
      {
        type: Sequelize.DATE,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      'Purchases',
      'cancelAtPeriodEnd',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );

    await queryInterface.addColumn(
      'Purchases',
      'cancelAt',
      {
        type: Sequelize.DATE,
        allowNull: true
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      'Purchases',
      'cancelAt'
    );

    await queryInterface.removeColumn(
      'Purchases',
      'cancelAtPeriodEnd'
    );

    await queryInterface.removeColumn(
      'Purchases',
      'currentPeriodEnd'
    );
  }
};