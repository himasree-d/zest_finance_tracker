import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginSchema } from '../../lib/validations';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import type { z } from 'zod';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.auth.login(data);
      setUser(response.user);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-body)' }}>

      {/* Subtle background blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(45,125,111,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <span className="text-4xl font-mono font-bold tracking-tight text-white flex items-center">
            ZEST<span className="text-5xl leading-[0] -mt-2 text-electric-500">.</span>
          </span>
        </div>
        <h2 className="mt-4 text-center text-xl font-medium text-slate-400">
          Your finances, under control.
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-slide-up">
        <div className="glass py-8 px-4 sm:rounded-2xl sm:px-10 shadow-modal">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5" style={{ color: '#9E9A93' }} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-sm text-rose-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5" style={{ color: '#9E9A93' }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none transition-colors"
                    style={{ color: '#9E9A93' }}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-rose-500">{errors.password.message}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#706C65' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold transition-colors"
                style={{ color: '#2D7D6F' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1F5F55')}
                onMouseLeave={e => (e.currentTarget.style.color = '#2D7D6F')}>
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}