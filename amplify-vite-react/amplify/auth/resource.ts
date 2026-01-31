import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define Authentication with AWS Cognito.
 * We configure Email login and Google Social Login.
 * 
 * IMPORTANT: You must set 'GOOGLE_CLIENT_ID' and 'GOOGLE_CLIENT_SECRET' 
 * as secrets in your Amplify Console or local .env file.
 */
export const auth = defineAuth({
    loginWith: {
        email: true,
        externalProviders: {
            google: {
                clientId: secret('GOOGLE_CLIENT_ID'),
                clientSecret: secret('GOOGLE_CLIENT_SECRET'),
                scopes: ['email', 'profile', 'openid']
            },
            callbackUrls: [
                'http://localhost:5173/', // Common Vite port
                'http://localhost:3000/'
            ],
            logoutUrls: [
                'http://localhost:5173/',
                'http://localhost:3000/'
            ],
        }
    }
});
