import AwsProvider from "serverless/plugins/aws/provider/awsProvider";
import { CloudFormation, CognitoIdentityServiceProvider, SSM } from "aws-sdk";
import { CognitoAppClientToSSMError } from "../utils/cognitoAppClientToSSMError";
import { isJsonString } from "../utils/helper";

export class AwsClient {
    private awsProvider: AwsProvider;

    constructor(awsProvider: AwsProvider) {
        this.awsProvider = awsProvider;
    }

    public async describeCloudFormationStack(): Promise<CloudFormation.Stack> {
        try {
            const [stack]: CloudFormation.Stacks = await this.awsProvider.request(
                "CloudFormation",
                "describeCloudFormationStacks",
                {
                    StackName: this.awsProvider.naming.getStackName(),
                },
            );

            if (!stack) throw new Error("Couldn't find cloudFormation stack");

            return stack;
        } catch (error) {
            throw new CognitoAppClientToSSMError(error, "Error when getting CloudFormation stack");
        }
    }

    public async getStackSpecificOutputValue(outputKey: string): Promise<CloudFormation.OutputValue> {
        const { Outputs }: CloudFormation.Stack = await this.describeCloudFormationStack();
        const specificOutput: CloudFormation.Output | undefined = Outputs?.find(
            (output: CloudFormation.Output) => output.OutputKey === outputKey,
        );

        if (!specificOutput) throw new Error(`Couldn't find ${outputKey} output`);
        if (!specificOutput.OutputValue) throw new Error(`The ${outputKey} output has no value`);

        return specificOutput.OutputValue;
    }

    public async describeUserPoolClient(
        userPoolId: string,
        userPoolClientId: string,
    ): Promise<CognitoIdentityServiceProvider.UserPoolClientType> {
        try {
            const requestParams: CognitoIdentityServiceProvider.DescribeUserPoolClientRequest = {
                ClientId: userPoolClientId,
                UserPoolId: userPoolId,
            };
            const userPoolClient: CognitoIdentityServiceProvider.UserPoolClientType = await this.awsProvider.request(
                "CognitoIdentityServiceProvider",
                "describeUserPoolClient",
                requestParams,
            );

            return userPoolClient;
        } catch (error) {
            throw new CognitoAppClientToSSMError(error, "Error when getting User Pool Client");
        }
    }

    public async getExistingSSMParameter(parameterName: string): Promise<Record<string, unknown> | undefined> {
        try {
            const requestParams: SSM.GetParameterRequest = {
                Name: parameterName,
                WithDecryption: true,
            };
            const existingParameter: SSM.Parameter = await this.awsProvider.request(
                "SSM",
                "getParameter",
                requestParams,
            );

            if (existingParameter?.Value && !isJsonString(existingParameter.Value)) {
                throw new Error("Existing SSM parameter is not a json string");
            }

            return existingParameter?.Value ? JSON.parse(existingParameter.Value) : undefined;
        } catch (error) {
            throw new CognitoAppClientToSSMError(error, "Error when getting existing SSM parameter");
        }
    }

    public async putSSMParameter(parameterName: string, parameterValue: Record<string, unknown>): Promise<void> {
        try {
            const requestParams: SSM.PutParameterRequest = {
                Name: parameterName,
                Value: JSON.stringify(parameterValue),
                Type: "SecureString",
            };
            await this.awsProvider.request("SSM", "putParameter", requestParams);
        } catch (error) {
            throw new CognitoAppClientToSSMError(error, "Error when putting SSM parameter");
        }
    }
}
