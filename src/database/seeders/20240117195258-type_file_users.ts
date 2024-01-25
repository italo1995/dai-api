import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    /**
     * Add seed commands here.
     *
     * Example:
     *
     */
    await queryInterface.bulkInsert(
      'type_file_users',
      [
        {
          name: 'Licencia',
          description: 'licencia de conducir',
          is_visibility: false,
          required: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Titulo',
          description: 'titulo del vehiculo',
          is_visibility: false,
          required: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Frontal del vehiculo',
          description: 'Foto del frente del vehiculo donde se vea la palca',
          is_visibility: true,
          required: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Lateral del vehiculo',
          description: 'Foto del lateral del vehiculo, que sea nitida',
          is_visibility: true,
          required: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Interior del vehiculo',
          description: 'Foto del interior del vehiculo',
          is_visibility: true,
          required: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Foto trasera del vehiculo',
          description: 'Foto trasera del vehiculo, que sea nitida',
          is_visibility: true,
          required: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Tecno Mecanica',
          description: 'Foto del registro de tecno mecanica, en caso de viajar a cucuta',
          is_visibility: false,
          required: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'SOAT',
          description: 'Seguro Obligatorio de Accidentes de Tránsito, en caso de viajar a Colombia',
          is_visibility: false,
          required: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Certificado de salud mental',
          description: 'Foto del Certificado de salud mental',
          is_visibility: false,
          required: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Certificado medico',
          description: 'Foto del Certificado de salud mental',
          is_visibility: false,
          required: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'DNI',
          description: 'Foto del Documento de identidad',
          is_visibility: false,
          required: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     */
    await queryInterface.bulkDelete('type_file_users', {}, {})
  },
}
