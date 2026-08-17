import { Navigate, Outlet } from 'react-router-dom';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function GuestRoute() {
  const existingToken = localStorage.getItem('access_token');
  
  if (existingToken) {
    const payload = decodeJwt(existingToken);
    if (payload?.role === 'SystemAdmin' || payload?.role === 'CourseAdmin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}
