import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const navLinkClasses = ({ isActive }) =>
  [
    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-100 hover:bg-indigo-500/20 hover:text-white',
  ].join(' ');

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          airesume<span className="text-indigo-400">.studio</span>
        </Link>
        <nav className="hidden items-center gap-2 sm:flex">
          <NavLink to="/" className={navLinkClasses} end>
            Home
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className={navLinkClasses}>
                Dashboard
              </NavLink>
              <NavLink to="/portfolio" className={navLinkClasses}>
                Portfolio
              </NavLink>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <span className="hidden text-sm text-slate-200 sm:inline-flex">
                Hi, {user.name.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
