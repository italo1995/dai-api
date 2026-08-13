/*
- File: PopupService.ts

- Purpose: Servicio del PopUp publicitario inicial (CMS). Se encarga de las consultas con el
  modelo y de las reglas de negocio: máximo 6 popups activos/existentes a la vez.

- Author: Claude

- Creation: 08/08/2026

==========Functions Manifest==========
- PopupService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae un popup por id
  3 - all: version publica para la app/cliente. Popups con state=true, barajados al azar y
      recortados a MAX_POPUPS (el recorte se hace DESPUES de barajar, para que el resultado
      sea realmente aleatorio). Solo los campos que necesita mostrar (id, image, link). Sin
      paginacion, sin timestamps.
  4 - allAdmin: version completa para el panel admin. Todos los popups (activos e inactivos),
      todos los campos, con paginacion/busqueda opcional.
  5 - create: crea un popup nuevo, rechaza si ya existen MAX_POPUPS
  6 - update: actualiza un popup existente
  7 - updateOrder: actualiza el campo orden de varios popups de una sola vez (drag & drop)
  8 - softDeleteRecord: elimina (soft delete) un popup
*/
import { type FindOptions } from 'sequelize'
import type { IPopupInstance } from '../../models/web/PopupModel'
import { modelPopup } from '../../models'
import type { IPopupInput, IPopupOrderInput, IPopupPublic, IResponseAllPopup } from '../../types/webTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'
import { fxShuffleArray } from '../../utils/helpers'

export const MAX_POPUPS = 1 //Modificado de 6 a 1 segun solicitud de la empresa

interface IPopupService {
  validate(data: any): any
  show(pId: number): Promise<IPopupInstance | null>
  all(): Promise<IPopupPublic[]>
  allAdmin(pParam: any): Promise<IResponseAllPopup | IPopupInstance[]>
  create(payload: IPopupInput): Promise<IPopupInstance>
  update(payload: IPopupInput): Promise<IPopupInstance | null>
  updateOrder(payload: IPopupOrderInput[]): Promise<IPopupInstance[]>
  softDeleteRecord(pId: number): Promise<boolean>
}

class PopupService implements IPopupService {
  async validate(data: any) {
    const dataValidate = modelPopup.build(data)
    await dataValidate.validate()
  }

  // Endpoint publico consumido por la app: solo los popups activos, barajados al azar y
  // recortados a MAX_POPUPS. El recorte va DESPUES del shuffle a proposito: si se recortara
  // antes, siempre se verian los mismos (los primeros segun el orden de la query), no una
  // seleccion realmente aleatoria.
  public async all(): Promise<IPopupPublic[]> {
    try {
      const vResponse: IPopupInstance[] = await modelPopup.findAll({
        where: { state: true },
        attributes: ['id', 'image', 'link', 'orden'],
      })
      const vShuffled: IPopupInstance[] = fxShuffleArray(vResponse).slice(0, MAX_POPUPS)
      return vShuffled as unknown as IPopupPublic[]
    } catch (error) {
      throw error
    }
  }

  public async allAdmin(pParam: any): Promise<IResponseAllPopup | IPopupInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'Popup'
      )

      const vResponse: IPopupInstance[] = await modelPopup.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllPopup = await fxReponseServices(
          pParam,
          whereStatement,
          'Popup',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IPopupInstance | null> {
    try {
      const vResponse: IPopupInstance | null = await modelPopup.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async countActive(): Promise<number> {
    return modelPopup.count()
  }

  async create(pData: IPopupInput): Promise<IPopupInstance> {
    try {
      const vResponse: IPopupInstance = await modelPopup.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IPopupInput): Promise<IPopupInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: IPopupInstance | null = await modelPopup.findOne({
          where: {
            id: pData.id,
          },
        })
        await vReponse?.update(pData, { where: { id: pData.id } })
        return vReponse
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async updateOrder(pData: IPopupOrderInput[]): Promise<IPopupInstance[]> {
    try {
      // Update parcial (solo 'orden') por cada fila: bulkCreate + updateOnDuplicate no sirve
      // aca porque arma un INSERT con todas las columnas del modelo, mandando NULL en las que
      // no se envian (name/image son NOT NULL).
      await Promise.all(
        pData.map((item) =>
          modelPopup.update({ orden: item.orden }, { where: { id: item.id } })
        )
      )
      const vResponse: IPopupInstance[] = await modelPopup.findAll({
        where: { id: pData.map((item) => item.id) },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelPopup.update(
        { deletedAt: new Date() },
        {
          where: { id: pId },
        }
      )
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}
export default new PopupService()
