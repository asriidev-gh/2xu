'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors = {
      email: '',
      password: ''
    };
    let isValid = true;

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 3) {
      newErrors.password = 'Password must be at least 3 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validateForm()) {
      await Swal.fire({
        title: 'Validation Error',
        text: 'Please fix the errors in the form',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        allowOutsideClick: false,
        allowEscapeKey: false
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Success - redirect to dashboard
      await Swal.fire({
        title: 'Success!',
        text: 'Login successful! Redirecting to dashboard...',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 1500,
        timerProgressBar: true
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      await Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to login. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        allowOutsideClick: false,
        allowEscapeKey: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-white font-druk">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400 font-sweet-sans">
            Enter your credentials to access the dashboard
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-md">
              <p className="text-xs text-yellow-200 text-center font-sweet-sans">
                <strong>Default Credentials:</strong><br />
                Email: admin@2xu.com<br />
                Password: admin123
              </p>
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  // Clear error when user starts typing
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                }}
                onBlur={() => {
                  // Validate email on blur
                  if (formData.email && !validateEmail(formData.email.trim())) {
                    setErrors({ ...errors, email: 'Please enter a valid email address' });
                  } else {
                    setErrors({ ...errors, email: '' });
                  }
                }}
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm font-sweet-sans`}
                placeholder="Email address"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 font-sweet-sans px-3">{errors.email}</p>
            )}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  // Clear error when user starts typing
                  if (errors.password) {
                    setErrors({ ...errors, password: '' });
                  }
                }}
                onBlur={() => {
                  // Validate password on blur
                  if (formData.password && formData.password.length < 3) {
                    setErrors({ ...errors, password: 'Password must be at least 3 characters' });
                  } else {
                    setErrors({ ...errors, password: '' });
                  }
                }}
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm font-sweet-sans`}
                placeholder="Password"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500 font-sweet-sans px-3">{errors.password}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed font-fira-sans"
            >
              {isLoading ? 'Logging in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

