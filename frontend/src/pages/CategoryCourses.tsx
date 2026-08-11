import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';
import CategoryCourseCard from '../components/ui/CategoryCourseCard';

interface CourseData {
  course_id: number;
  title: string;
  slug: string;
  short_description: string;
  difficulty_level: string;
  price: number;
  duration_hours: number | null;
  thumbnail_key: string | null;
  course_admin?: { full_name: string; profile_image: string | null };
}

interface Category {
  category_name: string;
  description: string;
}

export default function CategoryCourses() {
  const user = useAuthUser();
  const { categorySlug } = useParams();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, coursesRes] = await Promise.all([
          fetch(`${API_URL}/categories/${categorySlug}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/courses/category/${categorySlug}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (!catRes.ok) throw new Error('Category not found');
        const catData = await catRes.json();
        setCategory(catData);
        
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (categorySlug) fetchData();
  }, [categorySlug, API_URL, token]);

  if (!user) return null;

  return (
    <StudentLayout user={user}>
      <Link to="/courses" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-8 font-bold text-sm transition-colors">
        <span className="material-symbols-outlined">arrow_back</span> Back to Categories
      </Link>

      <section className="mb-12">
        {loading ? (
          <div className="h-20 w-1/3 bg-white/20 animate-pulse rounded-2xl"></div>
        ) : (
          <>
            <h1 className="font-display-xl text-4xl md:text-5xl tracking-tight mb-4">
              {category?.category_name} Courses
            </h1>
            <p className="font-body-md text-text-secondary max-w-2xl">
              {category?.description || `Explore all published courses in the ${category?.category_name} category.`}
            </p>
          </>
        )}
      </section>

      {error && (
        <div className="bg-error/10 text-error p-4 rounded-xl mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <span className="material-symbols-outlined animate-spin-slow text-4xl text-primary mb-4 block">refresh</span>
          <p>Loading courses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white/40 border border-white rounded-3xl backdrop-blur-md">
              <span className="material-symbols-outlined text-6xl text-text-secondary mb-4 opacity-50 block">school</span>
              <h3 className="font-bold text-xl mb-2 text-on-surface">No courses available</h3>
              <p className="text-text-secondary">Check back later for new courses in this category!</p>
            </div>
          ) : (
            courses.map(course => (
              <CategoryCourseCard key={course.course_id} course={course} />
            ))
          )}
        </div>
      )}
    </StudentLayout>
  );
}
