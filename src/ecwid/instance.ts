import { Ecwid } from '@wmakeev/ecwid'
import once from 'lodash.once'
import fetch from 'node-fetch'

export * from '@wmakeev/ecwid'

export const getEcwidInstance = once(() => {
  const { ECWID_STORE_ID, ECWID_TOKEN_SECRET } = process.env

  if (!ECWID_STORE_ID) {
    throw new Error('Переменная окружения ECWID_STORE_ID не определена')
  }

  if (!ECWID_TOKEN_SECRET) {
    throw new Error('Переменная окружения ECWID_TOKEN_SECRET не определена')
  }

  return new Ecwid(ECWID_STORE_ID, ECWID_TOKEN_SECRET, { fetch })
})
