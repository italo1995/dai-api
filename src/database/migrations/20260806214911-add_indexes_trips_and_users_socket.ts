import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addIndex('trips', ['driver_id'], {
      name: 'trips_driver_id_idx',
    })
    await queryInterface.addIndex('trips', ['user_id'], {
      name: 'trips_user_id_idx',
    })
    await queryInterface.addIndex('trips', ['status'], {
      name: 'trips_status_idx',
    })
    await queryInterface.addIndex('users', ['socket_id'], {
      name: 'users_socket_id_idx',
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex('trips', 'trips_driver_id_idx')
    await queryInterface.removeIndex('trips', 'trips_user_id_idx')
    await queryInterface.removeIndex('trips', 'trips_status_idx')
    await queryInterface.removeIndex('users', 'users_socket_id_idx')
  },
}
