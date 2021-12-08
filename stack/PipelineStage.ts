import { AppStack, AppStackProps } from './AppStack'
import { Stage, Construct } from '@aws-cdk/core'

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    new AppStack(this, `${props.appName}Stack`, props)
  }
}
