import once from 'lodash.once'
import { cleanEnv, num, str } from 'envalid'

/** Common environment variables for every handler */
export const HandlersEnvironment = {
  SOURCE_QUEUE_URL: str(),
  MOYSKLAD_ACCOUNT_ID: str(),
  MOYSKLAD_AUTH_SECRET_NAME: str(),
  ECWID_AUTH_SECRET_NAME: str(),
  BATCH_SIZE: num()
}

export const getEnv = once(() => {
  const env = cleanEnv(process.env, HandlersEnvironment)
  return env
})
