import { AwsClient } from "../../src/services/awsClient";
import AwsProvider from "serverless/plugins/aws/provider/awsProvider";
import { CloudFormation, CognitoIdentityServiceProvider } from "aws-sdk";

const mockRequest = jest.fn();
const awsProviderMock = {
    request: mockRequest,
    naming: {
        getStackName: jest.fn(),
    },
} as unknown as AwsProvider;
const stacksMock: CloudFormation.Stacks = [
    {
        StackName: "MyStack",
        StackId: "arn:aws:cloudformation:us-east-1:123456789:stack/MyStack/aaf549a0-a413-11df-adb3-5081b3858e83",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        DisableRollback: false,
        Outputs: [
            {
                OutputKey: "testingOutput",
                OutputValue: "This is the value",
            },
        ],
    },
    {
        StackName: "MyStack2",
        StackId: "arn:aws:cloudformation:us-east-1:123456789:stack/MyStack2/aaf549a0-a413-11df-adb3-5081b38dsfg83",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        DisableRollback: false,
        Outputs: [
            {
                OutputKey: "sample",
                OutputValue: "#",
            },
        ],
    },
];
describe("AwsClient", () => {
    describe("describeCloudFormationStack", () => {
        it("Shoud return stack", async () => {
            mockRequest.mockResolvedValueOnce(stacksMock);
            const awsClient = new AwsClient(awsProviderMock);
            const stack = await awsClient.describeCloudFormationStack();

            expect(stack).toBe(stacksMock[0]);
        });

        it("Shoud throw if there is no stack", async () => {
            mockRequest.mockResolvedValueOnce([]);
            const awsClient = new AwsClient(awsProviderMock);

            await expect(awsClient.describeCloudFormationStack()).rejects.toThrowError(
                "Couldn't find cloudFormation stack",
            );
        });

        it("Shoud catch and throw new error if there is an error getting stack", async () => {
            mockRequest.mockRejectedValue(new Error("Connection Problem"));

            try {
                await new AwsClient(awsProviderMock).describeCloudFormationStack();
            } catch (error) {
                expect(error.message).toBe("Connection Problem");
                expect(error.innerMessage).toBe("Error when getting CloudFormation stack");
            }
        });
    });
    describe("getStackSpecificOutputValue", () => {
        it("Shoud return output value ", async () => {
            mockRequest.mockResolvedValueOnce(stacksMock);
            const awsClient = new AwsClient(awsProviderMock);
            const outputValue = await awsClient.getStackSpecificOutputValue("testingOutput");

            expect(outputValue).toBe("This is the value");
        });

        it("Shoud throw if stack doesn't have the specified output", async () => {
            mockRequest.mockResolvedValueOnce([{ StackName: "MyStack" }]);
            const awsClient = new AwsClient(awsProviderMock);

            await expect(awsClient.getStackSpecificOutputValue("testingOutput")).rejects.toThrowError(
                "Couldn't find testingOutput output",
            );
        });

        it("Shoud throw if the specified output has no value", async () => {
            mockRequest.mockResolvedValueOnce([
                {
                    StackName: "MyStack",
                    Outputs: [
                        {
                            OutputKey: "testingOutput",
                            OutputValue: "",
                        },
                    ],
                },
            ]);
            const awsClient = new AwsClient(awsProviderMock);

            await expect(awsClient.getStackSpecificOutputValue("testingOutput")).rejects.toThrowError(
                "The testingOutput output has no value",
            );
        });
    });

    describe("describeUserPoolClient", () => {
        const userPoolClientMock: CognitoIdentityServiceProvider.UserPoolClientType = {
            AccessTokenValidity: 30,
            AllowedOAuthFlows: ["string"],
            AllowedOAuthScopes: ["string"],
            AnalyticsConfiguration: {
                ApplicationArn: "string",
                ApplicationId: "string",
                ExternalId: "string",
                RoleArn: "string",
                UserDataShared: false,
            },
            CallbackURLs: ["string"],
            ClientId: "CLIENT_ID_MOCK",
            ClientName: "string",
            ClientSecret: "CLIENT_SECRET_MOCK",
            CreationDate: new Date(),
            DefaultRedirectURI: "string",
            EnableTokenRevocation: false,
            ExplicitAuthFlows: ["string"],
            IdTokenValidity: 23423453,
            LastModifiedDate: new Date(),
            LogoutURLs: ["string"],
            PreventUserExistenceErrors: "string",
            ReadAttributes: ["string"],
            RefreshTokenValidity: 30,
            SupportedIdentityProviders: ["string"],
            TokenValidityUnits: {
                AccessToken: "string",
                IdToken: "string",
                RefreshToken: "string",
            },
            UserPoolId: "string",
            WriteAttributes: ["string"],
        };

        it("Should return cognito user pool client", async () => {
            mockRequest.mockResolvedValueOnce(userPoolClientMock);
            const awsClient = new AwsClient(awsProviderMock);

            expect(await awsClient.describeUserPoolClient("client id", "pool id")).toMatchObject(userPoolClientMock);
        });

        it("Should catch and throw error if there is an error getting user pool client", async () => {
            mockRequest.mockRejectedValue(new Error("Connection Problem"));

            try {
                await new AwsClient(awsProviderMock).describeUserPoolClient("client id", "pool id");
            } catch (error) {
                expect(error.message).toBe("Connection Problem");
                expect(error.innerMessage).toBe("Error when getting User Pool Client");
            }
        });
    });

    describe("getExistingSSMParameter", () => {
        const existingParameter = {
            Name: "existingParameter",
            Value: JSON.stringify({ message: "this is an existing parameter" }),
        };
        const existingParameterNotJson = {
            Name: "existingParameter",
            Value: "this is an existing parameter",
        };

        it("Should return a parameter object when there is an existing parameter in SSM", async () => {
            mockRequest.mockResolvedValueOnce(existingParameter);
            const awsClient = new AwsClient(awsProviderMock);

            expect(await awsClient.getExistingSSMParameter("existingParameter")).toMatchObject({
                message: "this is an existing parameter",
            });
        });

        it("Should return undefined if there isn't any parameter", async () => {
            mockRequest.mockResolvedValueOnce({});
            const awsClient = new AwsClient(awsProviderMock);

            expect(await awsClient.getExistingSSMParameter("existingParameter")).toBeUndefined();
        });

        it("Should throw if existing parameter is not a json string", async () => {
            mockRequest.mockResolvedValueOnce(existingParameterNotJson);
            const awsClient = new AwsClient(awsProviderMock);

            await expect(awsClient.getExistingSSMParameter("existingParameter")).rejects.toThrowError(
                "Existing SSM parameter is not a json string",
            );
        });

        it("Should catch and throw error if there is an error getting existing parameter", async () => {
            mockRequest.mockRejectedValue(new Error("Connection Problem"));

            try {
                await new AwsClient(awsProviderMock).getExistingSSMParameter("existingParameter");
            } catch (error) {
                expect(error.message).toBe("Connection Problem");
                expect(error.innerMessage).toBe("Error when getting existing SSM parameter");
            }
        });
    });

    describe("putSSMParameter", () => {
        const newParameter = {
            Name: "newParameter",
            Value: JSON.stringify({ message: "this is a new parameter" }),
            Type: "SecureString",
        };

        it("Should put a parameter", async () => {
            mockRequest.mockResolvedValueOnce({});
            const awsClient = new AwsClient(awsProviderMock);
            await awsClient.putSSMParameter("newParameter", { message: "this is a new parameter" });

            expect(mockRequest).toHaveBeenCalledWith(expect.anything(), expect.anything(), newParameter);
        });

        it("Should catch and throw error if there is an error putting parameter", async () => {
            mockRequest.mockRejectedValue(new Error("Connection Problem"));

            try {
                await new AwsClient(awsProviderMock).putSSMParameter("newParameter", {
                    message: "this is a new parameter",
                });
            } catch (error) {
                expect(error.message).toBe("Connection Problem");
                expect(error.innerMessage).toBe("Error when putting SSM parameter");
            }
        });
    });
});
