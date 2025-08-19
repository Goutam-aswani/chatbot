// src/components/ChatWindow.jsx
import { Input } from "./ui/input.jsx"
import { Button } from "./ui/button"
import { useState, useEffect, useRef } from 'react';
import { ChevronRightIcon } from "lucide-react";

import { Send, MessageCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';

export default function ChatWindow({ messages, onSendMessage, isLoading }) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-background to-secondary">
            <div className="flex-1 p-6 overflow-y-auto">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-hsl(var(--muted-foreground))">
                        <MessageCircle className="w-20 h-20 mb-4 opacity-20" />
                        <h2 className="text-2xl font-semibold">Welcome to the Chatbot</h2>
                        <p className="text-hsl(var(--muted-foreground))">Start a new conversation or select one from your history.</p>
                    </div>
                )}
                {messages.map((msg) => <ChatMessage key={msg.id || Date.now()} message={msg} />)}
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                        Bot is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
                <div className="flex items-center justify-center mb-5   ">
                    {/* <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type your message..."
                        className="w-full pl-4 pr-16 py-3 text-black bg-hsl(var(--input)) border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                        rows="1"
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                    /> */}
                    <Input
                        type="text"
                        placeholder="Type your message..."
                        value={input}
                        size="sm"
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        className="flex-1 px-10 py-6 mx-20 text-left" // Add padding on the right for the button
                    />
                    <button className="p-2 text-muted-foreground hover:text-foreground  transition-colors duration-200 ease-in-out">
                        <Send className="w-6 h-6  rotate-45" />
                    </button>
                       
                </div>
            </div>
    );
};