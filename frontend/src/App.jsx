import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  Link,
  useNavigate,
} from 'react-router-dom';

// --- SVG Icons ---

// Sparkle Icon for AI buttons
const SparkleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v.01M21.07 4.93l-.01.01M3 12h.01M4.93 19.07l-.01.01M12 20.99v.01M19.07 4.93l.01.01M4.93 4.93l.01.01M20.99 12h.01M19.07 19.07l.01.01M12 9.5l-1.22 2.5-2.5 1.22 2.5 1.22L12 17l1.22-2.5 2.5-1.22-2.5-1.22L12 9.5z" />
  </svg>
);

// Loading Spinner Icon
const LoadingSpinner = () => (
  <svg
    className="animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// Trash Icon
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
  </svg>
);

// --- End SVG Icons ---

// --- API Service (Mock) ---
// In a real app, this would be in /services/api.js
// It would use Axios and have the backend URL from .env
const api = {
  login: async (email, password) => {
    console.log('API CALL: login', { email, password });
    await new Promise(res => setTimeout(res, 500));
    // Simulate successful login
    return { token: 'fake-jwt-token', user: { name: 'Jane Doe', email } };
  },
  register: async (name, email, password) => {
    console.log('API CALL: register', { name, email, password });
    await new Promise(res => setTimeout(res, 500));
    // Simulate successful registration
    return { token: 'fake-jwt-token', user: { name, email } };
  },
  getResumes: async (token) => {
    console.log('API CALL: getResumes', { token });
    await new Promise(res => setTimeout(res, 500));
    // Simulate fetching resumes
    return [
      { id: '1', title: 'Software Engineer Resume' },
      { id: '2', title: 'Product Manager Resume (Draft)' },
    ];
  },
  getResume: async (id, token) => {
    console.log('API CALL: getResume', { id, token });
     await new Promise(res => setTimeout(res, 500));
    // Simulate fetching a single resume
    return {
      id: '1',
      title: 'Software Engineer Resume',
      personalInfo: {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '555-123-4567',
        linkedin: 'linkedin.com/in/janedoe',
        summary: 'Driven software developer with 3 years of experience in React and Node.js.',
      },
      experiences: [
        {
          id: 1,
          title: 'Software Engineer',
          company: 'TechCorp',
          years: '2021 - Present',
          description: '- Worked on the main product.\n- Used React for the frontend.\n- Fixed bugs.',
        },
      ],
    };
  },
  saveResume: async (resumeData, token) => {
     console.log('API CALL: saveResume', { resumeData, token });
     await new Promise(res => setTimeout(res, 500));
     // Simulate saving
     return { ...resumeData, updatedAt: new Date().toISOString() };
  }
};

// --- Authentication Context ---
// In a real app, this would be in /context/AuthContext.js
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // In real app, check localStorage here
  const [loading, setLoading] = useState(false); // Can be used for initial auth check

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    setUser(user);
    // In real app: localStorage.setItem('token', token);
  };

  const register = async (name, email, password) => {
    const { token, user } = await api.register(name, email, password);
    setToken(token);
    setUser(user);
    // In real app: localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // In real app: localStorage.removeItem('token');
  };

  const authValue = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  return useContext(AuthContext);
};

// --- Protected Route Component ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>; // Or a full-page spinner
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// --- Main Layout Component ---
const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center text-2xl font-bold text-indigo-600">
                AI Resume
              </Link>
            </div>
            <div className="flex items-center">
              {user ? (
                <>
                  <span className="mr-4 text-sm text-gray-700 hidden sm:block">Welcome, {user.name}!</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

// --- Pages ---

// --- Login Page ---
// In a real app, this would be in /pages/Login.jsx
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg mt-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-name" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner /> : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Register Page ---
// In a real app, this would be in /pages/Register.jsx
const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to register. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg mt-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="rounded-md shadow-sm space-y-3">
             <div>
              <label htmlFor="name" className="sr-only">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address-reg"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-reg" className="sr-only">Password</label>
              <input
                id="password-reg"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner /> : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Dashboard Page ---
// In a real app, this would be in /pages/Dashboard.jsx
const DashboardPage = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const data = await api.getResumes(token);
        setResumes(data);
      } catch (err) {
        console.error("Failed to fetch resumes");
      }
      setLoading(false);
    };
    fetchResumes();
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
        <button
          onClick={() => navigate('/editor/new')}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700"
        >
          + Create New Resume
        </button>
      </div>
      
      {loading ? (
        <p>Loading resumes...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {resumes.map(resume => (
              <li key={resume.id} className="p-6 flex justify-between items-center hover:bg-gray-50">
                <span className="text-lg font-medium text-gray-800">{resume.title}</span>
                <Link
                  to={`/editor/${resume.id}`}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


// --- Resume Editor Component ---
// This is the component from the previous step
const ResumeEditor = ({ resumeId }) => {
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', linkedin: '', summary: '' });
  const [experiences, setExperiences] = useState([]);
  const [title, setTitle] = useState('New Resume');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { token } = useAuth();

  const [loadingAI, setLoadingAI] = useState({});
  const [error, setError] = useState(null);

  // Fetch resume data on load
  useEffect(() => {
    if (resumeId === 'new') {
      setPersonalInfo({ name: 'Your Name', email: 'your.email@example.com', phone: '', linkedin: '', summary: '' });
      setExperiences([{ id: 1, title: '', company: '', years: '', description: '' }]);
      setTitle('Untitled Resume');
      setLoading(false);
    } else {
      const fetchResume = async () => {
        setLoading(true);
        try {
          const data = await api.getResume(resumeId, token);
          setPersonalInfo(data.personalInfo);
          setExperiences(data.experiences);
          setTitle(data.title);
        } catch (err) {
          setError('Failed to load resume data.');
        }
        setLoading(false);
      };
      fetchResume();
    }
  }, [resumeId, token]);
  
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const resumeData = { id: resumeId === 'new' ? null : resumeId, title, personalInfo, experiences };
      await api.saveResume(resumeData, token);
      // In a real app, show a toast notification
      alert("Resume Saved!");
    } catch (err) {
      setError("Failed to save resume.");
    }
    setIsSaving(false);
  };

  /**
   * Exponential backoff retry logic for API calls.
   */
  const fetchWithRetry = useCallback(async (url, options, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Client error: ${response.status} ${response.statusText}`);
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (err) {
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      } else {
        console.error("API call failed after retries:", err);
        throw err;
      }
    }
  }, []);

  /**
   * Calls the Gemini API to get suggestions.
   */
  const callGeminiAPI = useCallback(async (textToImprove) => {
    // --- FOR DEMONSTRATION: We call the Gemini API directly ---
    // In a real app, this would call your backend proxy: /api/ai/suggest
    const apiKey = ""; // Leave as-is.
    const model = "gemini-2.5-flash-preview-09-2025";
    const demoApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const systemPrompt = "You are an expert resume writer. Rewrite the following job description bullet points to be professional, concise, and action-oriented. Use strong verbs and quantify achievements where possible. Respond with *only* the rewritten bullet points.";

    const payload = {
      contents: [{ parts: [{ text: textToImprove }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
    };

    try {
      const result = await fetchWithRetry(demoApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const candidate = result.candidates?.[0];
      if (candidate && candidate.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
      } else {
        throw new Error("Invalid response structure from AI API.");
      }
    } catch (err) {
      console.error('Error calling Gemini API:', err);
      setError('Failed to get AI suggestion. Please try again.');
      throw err; // Re-throw to be caught by the caller
    }
  }, [fetchWithRetry]);

  /**
   * Handles the "AI Suggest" button click for an experience item.
   */
  const handleAISuggestion = async (experienceId) => {
    setError(null);
    setLoadingAI(prev => ({ ...prev, [experienceId]: true }));

    const experience = experiences.find(exp => exp.id === experienceId);
    if (!experience) return;

    try {
      const improvedDescription = await callGeminiAPI(experience.description);
      setExperiences(prevExperiences =>
        prevExperiences.map(exp =>
          exp.id === experienceId
            ? { ...exp, description: improvedDescription }
            : exp
        )
      );
    } catch (err) {
      // Error is already logged and set in callGeminiAPI
    } finally {
      setLoadingAI(prev => ({ ...prev, [experienceId]: false }));
    }
  };

  // --- Form Input Handlers ---
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleExperienceChange = (id, e) => {
    const { name, value } = e.target;
    setExperiences(prevExperiences =>
      prevExperiences.map(exp =>
        exp.id === id ? { ...exp, [name]: value } : exp
      )
    );
  };

  const addExperience = () => {
    setExperiences(prev => [
      ...prev,
      {
        id: Date.now(),
        title: '',
        company: '',
        years: '',
        description: '',
      },
    ]);
  };

  const removeExperience = (id) => {
    setExperiences(prev => prev.filter(exp => exp.id !== id));
  };
  
  if (loading) {
    return <div className="text-center p-10">Loading Editor...</div>
  }

  // --- Render ---
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* --- Title --- */}
      <input 
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 bg-transparent border-b-2 border-transparent focus:border-indigo-500 focus:outline-none w-full"
      />

      {/* --- Personal Info Section --- */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="name" id="name" value={personalInfo.name} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" id="email" value={personalInfo.email} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" name="phone" id="phone" value={personalInfo.phone} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
            <input type="text" name="linkedin" id="linkedin" value={personalInfo.linkedin} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
            <textarea name="summary" id="summary" rows="4" value={personalInfo.summary} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>
      </div>

      {/* --- Experience Section --- */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Work Experience</h2>
        <div className="space-y-6">
          {experiences.map((exp) => (
            <div key={exp.id} className="bg-white p-6 sm:p-8 rounded-xl shadow-lg relative">
              <button
                onClick={() => removeExperience(exp.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove experience"
              >
                <TrashIcon />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor={`title-${exp.id}`} className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input type="text" name="title" id={`title-${exp.id}`} value={exp.title} onChange={(e) => handleExperienceChange(exp.id, e)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor={`company-${exp.id}`} className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input type="text" name="company" id={`company-${exp.id}`} value={exp.company} onChange={(e) => handleExperienceChange(exp.id, e)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`years-${exp.id}`} className="block text-sm font-medium text-gray-700 mb-1">Years</label>
                  <input type="text" name="years" id={`years-${exp.id}`} value={exp.years} onChange={(e) => handleExperienceChange(exp.id, e)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`description-${exp.id}`} className="block text-sm font-medium text-gray-700 mb-1">Description (use bullet points)</label>
                  <textarea
                    name="description"
                    id={`description-${exp.id}`}
                    rows="5"
                    value={exp.description}
                    onChange={(e) => handleExperienceChange(exp.id, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="- Developed feature X, resulting in Y...&#10;- Led a team of Z..."
                  ></textarea>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    onClick={() => handleAISuggestion(exp.id)}
                    disabled={loadingAI[exp.id]}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAI[exp.id] ? <LoadingSpinner /> : <SparkleIcon />}
                    {loadingAI[exp.id] ? 'Improving...' : 'AI Improve Description'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addExperience}
          className="mt-6 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
        >
          + Add Experience
        </button>
      </div>

      {/* --- Save Button --- */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
         <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50"
         >
          {isSaving ? <LoadingSpinner /> : 'Save Resume'}
        </button>
      </div>
    </div>
  );
};

// --- Editor Page (Wrapper) ---
// In a real app, this would be in /pages/Editor.jsx
const EditorPage = () => {
  // This component would use react-router-dom's `useParams`
  // to get the resume ID from the URL.
  // For this demo, we'll hardcode it, but show how it would work.
  
  // const { resumeId } = useParams(); // <-- How you'd get it in a real app
  
  // Mocking URL detection
  const resumeId = window.location.pathname.split('/')[2] || 'new'; 
  
  return <ResumeEditor resumeId={resumeId} />;
};


// --- App Router ---
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace /> // Or a landing page
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'editor/:resumeId',
        element: (
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

// --- Main App Component ---
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
