import Serverless from "serverless";
import { AwsClient } from "./services/awsClient";
import { assign } from "./utils/helper";

type CustomVars = {
    ssmParameterName: string;
    cognitoUserPoolId?: string;
    cognitoUserPoolIdOutputKey?: string;
    cognitoUserPoolClientIdOutputKey: string;
};

type CognitoUserPoolClient = {
    auth: {
        cognito: {
            clientId: string;
            clientSecret: string;
        };
    };
};

//TODO: unit test
class CognitoClientCredentialsToSSMPlugin {
    public hooks: Record<string, unknown>;
    public serverless: Serverless;
    private customVars: CustomVars;
    private awsClient: AwsClient;

    constructor(serverless: Serverless) {
        const awsProvider = serverless.getProvider("aws");

        this.hooks = {
            "after::deploy:deploy": this.afterDeploy.bind(this),
        };
        this.serverless = serverless;
        this.awsClient = new AwsClient(awsProvider);

        const customPropSchema = {
            type: "object",
            properties: {
                ssmParameterName: { type: "string" },
                cognitoUserPoolId: { type: "string" },
                cognitoUserPoolIdOutputKey: { type: "string" },
                cognitoUserPoolClientIdOutputKey: { type: "string" },
            },
            required: ["ssmParameterName", "cognitoUserPoolClientIdOutputKey"],
        };

        serverless.configSchemaHandler.defineCustomProperties(customPropSchema);
        this.customVars = serverless.service.custom.cognitoClientCredentialsToSSM;
    }

    /**
     * 1 - Get cloudformation cognitoUserPoolIdOutputKey
     * 2 - Query cloudformation to get created app client id
     * 3 - Query cognito to get app client configuration
     * 4 - Query parameter store to get existing parameter, if any
     * 5 - Merge existing parameter with new client credentials
     * 6 - Save parameter in parameter store
     */
    public async afterDeploy(): Promise<void> {
        const { cognitoUserPoolClientIdOutputKey, cognitoUserPoolId, ssmParameterName } = this.customVars || {};

        if (!cognitoUserPoolId) {
            throw new Error("Missing cognitoUserPoolId");
        }

        const cognitoUserPoolClient: CognitoUserPoolClient = await this.getUserPoolClient(
            cognitoUserPoolClientIdOutputKey,
            cognitoUserPoolId,
        );
        const existingParameter: Record<string, unknown> | undefined = await this.awsClient.getExistingSSMParameter(
            ssmParameterName,
        );
        const parameterValue = existingParameter
            ? assign(existingParameter, cognitoUserPoolClient)
            : cognitoUserPoolClient;

        await this.awsClient.putSSMParameter(ssmParameterName, parameterValue);
    }

    private async getUserPoolClient(
        cognitoUserPoolClientIdOutputKey: string,
        cognitoUserPoolId: string,
    ): Promise<CognitoUserPoolClient> {
        const cognitoUserPoolClientId = await this.awsClient.getStackSpecificOutputValue(
            cognitoUserPoolClientIdOutputKey,
        );
        const { ClientId, ClientSecret } = await this.awsClient.describeUserPoolClient(
            cognitoUserPoolId,
            cognitoUserPoolClientId,
        );

        if (!ClientId || !ClientSecret) throw new Error("getUserPoolClient: Missing client credentials");
        //TODO: Expect object structure to be passed by the developer via custom vars
        return {
            auth: {
                cognito: {
                    clientId: ClientId,
                    clientSecret: ClientSecret,
                },
            },
        };
    }
}

export = CognitoClientCredentialsToSSMPlugin;
