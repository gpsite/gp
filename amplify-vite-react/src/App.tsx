import { useState } from 'react';
import TestAuth from './pages/TestAuth';
import TestStorage from './pages/TestStorage';
import './App.css';

function App() {
    const [view, setView] = useState<'home' | 'auth' | 'storage'>('home');

    return (
        <>
            <nav style={{ padding: '10px', borderBottom: '1px solid #333', marginBottom: '20px' }}>
                <button onClick={() => setView('home')}>Home</button>
                <button onClick={() => setView('auth')}>Test Auth</button>
                <button onClick={() => setView('storage')}>Test Storage</button>
            </nav>

            {view === 'home' && (
                <div style={{ padding: '20px' }}>
                    <h1>Amplify React App</h1>
                    <p>
                        Welcome! This app demonstrates AWS Amplify Authentication and Storage.
                    </p>
                    <p>
                        Use the buttons above to navigate to the test pages.
                    </p>
                </div>
            )}

            {view === 'auth' && <TestAuth />}

            {view === 'storage' && <TestStorage />}
        </>
    )
}

export default App
