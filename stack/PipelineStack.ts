import { LinuxBuildImage } from '@aws-cdk/aws-codebuild'
import { Repository } from '@aws-cdk/aws-codecommit'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { Construct, Stack } from '@aws-cdk/core'
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource
} from '@aws-cdk/pipelines'
import type { AppStackProps } from './AppStack'
import { PipelineStage } from './PipelineStage'

export interface PipelineStackProps extends AppStackProps {
  /** Source repository branch to deploy */
  sourceBranch: string

  /** (optional) NPM token to install private dependencies */
  npmTokenSecretName?: string
}

export class PipelineStack extends Stack {
  constructor(
    scope: Construct,
    id: `${'Prod' | 'Stage'}-${string}`,
    props: PipelineStackProps
  ) {
    const stackPrefix = `${props.appStageName}-`

    if (id.indexOf(stackPrefix) !== 0) {
      throw new Error(
        `PipelineStack id should have app stage prefix "${stackPrefix}"`
      )
    }

    super(scope, id, props)

    const codeCommitRepository = Repository.fromRepositoryName(
      this,
      'CodeCommitRepository',
      `${props.appName}Stack`
    )

    const codeBuildStep = new CodeBuildStep('SynthStep', {
      input: CodePipelineSource.codeCommit(
        codeCommitRepository,
        props.sourceBranch
      ),

      installCommands: ['npm install -g aws-cdk json'],

      commands: [
        'echo "Node.js $(node -v), NPM $(npm -v)"',
        'touch .npmrc',
        ...(props.npmTokenSecretName
          ? [
              'NPM_TOKEN=$(aws secretsmanager get-secret-value --secret-id $NPM_TOKEN_SECRET_NAME | json SecretString)',
              'echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc'
            ]
          : []),
        'npm ci',
        'npm run test'
      ],

      buildEnvironment: {
        /** node v14.15.4, npm v6.14.10 */
        buildImage: LinuxBuildImage.STANDARD_5_0
      },

      env: {
        ...(props.npmTokenSecretName
          ? { NPM_TOKEN_SECRET_NAME: props.npmTokenSecretName }
          : {})
      }
    })

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: codeBuildStep,
      crossAccountKeys: false
    })

    const stage = new PipelineStage(this, props.appStageName, props)

    pipeline.addStage(stage)

    // [Definining the pipeline](https://docs.aws.amazon.com/cdk/api/latest/docs/pipelines-readme.html#definining-the-pipeline)
    // We should call buildPipeline before npmTokenSecret.grantRead,
    // otherwise "Error: Call pipeline.buildPipeline() before reading this property"
    pipeline.buildPipeline()

    if (props.npmTokenSecretName) {
      /**
       * NPM token to install private repos
       * @link https://docs.aws.amazon.com/cdk/latest/guide/get_secrets_manager_value.html
       */
      const npmTokenSecret = Secret.fromSecretNameV2(
        this,
        'NpmTokenSecret',
        props.npmTokenSecretName
      )

      npmTokenSecret.grantRead(codeBuildStep)
    }
  }
}
