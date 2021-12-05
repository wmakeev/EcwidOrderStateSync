import { getEnv } from './getEnv'
import { getSecret } from './tools/getParameters'

// TODO Добавить типизированную проверку параметров

/**
 * Асинхронная установка переменных окружения из внешних источников
 */
export async function setEnv() {
  const { ECWID_AUTH_SECRET_NAME, MOYSKLAD_AUTH_SECRET_NAME } = getEnv()

  const [moyskladAuthJson, ecwidAuthJson] = await Promise.all([
    getSecret(ECWID_AUTH_SECRET_NAME),
    getSecret(MOYSKLAD_AUTH_SECRET_NAME)
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
        `Некорректное значение параметра "${MOYSKLAD_AUTH_SECRET_NAME}" - ${err.message}`
      )
    }
  }
}
