import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // markedReadyAt: la tienda dijo "ya esta listo" antes de que se cumpliera prepTimeMinutes
    // (Italo, 2026-09-18) - fuerza el despacho ya mismo en vez de esperar a dispatchAt, y avisa
    // al conductor si ya estaba asignado.
    await queryInterface.addColumn('marketplace_orders', 'marked_ready_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    })
    // readyReminderSentAt: recordatorio (a la tienda, y al conductor si ya hay uno asignado) de
    // que el tiempo estimado esta por cumplirse - se manda una sola vez por pedido.
    await queryInterface.addColumn('marketplace_orders', 'ready_reminder_sent_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    })
    // lastAttentionReminderAt: ultima vez que se le recordo a la tienda que tiene un pedido sin
    // atender (pendiente de confirmacion / solicitud de cancelacion) - se repite cada 5 minutos
    // mientras siga sin resolverse.
    await queryInterface.addColumn('marketplace_orders', 'last_attention_reminder_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('marketplace_orders', 'marked_ready_at')
    await queryInterface.removeColumn('marketplace_orders', 'ready_reminder_sent_at')
    await queryInterface.removeColumn('marketplace_orders', 'last_attention_reminder_at')
  },
}
