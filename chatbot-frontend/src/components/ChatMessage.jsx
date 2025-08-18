// src/components/ChatMessage.jsx

import { useState } from 'react';
import { Bot, User, Clipboard, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

// --- Custom Code Block Component ---
const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';

    const handleCopy = () => {
        const codeString = String(children).replace(/\n$/, '');
        navigator.clipboard.writeText(codeString);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    };

    if (inline) {
        // Style for inline code snippets
        return <code className="bg-gray-700 text-sm rounded px-1 py-0.5">{children}</code>;
    }

    return (
        <div className="bg-gray-900/70 rounded-lg my-4 overflow-hidden border border-gray-700">
            <div className="flex justify-between items-center px-4 py-1.5 bg-gray-800">
                <span className="text-xs font-sans text-gray-400">{language}</span>
                <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors">
                    {isCopied ? (
                        <span className="flex items-center text-xs text-green-400">
                            <Check className="w-4 h-4 mr-1" /> Copied!
                        </span>
                    ) : (
                        <span className="flex items-center text-xs">
                            <Clipboard className="w-4 h-4 mr-1" /> Copy
                        </span>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm" {...props}>
                <code>{children}</code>
            </pre>
        </div>
    );
};


export default function ChatMessage({ message }) {
    const isUser = message.role === 'user';
    
    return (
        <div className={`flex items-start gap-4 my-4 fade-in ${isUser ? 'justify-end' : ''}`}>
            {!isUser && 
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-6 h-6 text-white"/>
                </div>
            }
            <div className={`max-w-none p-4 rounded-2xl shadow-md ${isUser ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                <ReactMarkdown
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                        pre: CodeBlock,
                        p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    }}
                >
                    {message.content}
                </ReactMarkdown>
            </div>
            {isUser && 
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-5 h-5 text-white"/>
                </div>
            }
        </div>
    );
};
