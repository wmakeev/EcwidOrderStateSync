import SecretManager from 'aws-sdk/clients/secretsmanager'
import memoize from 'lodash.memoize'
import { log } from './log'

const sm = new SecretManager()

export const getSecret = memoize(async (secretName: string) => {
  const params: SecretManager.GetSecretValueRequest = {
    SecretId: secretName
  }

  const startTime = Date.now()

  const result = await sm.getSecretValue(params).promise()

  log('info', {
    message: 'SecretManager parameter retrived',
    requestTime: Date.now() - startTime
  })

  const secretValue = result.SecretString ?? null

  return secretValue
})
