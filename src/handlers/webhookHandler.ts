import SQS from 'aws-sdk/clients/sqs'
import _H from 'highland'
import { getConfig, getEnv } from '../getConfig'
import { setEnv } from '../setEnv'
import { syncEcwidOrderState } from '../syncEcwidOrderState'
import { log } from '../tools'
import type { WebhookHandler, WebhookSqsRecordBody } from '../types'

export interface GetWebhookHandlerParams {
  sqs: SQS
  log: typeof log
}

export function getWebhookHandler(
  params: GetWebhookHandlerParams
): WebhookHandler {
  const { sqs, log } = params

  const webhookHandler: WebhookHandler = async event => {
    log('info', { event })

    await setEnv()

    const { SOURCE_QUEUE_URL } = getEnv()
    const config = getConfig()

    if (!Array.isArray(event.Records)) {
      throw new Error('Incoming event not includes Records array property')
    }

    log('info', { eventsCount: event.Records.length })

    const ordersSynced = await _H(event.Records)
      .map(rec => {
        const webhookRequest = JSON.parse(rec.body) as WebhookSqsRecordBody

        const webhook = webhookRequest.detail

        const webhookEvent = webhook.event

        return {
          customerOrderHref: webhookEvent.meta.href,
          receiptHandle: rec.receiptHandle
        }
      })
      .map(async ({ customerOrderHref, receiptHandle }) => {
        await syncEcwidOrderState({
          moyskladCustomerOrderHref: customerOrderHref,
          ecwidOrderIdUserFieldName: config.ecwidOrderIdUserFieldName
        })

        await sqs
          .deleteMessage({
            QueueUrl: SOURCE_QUEUE_URL,
            ReceiptHandle: receiptHandle
          })
          .promise()

        return 1
      })
      .map(it => _H(it))
      .parallel(3)
      .reduce(0, (res, it) => res + it)
      .toPromise(Promise)

    log('info', {
      message: 'Orders synced',
      total: ordersSynced
    })
  }

  webhookHandler.description =
    'Меняет статус заказа в Ecwid при изменении статуса в МойСклад'

  return webhookHandler
}

export const webhookHandler: WebhookHandler = getWebhookHandler({
  sqs: new SQS(),
  log
})
