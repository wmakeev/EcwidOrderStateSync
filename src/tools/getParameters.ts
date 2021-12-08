import SecretManager from 'aws-sdk/clients/secretsmanager'
import SSM from 'aws-sdk/clients/ssm'
import memoize from 'lodash.memoize'
import { log } from './log'

const sm = new SecretManager()
const ssm = new SSM()

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

export const getParam = memoize(async (paramName: string) => {
  const params: SSM.GetParameterRequest = {
    Name: paramName
  }

  const startTime = Date.now()

  const result = await ssm.getParameter(params).promise()

  log('info', {
    message: 'Parameter Store parameter retrived',
    requestTime: Date.now() - startTime
  })

  const value = result.Parameter?.Value ?? null

  return value
})
