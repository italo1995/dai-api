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
import {EStatusType, EtransactionType, type IUserTransactionInstance,} from '../../models/User/UserTransactionModel'
import { modelUserTransaction, modelUser } from '../../models'
import type { IUserTransactionInput, IResponseAllUserTransaction } from '../../types/User'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IUserTransaction {
  validate(data: any): any
  show(pId: number): Promise<IUserTransactionInstance | null>
  all(pParam: any): Promise<IResponseAllUserTransaction | IUserTransactionInstance[]>
  create(req: AuthRequest, payload: IUserTransactionInput): Promise<IUserTransactionInstance>
  update(req: AuthRequest, pData: IUserTransactionInput): Promise<IUserTransactionInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

export type AuthRequest = Request & {
    auth?: {
        rolId: number
    }
    only: (fields: string[]) => Partial<IUserTransactionInput>
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
        pParam?.typeSearch || 'name',
        'UserTransaction'
      )

      const vResponse: IUserTransactionInstance[] =
        await modelUserTransaction.findAll(whereStatement)
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

  async create(req: AuthRequest, pData: IUserTransactionInput): Promise<IUserTransactionInstance> {
    try {
      if (!req.auth) {
        throw new Error('Auth information is missing')
      }
      const user = await modelUser.findOne({ where: { id: pData.userId } })
      if ((!user || user.balance === null) || (!user || user.balance === undefined)) {
        throw new Error('User or user balance not found')
      }
      let status = EStatusType.pending
      if (req.auth.rolId === 1 || req.auth.rolId === 2) {
        status = EStatusType.approved
        if (pData.transactionType === EtransactionType.deposit) {
          user.balance += pData.amount
        } else if (pData.transactionType === EtransactionType.expense) {
          if (user.balance < pData.amount) {
            throw new Error('Saldo insuficiente, por favor recargue')
          }
          user.balance -= pData.amount
        }
        await user.save()
      }
      const transaction: IUserTransactionInstance = await modelUserTransaction.create({
        ...pData,
        status,
      })
      return transaction
    } catch (error) {
      throw error
    }
  }

  async update(req: AuthRequest, pData: IUserTransactionInput): Promise<IUserTransactionInstance | null> {
    try {
      if (!req.auth) {
        throw new Error('Auth information is missing')
      }
      if (pData?.id) {
        const transaction: IUserTransactionInstance | null = await modelUserTransaction.findOne({
          where: {
            id: pData.id,
          },
        })
        const user = await modelUser.findOne({ where: { id: pData.userId } })
        if ((!user || user.balance === null) || (!user || user.balance === undefined)) {
          throw new Error('User or user balance not found')
        }
        if (transaction && user) {
          if (req.auth.rolId === 1 || req.auth.rolId === 2) {
            if (pData.transactionType === EtransactionType.deposit) {
              user.balance += pData.amount
            } else { 
              if (user.balance < pData.amount) {
                throw new Error('Saldo insuficiente, por favor recargue')
              }
              user.balance -= pData.amount
            }
            await user.save()
            transaction.status = EStatusType.approved
          } else {
            transaction.status = EStatusType.pending 
          }
          await transaction.update(pData, { where: { id: pData.id } })
        }
        return transaction
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelUserTransaction.update(
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
export default new UserTransaction()
