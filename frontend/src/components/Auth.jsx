import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, LogIn, UserPlus, Loader2, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const Auth = ({ mode, onAuthSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const validateLocal = () => {
        if (mode === 'signup') {
            if (formData.password.length < 8 || formData.password.length > 16) return "Password must be 8-16 characters";
            if (!/[A-Z]/.test(formData.password)) return "Include at least one uppercase letter";
            if (!/[a-z]/.test(formData.password)) return "Include at least one lowercase letter";
            if (!/\d/.test(formData.password)) return "Include at least one number";
            if (!/[@$!%*?&.#]/.test(formData.password)) return "Include one special character (@$!%*?&.#)";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const localError = validateLocal();
        if (localError) {
            setError(localError);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            let result;
            if (mode === 'signup') {
                result = await api.signup(formData.username, formData.email, formData.password);
            } else {
                result = await api.login(formData.email, formData.password);
            }
            onAuthSuccess(result);
        } catch (err) {
            setError(err.response?.data?.detail || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const PasswordHint = ({ label, met }) => (
        <div className={`flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider ${met ? 'text-emerald-500' : 'text-slate-600'}`}>
            {met ? <CheckCircle2 size={10} /> : <Circle size={10} />}
            <span>{label}</span>
        </div>
    );

    return (
        <div className="w-full max-w-md mx-auto p-10 rounded-[3rem] bg-slate-900 shadow-3xl border border-slate-800">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-white mb-3 tracking-tighter italic">
                    {mode === 'signup' ? 'JOIN THE GALAXY' : 'WELCOME BACK'}
                </h2>
                <p className="text-slate-500 font-medium">
                    {mode === 'signup' ? 'Create your neural baseline' : 'Re-authenticate with the universe'}
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 flex items-start space-x-3"
                >
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-tight">{error}</span>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                    <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-vpurple transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full bg-slate-950 border border-slate-800 text-white pl-14 pr-5 py-5 rounded-2xl focus:outline-none focus:border-vpurple transition-all placeholder:text-slate-700 font-bold"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>
                )}
                <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-vpurple transition-colors" size={20} />
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full bg-slate-950 border border-slate-800 text-white pl-14 pr-5 py-5 rounded-2xl focus:outline-none focus:border-vpurple transition-all placeholder:text-slate-700 font-bold"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>
                <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-vpurple transition-colors" size={20} />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full bg-slate-950 border border-slate-800 text-white pl-14 pr-5 py-5 rounded-2xl focus:outline-none focus:border-vpurple transition-all placeholder:text-slate-700 font-bold"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-3 px-2 pt-2">
                        <PasswordHint label="8-16 Characters" met={formData.password.length >= 8 && formData.password.length <= 16} />
                        <PasswordHint label="A-Z Uppercase" met={/[A-Z]/.test(formData.password)} />
                        <PasswordHint label="a-z Lowercase" met={/[a-z]/.test(formData.password)} />
                        <PasswordHint label="0-9 Number" met={/\d/.test(formData.password)} />
                        <PasswordHint label="Special Symbol" met={/[@$!%*?&.#]/.test(formData.password)} />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-vpurple hover:bg-vpurple-dark text-white font-black py-5 rounded-2xl shadow-xl shadow-vpurple/30 flex items-center justify-center space-x-3 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={24} />
                    ) : (
                        <>
                            {mode === 'signup' ? <UserPlus size={24} /> : <LogIn size={24} />}
                            <span className="text-lg tracking-tight uppercase">{mode === 'signup' ? 'Create Account' : 'Authenticate'}</span>
                        </>
                    )}
                </button>
            </form>

            <div className="mt-10 text-center">
                <button
                    onClick={() => navigate(mode === 'signup' ? '/dashboard/login' : '/dashboard/signup')}
                    className="text-slate-400 hover:text-white transition-colors text-sm font-bold flex items-center justify-center space-x-2 mx-auto"
                >
                    <span>{mode === 'signup' ? 'Already have an account?' : 'Need to register?'}</span>
                    <span className="text-vpurple-light hover:underline underline-offset-4">
                        {mode === 'signup' ? 'Log In' : 'Sign Up'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Auth;
