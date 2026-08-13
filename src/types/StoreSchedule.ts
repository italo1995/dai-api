export interface IStoreScheduleItemInput {
  dayOfWeek: number
  openTime?: string | null
  closeTime?: string | null
  isActive?: boolean
}

export interface IStoreScheduleSetWeekInput {
  storeId: number
  schedules: IStoreScheduleItemInput[]
}
