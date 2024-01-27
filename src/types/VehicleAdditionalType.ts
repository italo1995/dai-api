export interface IVehicleAdditionalInput {
  Id: number
  name: string

}

export interface IVehicleAdditionalInputUpdate {
    id: string
  name: string
  
}

export interface IVehicleAdditionalCodeInput {
    code: string
    userID?: string
}

export enum EtypeVehicleAdditional {
    passenger = '1',
    driver = '2',
}

export interface ITypeFileVehicleAdditionalInput {
    id?: number
    name: string
    description?: string
    isVisibility?: boolean
    required?: boolean
}
export interface IVehicleAddiotionalDetailInput {
  id?: string
  sectionName: string
  fieldName: string
  type: string
  value: string
  userId: string
}
export interface IResponseAll {
  total: number
  totalPage: number
  data: any[]
  actualPage: number
}