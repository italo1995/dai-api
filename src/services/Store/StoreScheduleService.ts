/*
- File: StoreScheduleService.ts

- Purpose: Horario semanal de una tienda. Un unico endpoint de escritura (setWeek) que
  reemplaza toda la semana de una vez - no hay CRUD por fila individual, el formulario del
  panel siempre manda las 7 filas juntas.

==========Functions Manifest==========
- StoreScheduleService Methods:
  1 - allByStore: trae el horario (hasta 7 filas, una por dia) de una tienda
  2 - setWeek: borra el horario existente de la tienda y crea el nuevo de una vez
*/
import { modelStoreSchedule } from '../../models'
import type { IStoreScheduleInstance } from '../../models/Store/StoreScheduleModel'
import type { IStoreScheduleSetWeekInput } from '../../types/StoreSchedule'

class StoreScheduleService {
  async allByStore(pStoreId: number): Promise<IStoreScheduleInstance[]> {
    const vResponse: IStoreScheduleInstance[] = await modelStoreSchedule.findAll({
      where: { storeId: pStoreId },
    })
    return vResponse
  }

  async setWeek(pData: IStoreScheduleSetWeekInput): Promise<IStoreScheduleInstance[]> {
    await modelStoreSchedule.destroy({ where: { storeId: pData.storeId } })
    if (!pData.schedules?.length) {
      return []
    }
    const vRows = pData.schedules.map((pItem) => ({
      storeId: pData.storeId,
      dayOfWeek: pItem.dayOfWeek,
      openTime: pItem.openTime || null,
      closeTime: pItem.closeTime || null,
      isActive: Boolean(pItem.isActive),
    }))
    const vResponse: IStoreScheduleInstance[] = await modelStoreSchedule.bulkCreate(vRows)
    return vResponse
  }
}
export default new StoreScheduleService()
