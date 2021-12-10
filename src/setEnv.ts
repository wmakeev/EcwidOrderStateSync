import { getEnv } from './getConfig'
import { getSecret, getParam } from './tools/getParameters'

// TODO Добавить типизированную проверку параметров

/**
 * Асинхронная установка переменных окружения из внешних источников
 */
export async function setEnv() {
  const {
    ECWID_AUTH_SECRET_NAME,
    MOYSKLAD_AUTH_SECRET_NAME,
    CONFIG_PARAM_NAME
  } = getEnv()

  const [moyskladAuthJson, ecwidAuthJson, appConfigJson] = await Promise.all([
    getSecret(MOYSKLAD_AUTH_SECRET_NAME),
    getSecret(ECWID_AUTH_SECRET_NAME),
    getParam(CONFIG_PARAM_NAME)
  ])

  if (moyskladAuthJson) {
    try {
      const auth = JSON.parse(moyskladAuthJson) as {
        login: string
        password: string
      }

      process.env['MOYSKLAD_LOGIN'] = auth.login
      process.env['MOYSKLAD_PASSWORD'] = auth.password
    } catch (err: any) {
      throw new Error(
        `Некорректное значение параметра "${MOYSKLAD_AUTH_SECRET_NAME}" - ${err.message}`
      )
    }
  }

  if (ecwidAuthJson) {
    try {
      const auth = JSON.parse(ecwidAuthJson) as {
        storeId: string
        tokenSecret: string
      }

      process.env['ECWID_STORE_ID'] = auth.storeId
      process.env['ECWID_TOKEN_SECRET'] = auth.tokenSecret
    } catch (err: any) {
      throw new Error(
        `Некорректное значение параметра "${ECWID_AUTH_SECRET_NAME}" - ${err.message}`
      )
    }
  }

  if (appConfigJson) {
    try {
      // TODO appConfig runtime test
      const appConfig = JSON.parse(appConfigJson) as {
        ecwidOrderIdUserFieldName: string
      }

      global.appConfig = appConfig
    } catch (err: any) {
      throw new Error(
        `Некорректное значение параметра "${CONFIG_PARAM_NAME}" - ${err.message}`
      )
    }
  }
}
