import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

export default function TestAuth() {
    return (
        <div style={{ padding: '20px' }}>
            <h2>Authentication Test</h2>
            <p>Sign in using Email or Google.</p>

            <Authenticator socialProviders={['google']}>
                {({ signOut, user }) => (
                    <main>
                        <h3>Welcome, {user?.signInDetails?.loginId || user?.username}</h3>
                        <p>You are successfully authenticated.</p>
                        <button onClick={signOut}>Sign out</button>
                    </main>
                )}
            </Authenticator>
        </div>
    );
}
