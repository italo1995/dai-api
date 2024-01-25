declare namespace Express {
  export interface Request {
    only: (keys: string[]) => any
    input: (key: string, type: string | undefined = undefined) => any
    auth: any
  }
}
