import { AppStack } from './AppStack'
import { Stage, Construct, StageProps, Duration } from '@aws-cdk/core'

export interface PipelineStageProps extends StageProps {
  appName: string
  moyskladWebhookEventBusArn: string
  moyskladAccountId: string
  moyskladAuthSecretName: string
  ecwidAuthSecretName: string
  webhookHandlerLambdaTimeoutSeconds?: Duration
}

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: PipelineStageProps) {
    super(scope, id, props)

    new AppStack(this, `${props.appName}Stack`, {
      appName: props.appName,
      moyskladWebhookEventBusArn: props.moyskladWebhookEventBusArn,
      moyskladAccountId: props.moyskladAccountId,
      moyskladAuthSecretName: props.moyskladAuthSecretName,
      ecwidAuthSecretName: props.ecwidAuthSecretName,
      webhookHandlerLambdaTimeoutSeconds:
        props.webhookHandlerLambdaTimeoutSeconds
    })
  }
}
