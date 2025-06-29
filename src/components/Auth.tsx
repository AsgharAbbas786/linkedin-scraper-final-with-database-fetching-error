import React, { useState } from 'react';
import { Login } from './Login';
import { Signup } from './Signup';
import { PasswordReset } from './PasswordReset';
import { Linkedin, Shield, Users, Lock } from 'lucide-react';

interface AuthProps {
  onAuthSuccess?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');

  const handleAuthSuccess = () => {
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Linkedin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">LinkedIn Scraper</h1>
                <p className="text-gray-600">Professional Data Intelligence Platform</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Unlock Professional Insights
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Extract valuable data from LinkedIn posts and profiles with our advanced scraping technology. 
                Build comprehensive databases of professional contacts and market intelligence.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Profile Intelligence</h3>
                <p className="text-sm text-gray-600">Extract detailed professional profiles with contact information, experience, and skills.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure & Compliant</h3>
                <p className="text-sm text-gray-600">Enterprise-grade security with data protection and privacy compliance built-in.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Advanced Analytics</h3>
                <p className="text-sm text-gray-600">Export data in multiple formats and integrate with your existing CRM and marketing tools.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Linkedin className="w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-xl font-bold">
                  {authMode === 'login' && 'Welcome Back'}
                  {authMode === 'signup' && 'Create Account'}
                  {authMode === 'reset' && 'Reset Password'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {authMode === 'login' && 'Sign in to access your dashboard'}
                  {authMode === 'signup' && 'Join thousands of professionals'}
                  {authMode === 'reset' && 'We\'ll send you a reset link'}
                </p>
              </div>
            </div>

            {/* Auth Content */}
            <div className="p-8">
              {authMode === 'login' && (
                <Login 
                  onSuccess={handleAuthSuccess}
                  onSwitchToSignup={() => setAuthMode('signup')}
                  onSwitchToReset={() => setAuthMode('reset')}
                />
              )}
              
              {authMode === 'signup' && (
                <Signup 
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setAuthMode('login')}
                />
              )}
              
              {authMode === 'reset' && (
                <PasswordReset 
                  onBackToLogin={() => setAuthMode('login')}
                />
              )}
            </div>
          </div>

          {/* Mobile Branding */}
          <div className="lg:hidden mt-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">LinkedIn Scraper</span>
            </div>
            <p className="text-sm text-gray-600">
              Professional Data Intelligence Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};