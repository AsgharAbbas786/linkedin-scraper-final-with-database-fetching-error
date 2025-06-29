import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, User } from 'lucide-react';

interface SignupProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(formData.password);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please enter your first and last name.');
      setIsLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Password does not meet the security requirements.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting to create user account...');
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        
        // Handle specific error cases with more helpful messages
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be')) {
          setError('Password does not meet the minimum requirements.');
        } else if (error.message.includes('Invalid email')) {
          setError('Please enter a valid email address.');
        } else if (error.message.includes('Database error saving new user')) {
          setError('There was a problem creating your account. This may be a temporary issue with our service. Please try again in a few moments, or contact support if the problem persists.');
        } else if (error.message.includes('unexpected_failure')) {
          setError('An unexpected error occurred while creating your account. Please try again, or contact support if this continues to happen.');
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          setError('Network connection issue. Please check your internet connection and try again.');
        } else {
          setError(`Account creation failed: ${error.message}`);
        }
        return;
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        if (data.user.email_confirmed_at) {
          // User is immediately confirmed (email confirmation disabled)
          console.log('User confirmed immediately, proceeding to app...');
          onSuccess();
        } else {
          // Email confirmation required
          console.log('Email confirmation required');
          setSuccess(true);
        }
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('network')) {
          setError('Network connection failed. Please check your internet connection and try again.');
        } else if (err.message.includes('timeout')) {
          setError('Request timed out. Please try again.');
        } else {
          setError(`An unexpected error occurred: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
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
            We've sent a confirmation link to <strong>{formData.email}</strong>. 
            Please check your email and click the link to activate your account.
          </p>
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>

        <button
          onClick={onSwitchToLogin}
          className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="First name"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Last name"
            required
            disabled={isLoading}
          />
        </div>
      </div>

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
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Create a password"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>

        {/* Password Requirements */}
        {formData.password && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-600">Password must contain:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.minLength ? 'bg-green-600' : 'bg-gray-300'}`} />
                8+ characters
              </div>
              <div className={`flex items-center gap-1 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasUpperCase ? 'bg-green-600' : 'bg-gray-300'}`} />
                Uppercase letter
              </div>
              <div className={`flex items-center gap-1 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasLowerCase ? 'bg-green-600' : 'bg-gray-300'}`} />
                Lowercase letter
              </div>
              <div className={`flex items-center gap-1 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasNumbers ? 'bg-green-600' : 'bg-gray-300'}`} />
                Number
              </div>
              <div className={`flex items-center gap-1 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'} col-span-2`}>
                <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasSpecialChar ? 'bg-green-600' : 'bg-gray-300'}`} />
                Special character (!@#$%^&*)
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Confirm your password"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <div className="mt-2 text-xs text-red-600">Passwords do not match</div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !passwordValidation.isValid || formData.password !== formData.confirmPassword || !formData.firstName.trim() || !formData.lastName.trim()}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      <div className="text-center">
        <span className="text-sm text-gray-600">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          disabled={isLoading}
        >
          Sign in
        </button>
      </div>
    </form>
  );
};