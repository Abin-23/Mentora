import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers';
import ManageCategories from './pages/ManageCategories';
import ManageCourses from './pages/ManageCourses';
import BrowseCourses from './pages/BrowseCourses';
import CategoryCourses from './pages/CategoryCourses';
import ManageCourseTopics from './pages/ManageCourseTopics';
import ManageTopicResources from './pages/ManageTopicResources';
import ManageAssessments from './pages/ManageAssessments';
import Profile from './pages/Profile';
import CourseDetails from './pages/CourseDetails';
import CoursePlayer from './pages/CoursePlayer';
import MyLearning from './pages/MyLearning';
import TakeAssessmentPage from './pages/TakeAssessmentPage';

import GuestRoute from './components/layout/GuestRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<BrowseCourses />} />
        <Route path="/courses/:courseSlug" element={<CourseDetails />} />
        <Route path="/courses/category/:categorySlug" element={<CategoryCourses />} />
        <Route path="/learn/:courseSlug" element={<CoursePlayer />} />
        <Route path="/assessments/:assessmentId/take" element={<TakeAssessmentPage />} />
        <Route path="/my-learning" element={<MyLearning />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/categories" element={<ManageCategories />} />
        <Route path="/admin/courses" element={<ManageCourses />} />
        <Route path="/admin/courses/:courseId/topics" element={<ManageCourseTopics />} />
        <Route path="/admin/courses/:courseId/assessments" element={<ManageAssessments />} />
        <Route path="/admin/topics/:topicId/resources" element={<ManageTopicResources />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
