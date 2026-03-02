import { useState, FormEvent } from 'react';
import { useStore } from '../../store/useStore';
import { Layers, ArrowRight } from 'lucide-react';

export function LoginScreen() {
  const { login } = useStore();
  const [username, setUsername] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9F9F9] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-6 shadow-lg shadow-gray-900/20">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Welcome to AgileFlow
          </h1>
          <p className="text-gray-500 text-center">
            Join your team for sprint planning and daily standups.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-bold text-gray-900 ml-1">
              Your Name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., Alex Smith"
              className="w-full px-6 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all font-medium"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20"
          >
            <span>Join Team</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100">
          <p className="text-xs text-center text-gray-400 font-medium">
            AgileFlow Team Collaboration Tool
          </p>
        </div>
      </div>
    </div>
  );
}
