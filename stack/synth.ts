import { App, Duration } from '@aws-cdk/core'
import { PipelineStack } from './PipelineStack'
import { env } from './env'

// Используем текущий регион
const { CDK_DEFAULT_ACCOUNT: ACCOUNT, CDK_DEFAULT_REGION: REGION } = env

/** Название приложения */
const APP_NAME = 'EcwidOrderStateSync'

/**
 * Инициализирует стек приложения для указанного stage
 *
 * @param app Инстанс App
 * @param stage Stage приложение
 * @returns Стек
 */
const createStack = (app: App, stage: 'Prod' | 'Stage') => {
  const lowedStage = stage.toLowerCase()

  return new PipelineStack(app, `${stage}-${APP_NAME}CI`, {
    env: {
      account: ACCOUNT,
      region: REGION
    },

    /** Описание текущего стека */
    description: `${APP_NAME} ${lowedStage} CI stack`,

    // Config

    /** Название приложения */
    appName: APP_NAME,

    /** Stage приложения */
    appStageName: stage,

    /** Ветка репозитория из которой будет разворачиватся текущий stage приложения */
    sourceBranch: stage === 'Prod' ? 'master' : 'stage',

    /**
     * Общая конфигурация приложения
     */
    appConfigParamName: `/${lowedStage}/${APP_NAME}/config`,

    /**
     * Наименование SSM параметра, содержащего Идентификатор аккаунта МойСклад
     *
     * параметр указан не в конфигурации, т.к. идет подписка на события с указанием
     * id аккаунта в процессе разворачивания приложения
     * */
    moyskladAccountIdParamName: `/${lowedStage}/${APP_NAME}/moysklad-account-id`,

    /**
     * Шина на которую будет подписано приложение (вебхуки МойСклад)
     */
    moyskladWebhookEventBusName: 'moysklad-webhook-events',

    /**
     * Логин и пароль МойСклад
     */
    moyskladAuthSecretName: `${lowedStage}/moysklad/auth`,

    /**
     * Ключи Ecwid
     */
    ecwidAuthSecretName: `${lowedStage}/ecwid/auth`,

    // npmTokenSecretName: 'npm/token',

    /**
     * Максимальное кол-во веб-хуков обрабатываемое за раз одной функцией
     */
    queueBatchSize: 10,

    webhookHandlerLambdaTimeoutSeconds: Duration.seconds(60)
  })
}

const app = new App()

createStack(app, 'Prod')

createStack(app, 'Stage')

app.synth()
