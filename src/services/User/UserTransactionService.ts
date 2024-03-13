/* 
- File: UserTransactionService.ts

- Purpose: El serivicio UserTransaction se encarga de las consultas con los modelos y funcionalidades relacionadas al las trasactiones hechas por los clientes

- Author: Jairo Belen

- Creation: 13/03/2024  

==========Functions Manifest==========
- TermsTerm Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { IUserTransactionInstance } from '../../models/User/UserTransactionModel'
import { modelUserTransaction } from '../../models'
import type { IUserTransactionInput, IResponseAllUserTransaction } from '../../types/User'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IUserTransaction {
  validate(data: any): any
  show(pId: number): Promise<IUserTransactionInstance | null>
  all(pParam: any): Promise<IResponseAllUserTransaction | IUserTransactionInstance[]>
  create(payload: IUserTransactionInput): Promise<IUserTransactionInstance>
  update(payload: IUserTransactionInput): Promise<IUserTransactionInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class UserTransaction implements IUserTransaction {
  async validate(data: any) {
    const dataValidate = modelUserTransaction.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllUserTransaction | IUserTransactionInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name','UserTransaction'
      )

      const vResponse: IUserTransactionInstance[] = await modelUserTransaction.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllUserTransaction = await fxReponseServices(
          pParam,
          whereStatement,
          'UserTransaction',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IUserTransactionInstance | null> {
    try {
      const vResponse: IUserTransactionInstance | null = await modelUserTransaction.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IUserTransactionInput): Promise<IUserTransactionInstance> {
    try {
      const vResponse: IUserTransactionInstance = await modelUserTransaction.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IUserTransactionInput): Promise<IUserTransactionInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: IUserTransactionInstance | null = await modelUserTransaction.findOne({
          where: {
            id: pData.id,
          },
        })
        await vCountry?.update(pData, { where: { id: pData.id } })
        return vCountry
      }
      return null
    } catch (error) {
      throw error
    }
  }
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelUserTransaction.update({ deletedAt: new Date() }, {
        where: { id: pId }
      })
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}
export default new UserTransaction()