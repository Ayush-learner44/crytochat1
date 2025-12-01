"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./home.css";

export default function HomePage() {
    const router = useRouter();

    // State
    const [username, setUsername] = useState("");
    const [keyFileBytes, setKeyFileBytes] = useState(null);
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState("");

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const inferredName = file.name.split('_')[0];
        if (inferredName && !username) setUsername(inferredName);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                if (arrayBuffer.byteLength === 0) {
                    setError("Error: Key file is empty.");
                    return;
                }
                setKeyFileBytes(new Uint8Array(arrayBuffer));
                setError("");
            } catch (err) {
                setError("Failed to read key file.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleLogin = async () => {
        // 1. Local Validation
        if (!username.trim()) {
            setError("Please enter your username.");
            return;
        }
        if (!keyFileBytes) {
            setError("Please upload your Private Key.");
            return;
        }

        // 2. SERVER CHECK: Does this user exist?
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username })
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.message || "Login failed");
                return;
            }

            // 3. SUCCESS: Proceed to Chat
            const base64Key = Buffer.from(keyFileBytes).toString('base64');
            sessionStorage.setItem("chat_session_key", base64Key);
            router.push(`/chat?user=${username.trim()}`);

        } catch (e) {
            setError("Server connection failed.");
        }
    };

    return (
        <div className="page">
            <div className="card">
                <h1 className="title">PQC Chat Login</h1>
                <p className="subtitle">Secure Identity Access</p>

                {/* USERNAME */}
                <div className="input-group">
                    <label className="input-label">Username</label>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="text-input"
                    />
                </div>

                {/* FILE UPLOAD */}
                <div className="input-group">
                    <label className="input-label">Private Key File</label>
                    <div className="file-upload-wrapper">
                        <input
                            type="file"
                            accept=".key"
                            id="file-upload"
                            onChange={handleFileUpload}
                            className="hidden-file-input"
                        />
                        <label htmlFor="file-upload" className="file-upload-button">
                            {fileName ? "📄 " + fileName : "📂 Click to Upload Key"}
                        </label>
                    </div>
                </div>

                {error && <p className="error">{error}</p>}

                <button onClick={handleLogin} className="primary-button">
                    Login to Chat
                </button>

                <div className="divider">or</div>

                <button onClick={() => router.push("/register")} className="outline-button">
                    Create New Identity
                </button>
            </div>
        </div>
    );
}