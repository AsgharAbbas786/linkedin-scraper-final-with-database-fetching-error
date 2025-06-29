import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface PasswordResetProps {
  onBackToLogin: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.includes('Invalid email')) {
          setError('Please enter a valid email address.');
        } else if (error.message.includes('Email not found')) {
          setError('No account found with this email address.');
        } else {
          setError(error.message);
        }
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
          <p className="text-gray-600 mb-4">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your email and follow the instructions to reset your password.
          </p>
          <p className="text-sm text-gray-500">
            The link will expire in 1 hour for security reasons.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onBackToLogin}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Back to Sign In
          </button>
          
          <button
            onClick={() => {
              setSuccess(false);
              setEmail('');
              setError('');
            }}
            className="w-full text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Send another reset email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your email address"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !email.trim()}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          'Send Reset Link'
        )}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </button>
    </form>
  );
};