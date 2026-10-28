import type { QueryInterface, Transaction } from 'sequelize'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import {
  REVIEW_DRIVER_PHONE,
  REVIEW_PASSENGER_PHONE,
  REVIEW_PHONE_CODE,
  REVIEW_STORE_EMAIL,
  REVIEW_STORE_PASSWORD,
  REVIEW_STORE_PHONE,
} from '../../constants/reviewAccounts'

// Cuentas demo para la revision de Google Play (pasajero, conductor y tienda). Idempotente: cada
// cuenta se omite si ya existe, y todo corre en UNA transaccion (si algo falla, no queda nada a
// medias). NO correr con "db:seed:all" en produccion (re-corre todos los seeders): correr solo
// este archivo, p. ej.
//   npx sequelize-cli db:seed --seed 20261007120000-review_accounts.ts
// Los ids de pais/vehiculo/moneda se buscan por nombre/simbolo (no se asumen) porque pueden
// diferir entre ambientes. El codigo fijo 1234 de pasajero/conductor lo resuelve el bypass de
// AuthController (ver constants/reviewAccounts.ts); la tienda entra con email + password normal.
const CARACAS = { lat: 10.4806, lon: -66.9036 }

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const sequelize = queryInterface.sequelize
    const transaction: Transaction = await sequelize.transaction()
    try {
      const now = new Date()
      const query = async (pSql: string, pReplacements: Record<string, any> = {}): Promise<any[]> => {
        const [rows]: any = await sequelize.query(pSql, { replacements: pReplacements, transaction })
        return rows
      }
      const lookupId = async (pSql: string): Promise<number | null> => (await query(pSql))[0]?.id ?? null
      const insert = (pTable: string, pRows: Record<string, any>[]) =>
        queryInterface.bulkInsert(pTable, pRows, { transaction })

      const countryId = await lookupId("SELECT id FROM countries WHERE name ILIKE 'venezuela%' ORDER BY id LIMIT 1")
      const vehicleTypeId =
        (await lookupId("SELECT id FROM vehicle_types WHERE name ILIKE 'carro econ%' ORDER BY id LIMIT 1")) ??
        (await lookupId('SELECT id FROM vehicle_types ORDER BY id LIMIT 1'))

      if (!(await query('SELECT id FROM users WHERE phone_number = :p LIMIT 1', { p: REVIEW_PASSENGER_PHONE })).length) {
        await insert('users', [
          {
            id: uuidv4(),
            name: 'Pasajero',
            last_name: 'Demo',
            phone_code: REVIEW_PHONE_CODE,
            phone_number: REVIEW_PASSENGER_PHONE,
            rol_id: 3,
            type_user: '1',
            status: true,
            verified_driver: false,
            is_new_user: false,
            balance: 0,
            country_id: countryId,
            createdAt: now,
            updatedAt: now,
          },
        ])
      }

      if (!(await query('SELECT id FROM users WHERE phone_number = :p LIMIT 1', { p: REVIEW_DRIVER_PHONE })).length) {
        await insert('users', [
          {
            id: uuidv4(),
            name: 'Conductor',
            last_name: 'Demo',
            phone_code: REVIEW_PHONE_CODE,
            phone_number: REVIEW_DRIVER_PHONE,
            rol_id: 3,
            type_user: '2',
            vehicle_type: vehicleTypeId,
            seats: 4,
            status: true,
            verified_driver: true,
            is_new_user: false,
            balance: 0,
            country_id: countryId,
            lat: CARACAS.lat,
            lon: CARACAS.lon,
            createdAt: now,
            updatedAt: now,
          },
        ])
      }

      if ((await query('SELECT id FROM users WHERE email = :e LIMIT 1', { e: REVIEW_STORE_EMAIL })).length) {
        console.log('Seeder review_accounts: la tienda demo ya existe, se omite.')
        await transaction.commit()
        return
      }

      const ownerId = uuidv4()
      await insert('users', [
        {
          id: ownerId,
          name: 'Tienda Demo',
          email: REVIEW_STORE_EMAIL,
          password: bcrypt.hashSync(REVIEW_STORE_PASSWORD, 10),
          phone_code: REVIEW_PHONE_CODE,
          phone_number: REVIEW_STORE_PHONE,
          rol_id: 4,
          status: true,
          verified_driver: false,
          is_new_user: false,
          balance: 0,
          createdAt: now,
          updatedAt: now,
        },
      ])

      const [store] = await query(
        `INSERT INTO stores (name, type, owner_id, phone_code, phone_number, lat, lon, country_id,
           is_open, is_approved, avg_prep_time_minutes, description, "createdAt", "updatedAt")
         VALUES ('Tienda Demo', 'food', :owner, :code, :phone, :lat, :lon, :country,
           true, true, 20, 'Tienda de demostracion para la revision de Google Play.', :now, :now)
         RETURNING id`,
        {
          owner: ownerId,
          code: REVIEW_PHONE_CODE,
          phone: REVIEW_STORE_PHONE,
          lat: CARACAS.lat,
          lon: CARACAS.lon,
          country: countryId,
          now,
        }
      )
      const storeId: number = store.id

      const businessCategoryId = await lookupId("SELECT id FROM business_categories WHERE type = 'food' ORDER BY id LIMIT 1")
      if (businessCategoryId) {
        await insert('store_business_categories', [
          { store_id: storeId, business_category_id: businessCategoryId, createdAt: now, updatedAt: now },
        ])
      }

      // Abierta todos los dias, todo el dia (0=lunes ... 6=domingo, ver StoreService).
      await insert(
        'store_schedules',
        [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          store_id: storeId,
          day_of_week: day,
          open_time: '00:00:00',
          close_time: '23:59:00',
          is_active: true,
          createdAt: now,
          updatedAt: now,
        }))
      )

      const dollarId = await lookupId("SELECT id FROM currencies WHERE symbol = '$' ORDER BY id LIMIT 1")
      if (dollarId) {
        await insert('store_currencies', [
          { store_id: storeId, currency_id: dollarId, exchange_rate: 1, is_default: true, createdAt: now, updatedAt: now },
        ])
        await insert('store_payment_methods', [
          { store_id: storeId, type: 'efectivo', currency_id: dollarId, is_active: true, createdAt: now, updatedAt: now },
        ])
      }

      const [department] = await query(
        `INSERT INTO store_departments (store_id, name, "createdAt", "updatedAt")
         VALUES (:store, 'Comidas', :now, :now) RETURNING id`,
        { store: storeId, now }
      )
      const [category] = await query(
        `INSERT INTO store_categories (store_id, name, "createdAt", "updatedAt")
         VALUES (:store, 'Populares', :now, :now) RETURNING id`,
        { store: storeId, now }
      )

      const products = [
        { name: 'Hamburguesa Demo', description: 'Hamburguesa clasica con papas.', price: 6 },
        { name: 'Pizza Demo', description: 'Pizza personal de queso.', price: 8 },
        { name: 'Refresco Demo', description: 'Refresco de 355 ml.', price: 1.5 },
      ]
      for (const product of products) {
        const [row] = await query(
          `INSERT INTO store_products (store_id, name, description, price, currency_id, department_id,
             is_available, is_inventoryable, "createdAt", "updatedAt")
           VALUES (:store, :name, :description, :price, :currency, :department, true, false, :now, :now)
           RETURNING id`,
          {
            store: storeId,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: dollarId,
            department: department.id,
            now,
          }
        )
        await insert('store_product_categories', [
          { product_id: row.id, category_id: category.id, createdAt: now, updatedAt: now },
        ])
      }

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },

  async down(queryInterface: QueryInterface) {
    const q = (sql: string, replacements: Record<string, any> = {}) =>
      queryInterface.sequelize.query(sql, { replacements })
    await q(`DELETE FROM store_product_categories WHERE product_id IN (SELECT id FROM store_products WHERE store_id IN (SELECT id FROM stores WHERE owner_id IN (SELECT id FROM users WHERE email = :e)))`, { e: REVIEW_STORE_EMAIL })
    for (const table of ['store_products', 'store_categories', 'store_departments', 'store_payment_methods', 'store_currencies', 'store_schedules', 'store_business_categories']) {
      await q(`DELETE FROM ${table} WHERE store_id IN (SELECT id FROM stores WHERE owner_id IN (SELECT id FROM users WHERE email = :e))`, { e: REVIEW_STORE_EMAIL })
    }
    await q(`DELETE FROM stores WHERE owner_id IN (SELECT id FROM users WHERE email = :e)`, { e: REVIEW_STORE_EMAIL })
    await q(`DELETE FROM users WHERE email = :e OR phone_number IN (:phones)`, {
      e: REVIEW_STORE_EMAIL,
      phones: [REVIEW_PASSENGER_PHONE, REVIEW_DRIVER_PHONE, REVIEW_STORE_PHONE],
    })
  },
}
