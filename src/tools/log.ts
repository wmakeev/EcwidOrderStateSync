export const log = (
  level: 'info' | 'warn' | 'error',
  logData: Record<string, any> | string
) => {
  console.log(
    JSON.stringify({
      Type: 'log',
      Level: level.toUpperCase(),
      Data: logData
    })
  )
}
