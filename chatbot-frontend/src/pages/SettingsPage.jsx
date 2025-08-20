// // THIS IS THE OLD SETTINGS PAGE
// import { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { api } from '../services/api';
// import { Settings, ArrowLeft } from 'lucide-react';

// export default function SettingsPage() {
//     const { token } = useAuth();
//     const [email, setEmail] = useState('');
//     const [message, setMessage] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     const handleResetPassword = async (e) => {
//         e.preventDefault();
//         setError('');
//         setMessage('');
//         setIsLoading(true);

//         try {
//             const response = await api.forgotPassword(email);
//             setMessage(response.message);
//         } catch (err) {
//             setError(err.detail || 'An error occurred.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="flex items-center justify-center h-screen bg-gray-900 text-white p-4">
//             <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl">
//                 <div className="flex flex-col items-center space-y-2">
//                     <div className="bg-gray-600 p-3 rounded-full">
//                         <Settings className="w-8 h-8 text-white" />
//                     </div>
//                     <h1 className="text-2xl font-bold text-center text-white">Settings</h1>
//                 </div>

//                 <div className="space-y-4">
//                     <h2 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">Reset Password</h2>
//                     <p className="text-sm text-gray-400">
//                         Enter your email address below to receive a password reset token.
//                     </p>
//                     <form className="space-y-4" onSubmit={handleResetPassword}>
//                         <input
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             placeholder="Your email address"
//                             className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             required
//                         />
//                         <button type="submit" disabled={isLoading} className="w-full px-4 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 disabled:bg-gray-500">
//                             {isLoading ? 'Sending...' : 'Send Reset Link'}
//                         </button>
//                     </form>
//                     {message && <p className="text-green-400 text-sm text-center">{message}</p>}
//                     {error && <p className="text-red-400 text-sm text-center">{error}</p>}
//                 </div>

//                 <div className="text-center">
//                     <Link to="/chat" className="inline-flex items-center text-sm text-blue-400 hover:underline">
//                         <ArrowLeft className="w-4 h-4 mr-2" />
//                         Back to Chat
//                     </Link>
//                 </div>
//             </div>
//         </div>
//     );
// }

import { useState,useEffect } from 'react';
import { 
  Settings, 
  ArrowLeft, 
  User, 
  MessageSquare, 
  Bell, 
  Shield, 
  Palette,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Key,
  Globe,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
  // Form states
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const navigate = useNavigate();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [handleSaveProfile, setHandleSaveProfile] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Settings states
  const [settings, setSettings] = useState({
    // Account
    name: '',
    email: '',
    
    // Chat
    language: 'en',
    saveHistory: true,
    autoSave: true,
    messageSound: true,
    typingIndicator: true,
    
    // Notifications
    pushNotifications: true,
    emailNotifications: 'important',
    soundNotifications: true,
    desktopNotifications: true,
    
    // Privacy
    twoFactorAuth: false,
    onlineStatus: true,
    readReceipts: true,
    lastSeen: true,
    
    // Appearance
    theme: 'dark',
    fontSize: 'medium',
    messageLayout: 'comfortable',
    chatBackground: 'default'
  });
  
  // UI states
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);


  useEffect(() => {
        const fetchProfile = async () => {
            setIsProfileLoading(true);
            try {
                const profileData = await api.getUserProfile(token);
                setSettings(prev => ({
                    ...prev,
                    full_name: profileData.full_name || '',
                    email: profileData.email || ''
                }));
            } catch (err) {
                setError('Could not load your profile data.');
            } finally {
                setIsProfileLoading(false);
            }
        };


    const handleSaveProfile = async () => {
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            const profileData = {
                full_name: settings.full_name,
                email: settings.email
            };
            await api.updateUserProfile(token, profileData);
            setMessage('Profile updated successfully!');
        } catch (err) {
            setError(err.detail || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

        fetchProfile();
    }, [token]);



  
  const handleResetPassword = async () => {
    if (!email) return;
    
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      // Replace with your actual API call
      // const response = await api.forgotPassword(email);
      // setMessage(response.message);
      setMessage('Password reset link sent to your email');
      setEmail('');
    } catch (err) {
      setError(err.detail || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (!currentPassword || !newPassword) {
      setError('Please fill in all password fields');
      return;
    }
    
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      // Replace with your actual API call
      // await api.changePassword(currentPassword, newPassword);
      setMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.detail || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };




  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Add your API call here to save settings
    console.log(`Setting ${key} changed to:`, value);
  };

  const handleClearHistory = async () => {
    if (confirmAction !== 'clearHistory') {
      setConfirmAction('clearHistory');
      setTimeout(() => setConfirmAction(null), 5000);
      return;
    }
    
    setIsLoading(true);
    try {
      // await api.clearChatHistory();
      setMessage('Chat history cleared successfully');
      setConfirmAction(null);
    } catch (err) {
      setError('Failed to clear chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadData = async () => {
    setIsLoading(true);
    try {
      // await api.downloadUserData();
      setMessage('Data download will begin shortly');
    } catch (err) {
      setError('Failed to download data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToChat = () => {
    navigate('/chat');
    // Replace with your navigation logic
    // console.log('Navigate back to chat');
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-blue-600' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const Select = ({ value, onChange, options, placeholder = 'Select...' }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">Profile Information</h3>
                {isProfileLoading ? (
                    <p className="text-gray-400">Loading profile...</p>
                ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                        <input
                            type="text"
                            value={settings.full_name} // BIND to full_name
                            onChange={(e) => handleSettingChange('full_name', e.target.value)} // UPDATE full_name
                            placeholder="Enter your name"
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            value={settings.email}
                            onChange={(e) => handleSettingChange('email', e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="pt-2">
                         <button
                            onClick={handleSaveProfile}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500"
                        >
                            {isLoading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </>
                )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">Change Password</h3>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-10 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-9 text-gray-400 hover:text-white"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-10 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-9 text-gray-400 hover:text-white"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-10 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-9 text-gray-400 hover:text-white"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500"
                >
                  {isLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">Reset Password</h3>
              <p className="text-sm text-gray-400">
                Enter your email address below to receive a password reset token.
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-500"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <Select
                value={settings.language}
                onChange={(value) => handleSettingChange('language', value)}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'hi', label: 'Hindi' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' }
                ]}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Save Chat History</span>
                <p className="text-sm text-gray-400">Store your conversation history</p>
              </div>
              <ToggleSwitch
                checked={settings.saveHistory}
                onChange={(checked) => handleSettingChange('saveHistory', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Auto-save Conversations</span>
                <p className="text-sm text-gray-400">Automatically save ongoing chats</p>
              </div>
              <ToggleSwitch
                checked={settings.autoSave}
                onChange={(checked) => handleSettingChange('autoSave', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Message Sounds</span>
                <p className="text-sm text-gray-400">Play sound when receiving messages</p>
              </div>
              <ToggleSwitch
                checked={settings.messageSound}
                onChange={(checked) => handleSettingChange('messageSound', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Typing Indicator</span>
                <p className="text-sm text-gray-400">Show when you're typing</p>
              </div>
              <ToggleSwitch
                checked={settings.typingIndicator}
                onChange={(checked) => handleSettingChange('typingIndicator', checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message Layout</label>
              <Select
                value={settings.messageLayout}
                onChange={(value) => handleSettingChange('messageLayout', value)}
                options={[
                  { value: 'compact', label: 'Compact' },
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'spacious', label: 'Spacious' }
                ]}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Push Notifications</span>
                <p className="text-sm text-gray-400">Receive push notifications</p>
              </div>
              <ToggleSwitch
                checked={settings.pushNotifications}
                onChange={(checked) => handleSettingChange('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Sound Notifications</span>
                <p className="text-sm text-gray-400">Play notification sounds</p>
              </div>
              <ToggleSwitch
                checked={settings.soundNotifications}
                onChange={(checked) => handleSettingChange('soundNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Desktop Notifications</span>
                <p className="text-sm text-gray-400">Show desktop notifications</p>
              </div>
              <ToggleSwitch
                checked={settings.desktopNotifications}
                onChange={(checked) => handleSettingChange('desktopNotifications', checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Notifications</label>
              <Select
                value={settings.emailNotifications}
                onChange={(value) => handleSettingChange('emailNotifications', value)}
                options={[
                  { value: 'all', label: 'All notifications' },
                  { value: 'important', label: 'Important only' },
                  { value: 'none', label: 'None' }
                ]}
              />
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Two-Factor Authentication</span>
                <p className="text-sm text-gray-400">Add extra security to your account</p>
              </div>
              <ToggleSwitch
                checked={settings.twoFactorAuth}
                onChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Online Status</span>
                <p className="text-sm text-gray-400">Show when you're online</p>
              </div>
              <ToggleSwitch
                checked={settings.onlineStatus}
                onChange={(checked) => handleSettingChange('onlineStatus', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Read Receipts</span>
                <p className="text-sm text-gray-400">Let others know you've read messages</p>
              </div>
              <ToggleSwitch
                checked={settings.readReceipts}
                onChange={(checked) => handleSettingChange('readReceipts', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-white font-medium">Last Seen</span>
                <p className="text-sm text-gray-400">Show when you were last active</p>
              </div>
              <ToggleSwitch
                checked={settings.lastSeen}
                onChange={(checked) => handleSettingChange('lastSeen', checked)}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-600">
              <h3 className="text-lg font-semibold text-white">Data Management</h3>
              
              <button
                onClick={handleDownloadData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500"
              >
                <Download size={18} />
                <span>Download My Data</span>
              </button>

              <button
                onClick={handleClearHistory}
                disabled={isLoading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:bg-gray-500 ${
                  confirmAction === 'clearHistory'
                    ? 'bg-red-700 text-white'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <Trash2 size={18} />
                <span>
                  {confirmAction === 'clearHistory' ? 'Click again to confirm' : 'Clear Chat History'}
                </span>
              </button>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
              <Select
                value={settings.theme}
                onChange={(value) => handleSettingChange('theme', value)}
                options={[
                  { value: 'dark', label: '🌙 Dark' },
                  { value: 'light', label: '☀️ Light' },
                  { value: 'auto', label: '🖥️ System' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
              <Select
                value={settings.fontSize}
                onChange={(value) => handleSettingChange('fontSize', value)}
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                  { value: 'extra-large', label: 'Extra Large' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Chat Background</label>
              <Select
                value={settings.chatBackground}
                onChange={(value) => handleSettingChange('chatBackground', value)}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'gradient', label: 'Gradient' },
                  { value: 'pattern', label: 'Pattern' },
                  { value: 'image', label: 'Custom Image' }
                ]}
              />
            </div>

            <div className="pt-4 border-t border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
              <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">AI</span>
                  </div>
                  <div className="flex-1">
                    <div className={`p-3 rounded-lg bg-gray-600 text-${settings.fontSize === 'small' ? 'sm' : settings.fontSize === 'large' ? 'lg' : 'base'}`}>
                      This is how your messages will appear with the current settings.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToChat}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-gray-600 p-3 rounded-full">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>
        </div>

        {/* Message/Error Display */}
        {(message || error) && (
          <div className={`p-4 rounded-lg mb-6 ${message ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {message || error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}