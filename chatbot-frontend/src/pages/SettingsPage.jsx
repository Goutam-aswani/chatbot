// src/pages/SettingsPage.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Settings, ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
    const { token } = useAuth();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await api.forgotPassword(email);
            setMessage(response.message);
        } catch (err) {
            setError(err.detail || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center space-y-2">
                    <div className="bg-gray-600 p-3 rounded-full">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-center text-white">Settings</h1>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">Reset Password</h2>
                    <p className="text-sm text-gray-400">
                        Enter your email address below to receive a password reset token.
                    </p>
                    <form className="space-y-4" onSubmit={handleResetPassword}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email address"
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button type="submit" disabled={isLoading} className="w-full px-4 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 disabled:bg-gray-500">
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                    {message && <p className="text-green-400 text-sm text-center">{message}</p>}
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                </div>

                <div className="text-center">
                    <Link to="/chat" className="inline-flex items-center text-sm text-blue-400 hover:underline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Chat
                    </Link>
                </div>
            </div>
        </div>
    );
}


