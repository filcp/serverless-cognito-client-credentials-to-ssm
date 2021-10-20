# Serverless Cognito App Client To SSM

Imagine working with a micro-service that has it's own cognito app client, and use these credentials to connect to another API Gateway . There is still a need for this service to access these credentials. If you are working with SSM Parameter Store to manage secrets, you would have to manually access this Cognito app client credentials and save in Paramter Store. This is a manual process prone to human error, not to mention the extra work for the developer and hustle to remember to save these credentials for every environment.

This plugin is meant to help mitigate this manual process. So after Serverless deployment it will automatically get these client credentials and same in Parameter Store for you.

**Requeriments**
- AWS provider
- Serverless v2.52.x or higher

## How it works
1. Serverless will deploy and CloudFormation will create the Cognito User Pool App client.
2. After deployment this plugin will query CloudFormation for the App CLient Id.
3. It will then query Cognito for the App Cliet configuration
4. It wil query Parameter Store to see if there are existing parameter for this service.
5. It will merge the credentials with existing paramter and save it in Parameter Store 

![Context Diagram](https://github.com/filcp/serverless-cognito-client-credentials-to-ssm/blob/main/context-diagram.png?raw=true)
## Installation
Install via npm in the root of your Serverless service:

```
npm install --save-dev serverless-cognito-client-credentials-to-ssm
```

Add the plugin to the plugins array in your Serverless serverless.yaml:

```yaml
plugins:
  - serverless-cognito-client-credentials-to-ssm
```
## Usage
Todo...
