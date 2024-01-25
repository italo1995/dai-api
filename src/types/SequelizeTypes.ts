/* eslint-disable @typescript-eslint/ban-types */
import type { BuildOptions, DataTypeAbstract, ModelAttributeColumnOptions, Model } from 'sequelize'

type SequelizeAttribute = string | DataTypeAbstract | ModelAttributeColumnOptions

export type SequelizeAttributes<T extends { [key: string]: any }> = {
  [P in keyof T]: SequelizeAttribute
}

export type SequelizeModel = typeof Model & {
  new (values?: object, options?: BuildOptions): Model
}

export type ModelInstance = Model<any, any>

/**
 * For building model instance used in creating model in the model definition
 */
export type ModelStatic<T> = typeof Model & {
  new (values?: object, options?: BuildOptions): T
  associate: (models: any) => any
  setDataValue: (key: any, val: any) => void
}

interface ISequelizeAssociatable<T> extends Model<any, any> {
  associate(reg: T): void
}
export function isAssociatable<T>(model: {
  associate?: Function
}): model is ISequelizeAssociatable<T> {
  return typeof model.associate === 'function'
}
