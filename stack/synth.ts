import { App, Duration } from '@aws-cdk/core'
import { PipelineStack } from './PipelineStack'
import { env } from './env'
import { capitalize } from '../src/tools'

const { CDK_DEFAULT_ACCOUNT: ACCOUNT, CDK_DEFAULT_REGION: REGION } = env
const APP_NAME = 'EcwidOrderStateSync'
const REPO_NAME = `${APP_NAME}Stack`

const createAppStage = (app: App, stage: 'prod' | 'stage') => {
  const lowedStage = stage.toLowerCase()

  return new PipelineStack(app, `${capitalize(stage)}-${APP_NAME}CI`, {
    env: {
      account: ACCOUNT,
      region: REGION
    },
    description: `${APP_NAME} ${lowedStage} CI stack`,

    // Config

    appName: APP_NAME,

    appStageName: capitalize(stage),

    sourceCodeCommitRepoArn: `arn:aws:codecommit:${REGION}:${ACCOUNT}:${REPO_NAME}`,

    sourceBranch: stage === 'prod' ? 'master' : 'stage',

    /**
     * Общая конфигурация приложения
     */
    appConfigParamName: `${lowedStage}/${APP_NAME}/config`,

    /**
     * Наименование SSM параметра, содержащего Идентификатор аккаунта МойСклад
     *
     * параметр указан не в конфигурации, т.к. идет подписка на события с указанием
     * id аккаунта в процессе разворачивания приложения
     * */
    moyskladAccountIdParamName: `${lowedStage}/${APP_NAME}/moyskladAccountId`,

    moyskladWebhookEventBusArn: `arn:aws:events:${REGION}:${ACCOUNT}:event-bus/moysklad-webhook-events`,

    moyskladAuthSecretName: `${lowedStage}/moysklad/auth`,

    ecwidAuthSecretName: `${lowedStage}/ecwid/auth`,

    // npmTokenSecretName: 'npm/token',

    webhookHandlerLambdaTimeoutSeconds: Duration.seconds(60)
  })
}

const app = new App()

createAppStage(app, 'prod')
createAppStage(app, 'stage')

app.synth()
