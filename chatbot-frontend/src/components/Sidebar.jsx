import { useState, useEffect, useRef } from 'react';
// *** CHANGE: Import new icons for collapsing/expanding the sidebar ***
import { Plus, LogOut, MessageSquare, Trash2, MoreHorizontal, Pencil, Check, X, ChevronsLeft,PanelRight,User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

// The SessionItem component remains unchanged as its logic is self-contained.
const SessionItem = ({ session, onSelect, onDelete, onRename, activeSessionId }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [title, setTitle] = useState(session.title);
    const inputRef = useRef(null);
    
    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming]);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        onDelete(session.id);
    };
    
    const handleRenameClick = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        setIsRenaming(true);
    };

    const handleSaveRename = (e) => {
        e.stopPropagation();
        if (title.trim()) {
            onRename(session.id, title.trim());
            setIsRenaming(false);
        }
    };
    
    const handleCancelRename = (e) => {
        e.stopPropagation();
        setTitle(session.title);
        setIsRenaming(false);
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveRename(e);
        } else if (e.key === 'Escape') {
            handleCancelRename(e);
        }
    };
    
    const handleMenuToggle = (e) => {
        e.stopPropagation();
        setMenuOpen(prev => !prev);
    };
    
    return (
        <div className="relative group bg-secondary hover:bg-secondary/70 rounded-xl shadow-lg transition-colors duration-200 ease-in-out">
            {isRenaming ? (
                <div className="flex items-center w-full bg-hsl(var(--accent)) rounded-lg">
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-grow bg-transparent px-3 py-2 text-sm text-white outline-none"
                    />
                    <button onClick={handleSaveRename} className="p-2 text-green-400 hover:text-white"><Check className="w-4 h-4" /></button>
                    <button onClick={handleCancelRename} className="p-2 text-red-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
            ) : (
                <>
                    <button
                        onClick={() => onSelect(session.id)}
                        className={`flex items-center w-full text-left pl-3 pr-10 py-2.5 text-sm rounded-xl my-2 shadow-md truncate transition-colors duration-200 ease-in-out ${
                            activeSessionId === session.id
                            ? 'bg-primary/10 text-primary border-l-2 border-primary'
                            : 'text-muted-foreground hover:bg-accent/50'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0" />
                        <span className="truncate">{session.title}</span>
                    </button>
                    <button
                        onClick={handleMenuToggle}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground rounded-md bg-transparent opacity-0 group-hover:opacity-100 hover:text-foreground"
                        title="More options"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <div className="absolute z-10 right-0 mt-1 w-32 bg-stone-900 border border-hsl(var(--border)) rounded-md shadow-lg">
                            <button onClick={handleRenameClick} className="flex items-center w-full px-3 py-2 text-sm text-left text-hsl(var(--muted-foreground)) hover:bg-slate-700">
                                <Pencil className="w-4 h-4 mr-2" /> Rename
                            </button>
                            <button onClick={handleDeleteClick} className="flex items-center w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-red-600/20">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};


// *** CHANGE: The main Sidebar component now accepts 'isCollapsed' and 'onToggleCollapse' props ***
export default function Sidebar({ sessions, onSelectSession, onNewChat, onDeleteSession, onRenameSession, activeSessionId, isLoading, isCollapsed, onToggleCollapse }) {
    const { logout } = useAuth();
    // *** CHANGE: The local 'hide' state is removed. We now use the props from the parent. ***

    return (
        // *** CHANGE: The main div now conditionally changes its width based on the 'isCollapsed' prop. ***
        // A 'transition-all' class is added for a smooth animation.
        <div className={`bg-zinc-900 flex flex-col p-3 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            
            {/* *** CHANGE: We now render one of two views based on the collapsed state *** */}
            {isCollapsed ? (
                // --- COLLAPSED VIEW ---
                <>
                    {/* Expand Button */}
                    <button onClick={onToggleCollapse} className="p-2 text-muted-foreground hover:text-foreground mb-4 transition-colors duration-200 ease-in-out">
                        <PanelRight className="w-6 h-6" />
                    </button>
                    {/* New Chat Button (Icon Only) */}
                    <button 
                        onClick={onNewChat} 
                        className="flex items-center justify-center w-full h-12 mb-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        title="New Chat"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                    {/* Spacer to push logout to the bottom */}
                    <div className="flex-grow"></div>
                    {/* Logout Button (Icon Only) */}
                    <button 
                        onClick={logout} 
                        className="flex items-center justify-center w-full h-12 text-muted-foreground bg-secondary rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200 ease-in-out"
                        title="Logout"
                    >
                        <LogOut className="w-6 h-6" />
                    </button>
                </>
            ) : (
                // --- EXPANDED VIEW (Your original code) ---
                <>
                    {/* Profile Button */}
                    <div className="flex items-center justify-between mb-4">
                    <Link to = "/profile"
                    // onClick={() => alert('Profile Clicked')} // Placeholder action
                    className="flex items-center text-sm font-semibold text-muted-foreground hover:bg-accent/50 rounded-lg transition-colors p-3"
                    ><User className= "size-7"/>
                    <h2 className="ml-3 text-lg font-jp">Profile</h2>
                    </Link>


                    {/* Collapse Button */}
                        <button onClick={onToggleCollapse} className="flex items-center text-sm font-semibold text-muted-foreground hover:bg-accent/50 rounded-lg transition-colors p-3 ease-in-out">
                        <PanelRight className="size-6" />
                    </button>
                    </div>
                    {/* New Chat Button (With Text) */}
                    <button 
                        onClick={onNewChat} 
                        className="flex items-center justify-center w-full px-4 py-2.5 mb-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Chat 
                    </button>
                    {/* History List */}
                    <div className="flex-grow overflow-y-auto -mr-2 pr-2">
                        <h2 className="text-xs font-bold tracking-wider text-hsl(var(--muted-foreground)) uppercase mb-2 px-2">History</h2>
                        {isLoading ? (
                            <p className="text-hsl(var(--muted-foreground)) px-2">Loading...</p>
                        ) : (
                            sessions.map(session => (
                                <SessionItem
                                    key={session.id}
                                    session={session}
                                    onSelect={onSelectSession}
                                    onDelete={onDeleteSession}
                                    onRename={onRenameSession}
                                    activeSessionId={activeSessionId}
                                />
                            ))
                        )}
                    </div>

                        
                    {/* Settings Button */}
<div className="pt-2 border-t border-hsl(var(--border))">
                        <Link
                            to="/settings" // CHANGE THIS TO /settings
                            className="flex items-center justify-center w-full px-4 py-2 mt-2 text-sm font-semibold text-hsl(var(--muted-foreground)) bg-hsl(var(--secondary)) rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
                        >
                            <Settings className="w-4 h-4 mr-2" /> Settings
                        </Link>
                        {/* ... (logout button remains the same) */}
                    </div>
 {/* Theme Toggle Button */}
                    <button
 className="flex items-center w-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent/50 rounded-lg transition-colors mt-1"
 >
 Settings
 </button>
                    {/* Logout Button (With Text) */}
                    <button onClick={logout} className="flex items-center justify-center w-full px-4 py-2.5 mt-4 text-sm font-semibold text-red-500 bg-secondary rounded-lg hover:bg-red-600/20 transition-colors shadow-md">
 <LogOut className="w-4 h-4 mr-2" /> Logout
 </button>
                </>
            )}
        </div>
    );
};

