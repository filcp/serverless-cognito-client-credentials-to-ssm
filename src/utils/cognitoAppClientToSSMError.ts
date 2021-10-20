export class CognitoAppClientToSSMError extends Error {
    public innerMessage: string;

    constructor(error: Error, innerMessage: string) {
        super(error.message);
        this.name = "CognitoAppClientToSSMError";
        this.innerMessage = innerMessage;

        Error.captureStackTrace(error, CognitoAppClientToSSMError);
    }
}
