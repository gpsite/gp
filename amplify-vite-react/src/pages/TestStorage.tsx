import { useState, useEffect } from 'react';
import { uploadData, list } from 'aws-amplify/storage';

export default function TestStorage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [items, setItems] = useState<{ path: string }[]>([]);

    useEffect(() => {
        fetchFiles();
    }, []);

    async function fetchFiles() {
        try {
            const result = await list({
                path: 'public/',
            });
            setItems(result.items);
        } catch (e) {
            console.error('Error listing files', e);
        }
    }

    async function handleUpload() {
        if (!file) return;
        try {
            setUploadStatus('Uploading...');
            const result = await uploadData({
                path: `public/${file.name}`,
                data: file,
            }).result;
            setUploadStatus(`Success: ${result.path}`);
            fetchFiles();
        } catch (e) {
            setUploadStatus(`Error: ${e}`);
        }
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Storage Test (S3)</h2>

            <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
                <h3>Upload File</h3>
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                />
                <button onClick={handleUpload} disabled={!file}>
                    Upload
                </button>
                <p>{uploadStatus}</p>
            </div>

            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
                <h3>File List (public/)</h3>
                <ul>
                    {items.map((item) => (
                        <li key={item.path}>{item.path}</li>
                    ))}
                </ul>
                {items.length === 0 && <p>No files found.</p>}
            </div>
        </div>
    );
}
