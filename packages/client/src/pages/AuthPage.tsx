import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../stores/authStore';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError('');
    clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }

      const success = await register(username, email, password);
      if (success) {
        navigate('/lobby');
      }
    } else {
      const success = await login(username, password);
      if (success) {
        navigate('/lobby');
      }
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-game-darker">
      {/* Background effects */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-mystical-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-human-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-display font-bold">
            <span className="text-gradient-mystical">PUN</span>
            <span className="text-gradient-human">CH</span>
          </h1>
          <p className="text-gray-500 mt-2">Enter the Arena</p>
        </div>

        {/* Auth Card */}
        <div className="card-game p-8">
          {/* Mode Tabs */}
          <div className="flex mb-8 border-b border-game-border">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 pb-4 text-center font-medium transition-colors ${
                mode === 'login'
                  ? 'text-mystical-400 border-b-2 border-mystical-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 pb-4 text-center font-medium transition-colors ${
                mode === 'register'
                  ? 'text-mystical-400 border-b-2 border-mystical-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Display */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {displayError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-6"
              isLoading={isLoading}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Password requirements for register */}
          {mode === 'register' && (
            <div className="mt-6 p-4 bg-game-dark rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Password must contain:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={password.length >= 8 ? 'text-green-500' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'text-green-500' : ''}>
                  • One lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? 'text-green-500' : ''}>
                  • One number
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
