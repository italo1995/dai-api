import type { QueryInterface } from 'sequelize'

// Modulos del menu del admin que nunca se cargaron al catalogo "views" (ViewService.createMany se
// corrio una sola vez, antes de que existieran): sin esto no aparecen en "Modulos" al crear una
// Asignacion (rol) y un operador no puede recibir acceso a Tiendas, Usuarios Tienda, Ayuda, etc.
// Idempotente: solo inserta los que falten por url. Correr SOLO este archivo:
//   npx sequelize-cli db:seed --seed 20261023120000-add_missing_view_modules.js
const MISSING_VIEWS = [
  { icon: "assets/admin_icons/cuentas_bancarias.svg", title: "Métodos de Pago", url: "metodosPago", route: '' },
  { icon: "assets/admin_icons/sucursales.svg", title: "Sucursales", url: "branch", route: '' },
  { icon: "assets/admin_icons/sucursales.svg", title: "Usuarios Tienda", url: "usuariosTienda", route: '' },
  { icon: "assets/admin_icons/warning-outline.svg", title: "Usuarios eliminados", url: "eliminados", route: '' },
  { icon: "assets/admin_icons/information-outline.svg", title: "Ayuda", url: "help", route: '' },
  { icon: "assets/admin_icons/newspaper-outline.svg", title: "Términos y condiciones", url: "terms", route: '' },
  { icon: "assets/admin_icons/image.svg", title: "Popup Publicitario", url: "popup", route: '' },
  { icon: "assets/admin_icons/sucursales.svg", title: "Tiendas", url: "stores", route: '' },
  { icon: "assets/admin_icons/conductor.svg", title: "Tipos de Vehículo", url: "vehicleTypes", route: '' },
  { icon: "assets/admin_icons/peticiones.svg", title: "Adicionales de Vehículo", url: "vehicleAdditional", route: '' },
  { icon: "assets/admin_icons/multimoneda.svg", title: "Parámetros de la Empresa", url: "companyParameters", route: '' },
  { icon: "assets/admin_icons/Reportes.svg", title: "Datos de Vehículo", url: "carData", route: '' },
]

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const [rows]: any = await queryInterface.sequelize.query('SELECT url FROM views')
    const existing = new Set<string>(rows.map((pRow: any) => pRow.url))
    const now = new Date()
    const toInsert = MISSING_VIEWS.filter((pView) => !existing.has(pView.url)).map((pView) => ({
      ...pView,
      createdAt: now,
      updatedAt: now,
    }))
    if (toInsert.length) {
      await queryInterface.bulkInsert('views', toInsert)
    }
    console.log(`Seeder add_missing_view_modules: ${toInsert.length} modulo(s) agregado(s).`)
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('views', { url: MISSING_VIEWS.map((pView) => pView.url) }, {})
  },
}
