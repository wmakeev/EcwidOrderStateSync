import { getMoyskladInstance } from './moysklad/instance'
import { getEcwidInstance } from './ecwid/instance'
import { log } from './tools'

interface EcwidOrderStatePatch {
  paymentStatus:
    | 'AWAITING_PAYMENT'
    | 'PAID'
    | 'CANCELLED'
    | 'REFUNDED'
    | 'PARTIALLY_REFUNDED'

  fulfillmentStatus:
    | 'AWAITING_PROCESSING'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'WILL_NOT_DELIVER'
    | 'RETURNED'
    | 'READY_FOR_PICKUP'
    | 'OUT_FOR_DELIVERY'
}

export interface SyncEcwidOrderStateParams {
  /**
   * Href заказа в МойСклад, статус которого нужно синхронизировать.
   */
  moyskladCustomerOrderHref: `https://online.moysklad.ru/api/remap/1.2/entity/${string}/${string}`

  // TODO Использовать для указания идентификатор
  /**
   * Название пользовательского поля в заказе МойСклад, которое содержит
   * наименование заказа в Ecwid
   */
  ecwidOrderIdUserFieldName: string
}

export async function syncEcwidOrderState(params: SyncEcwidOrderStateParams) {
  const { moyskladCustomerOrderHref, ecwidOrderIdUserFieldName } = params

  const ms = getMoyskladInstance()
  const ecwid = getEcwidInstance()

  const customerOrderId = ms.parseUrl(moyskladCustomerOrderHref).path.pop()

  if (!customerOrderId) {
    throw new Error(
      `Не удалось получить идентификатор из ссылки - ${moyskladCustomerOrderHref}`
    )
  }

  /** Заказ покупателя где был обновлен статус */
  const customerOrder = await ms.GET(
    `entity/customerorder/${customerOrderId}`,
    {
      expand: 'state'
    }
  )

  if (customerOrder.state?.stateType !== 'Successful') {
    log('info', {
      message: 'Cтатус заказа в Ecwid не требует обновления',
      customerOrderName: customerOrder.name,
      customerOrderStateType: customerOrder.state?.stateType
    })

    return
  }

  const ecwidOrderIdAttr = customerOrder.attributes?.find(
    attr => attr.name === ecwidOrderIdUserFieldName
  )

  if (!ecwidOrderIdAttr) {
    log('warn', {
      message: 'В заказе покупателя не указан номер заказа Ecwid',
      customerOrderName: customerOrder.name,
      customerOrderStateType: customerOrder.state?.stateType
    })

    return
  }

  if (ecwidOrderIdAttr.type !== 'string') {
    throw new Error(
      'Тип атрибута содержащего номер заказа Ecwid не является строкой'
    )
  }

  const ecwidOrderId = ecwidOrderIdAttr.value

  const ecwidPatch: EcwidOrderStatePatch = {
    paymentStatus: 'PAID',
    fulfillmentStatus: 'DELIVERED'
  }

  await ecwid.PUT(`orders/${ecwidOrderId}`, ecwidPatch as any)

  log('info', {
    message: 'Cтатус заказа в Ecwid обновлен',
    customerOrderName: customerOrder.name,
    customerOrderStateType: customerOrder.state?.stateType
  })
}
