import { getInstance } from 'moysklad-instance'

export function getMoyskladInstance() {
  const instance = getInstance('default', {
    apiVersion: '1.2',
    userAgent: 'EcwidOrderStateSync'
  })

  return instance
}
