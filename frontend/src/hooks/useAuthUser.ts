import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthUser(requireAdmin = false) {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fast initial check with JWT token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (requireAdmin && payload.role !== 'SystemAdmin' && payload.role !== 'CourseAdmin') {
        navigate('/dashboard');
        return;
      }
      setUser(payload); // Set initial fast state
    } catch (e) {
      localStorage.removeItem('access_token');
      navigate('/login');
      return;
    }

    // Fetch full profile
    const fetchProfile = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setUser(data);
      } catch (e) {
        console.error('Profile fetch error', e);
      }
    };
    fetchProfile();
  }, [navigate, requireAdmin]);

  return user;
}
