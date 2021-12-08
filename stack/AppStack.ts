import { EventBus, EventPattern, Rule } from '@aws-cdk/aws-events'
import { SqsQueue as SqsQueueTarget } from '@aws-cdk/aws-events-targets'
import {
  Code,
  Function,
  FunctionProps,
  LayerVersion,
  Runtime
} from '@aws-cdk/aws-lambda'
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources'
import { Queue } from '@aws-cdk/aws-sqs'
import { Construct, Duration, Stack, StackProps } from '@aws-cdk/core'
import { webhookHandler } from '../src'
import type { HandlersEnvironment } from '../src/getConfig'
import { capitalize } from '../src/tools'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { StringParameter } from '@aws-cdk/aws-ssm'

/** Lambda timeout */
const LAMBDA_PROCESS_DEFAULT_TIMEOUT = Duration.seconds(60)

/** Environment keys expected by lambdas */
type LambdaEnvKeys = keyof typeof HandlersEnvironment

export interface AppStackProps extends StackProps {
  appName: string
  appConfigParamName: string
  moyskladAccountIdParamName: string
  moyskladAuthSecretName: string
  moyskladWebhookEventBusArn: string
  ecwidAuthSecretName: string
  webhookHandlerLambdaTimeoutSeconds?: Duration
}

const BATCH_SIZE = 10

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, {
      description:
        'Subscribes to Moysklad webhooks and republish each event from batch as separate hooks',
      ...props
    })

    const LAMBDA_PROCESS_TIMEOUT =
      props.webhookHandlerLambdaTimeoutSeconds ?? LAMBDA_PROCESS_DEFAULT_TIMEOUT

    const moyskladSecret = Secret.fromSecretNameV2(
      this,
      'MoyskladSecret',
      props.moyskladAuthSecretName
    )

    const ecwidSecret = Secret.fromSecretNameV2(
      this,
      'EcwidSecret',
      props.ecwidAuthSecretName
    )

    const appConfigParam = StringParameter.fromStringParameterName(
      this,
      'AppConfigParam',
      props.appConfigParamName
    )

    const moyskladAccountIdParamToken = StringParameter.valueForStringParameter(
      this,
      props.moyskladAccountIdParamName
    )

    const dependenciesLayer = new LayerVersion(this, `${props.appName}Deps`, {
      code: Code.fromAsset('./layer/dependencies/'),
      compatibleRuntimes: [Runtime.NODEJS_14_X]
    })

    /** Raw webhooks source */
    const webhookEventBus = EventBus.fromEventBusArn(
      this,
      'WebhookEventBus',
      props.moyskladWebhookEventBusArn
    )

    const webhooksQueue = new Queue(this, 'WebhookQueue', {
      visibilityTimeout: Duration.millis(
        Math.round(LAMBDA_PROCESS_TIMEOUT.toMilliseconds() * 1.5)
      ),
      deliveryDelay: Duration.seconds(30)
    })

    const LambdasEnv: { [key in LambdaEnvKeys]: string } = {
      SOURCE_QUEUE_URL: webhooksQueue.queueUrl,
      CONFIG_PARAM_NAME: props.appConfigParamName,
      MOYSKLAD_ACCOUNT_ID: moyskladAccountIdParamToken,
      MOYSKLAD_AUTH_SECRET_NAME: props.moyskladAuthSecretName,
      ECWID_AUTH_SECRET_NAME: props.ecwidAuthSecretName,
      BATCH_SIZE: String(BATCH_SIZE)
    }

    const commonLambdaConfig: FunctionProps = {
      code: Code.fromAsset('./build/src'),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 128,
      timeout: LAMBDA_PROCESS_TIMEOUT,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        ...LambdasEnv
      },
      layers: [dependenciesLayer]
    }

    if (!webhookHandler.name) {
      throw new Error(
        'webhookHandler function should have not empty name property'
      )
    }

    const webhooksQueueHandlerLambda = new Function(
      this,
      `${capitalize(webhookHandler.name)}Lambda`,
      {
        ...commonLambdaConfig,
        handler: `index.${webhookHandler.name}`,
        description: webhookHandler.description
      }
    )

    webhooksQueueHandlerLambda.addEventSource(
      new SqsEventSource(webhooksQueue, {
        maxBatchingWindow: Duration.seconds(30),
        batchSize: BATCH_SIZE
      })
    )

    // TODO Нужно ли если добавлен как EventSource
    webhooksQueue.grantConsumeMessages(webhooksQueueHandlerLambda)

    /**
     * Event pattern
     *
     * @link https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html
     */
    const webhookEventPattern: EventPattern = {
      source: ['webhook'],
      detailType: ['MoyskladFlattenedWebhook'],
      detail: {
        event: {
          accountId: [moyskladAccountIdParamToken],
          meta: {
            type: ['customerorder']
          },
          action: ['UPDATE'],
          updatedFields: ['state']
        }
      }
    }

    const webhookEventRule = new Rule(this, 'WebhookEventRule', {
      eventBus: webhookEventBus,
      description: 'Подписка на веб-хуки МойСклад'
    })

    webhookEventRule.addEventPattern(webhookEventPattern)
    webhookEventRule.addTarget(new SqsQueueTarget(webhooksQueue))

    moyskladSecret.grantRead(webhooksQueueHandlerLambda)
    ecwidSecret.grantRead(webhooksQueueHandlerLambda)
    appConfigParam.grantRead(webhooksQueueHandlerLambda)
  }
}
