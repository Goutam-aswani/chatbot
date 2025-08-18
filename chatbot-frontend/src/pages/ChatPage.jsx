// /chatbot-frontend/src/pages/ChatPage.jsx - Updated handleSendMessage function

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api, streamMessage } from '../services/api';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { Hand } from 'lucide-react';
import { PanelRight } from 'lucide-react';

export default function ChatPage() {
    const { token } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [textQueue, setTextQueue] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const fetchSessions = async () => {
        if (!token) return;
        setIsHistoryLoading(true);
        try {
            const data = await api.getChatSessions(token);
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [token]);

    useEffect(() => {
        if (textQueue.length === 0) {
            return;
        }

        const timerId = setTimeout(() => {
            setMessages(prevMessages => {
                const updatedMessages = [...prevMessages];
                const lastMessageIndex = updatedMessages.length - 1;

                if (lastMessageIndex >= 0) {
                    const lastMessage = updatedMessages[lastMessageIndex];
                   
                    if (lastMessage && lastMessage.role === 'model') {
                        const updatedLastMessage = {
                            ...lastMessage,
                            content: lastMessage.content + textQueue[0]
                        };
                        updatedMessages[lastMessageIndex] = updatedLastMessage;
                    }
                }
                return updatedMessages;
            });

            setTextQueue(prevQueue => prevQueue.substring(1));
        }, 5);

        return () => clearTimeout(timerId);

    }, [textQueue, messages]);

    const handleSelectSession = async (sessionId) => {
        setIsLoading(true);
        setActiveSession(sessionId);
        try {
            const data = await api.getChatHistory(token, sessionId);
            setMessages(data.messages);
        } catch (error) {
            console.error("Failed to fetch chat history:", error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveSession(null);
        setMessages([]);
    };

    // *** CHANGE: Modified handleSendMessage to capture session ID from response ***
    const handleSendMessage = async (prompt) => {
        // *** ENHANCED DEBUG: Log the current session state ***
        console.log('--- DEBUG: handleSendMessage called with activeSession:', activeSession);
       
        const optimisticUserMessage = { id: `user-${Date.now()}`, role: 'user', content: prompt };
        const botPlaceholder = { id: `model-${Date.now()}`, role: 'model', content: '' };
       
        setMessages(prev => [...prev, optimisticUserMessage, botPlaceholder]);
        setIsLoading(true);

        try {
            // *** CHANGE: Capture the response metadata from streamMessage ***
            const streamResponse = await streamMessage(
                token,
                prompt,
                activeSession, // This might be null for new conversations
                (chunk) => {
                    setTextQueue(prevQueue => prevQueue + chunk);
                }
            );

            // *** CHANGE: If a new session was created, update our activeSession state ***
            if (streamResponse && streamResponse.sessionWasCreated) {
                console.log('--- DEBUG: New session was created, updating activeSession to:', streamResponse.sessionId);
                setActiveSession(streamResponse.sessionId);
            } else if (streamResponse && streamResponse.sessionId && !activeSession) {
                // *** CHANGE: Handle case where session ID is returned but we didn't have one ***
                console.log('--- DEBUG: Received session ID, setting activeSession to:', streamResponse.sessionId);
                setActiveSession(streamResponse.sessionId);
            }

        } catch (error) {
            console.error("--- DEBUG: Failed to stream message:", error);
            setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'model') {
                    last.content = 'Error: Could not get a response from the server.';
                }
                return updated;
            });
        } finally {
            setIsLoading(false);
            // *** CHANGE: Refresh sessions list to show the new session if one was created ***
            fetchSessions();
        }
    };

    const handleDeleteSession = async (sessionId) => {
        try {
            await api.deleteChatSession(token, sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (activeSession === sessionId) {
                handleNewChat();
            }
        } catch (error) {
            console.error("Failed to delete session:", error);
        }
    };

    const handleRenameSession = async (sessionId, newTitle) => {
        try {
            const updatedSession = await api.renameChatSession(token, sessionId, newTitle);
            setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
        } catch (error) {
            console.error("Failed to rename session:", error);
        }
    };

    return (
        <div className="flex h-screen font-sans">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                sessions={sessions}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                activeSessionId={activeSession}
                isLoading={isHistoryLoading}
            />
            <ChatWindow
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
            />
        </div>
    );
};  