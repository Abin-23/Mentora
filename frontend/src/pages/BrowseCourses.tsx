import { useState, useEffect } from 'react';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';
import { Link } from 'react-router-dom';

interface CategoryData {
  category_id: number;
  category_name: string;
  description: string | null;
  icon: string | null;
  status: string;
}

export default function BrowseCourses() {
  const user = useAuthUser();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load categories');
        
        // Filter out inactive categories for students
        setCategories(data.filter((c: CategoryData) => c.status === 'Active'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [API_URL, token]);

  if (!user) return null;

  return (
    <StudentLayout user={user}>
      <section className="mb-12">
        <h1 className="font-display-xl text-5xl md:text-6xl tracking-tight mb-4">
          Browse Courses
        </h1>
        <p className="font-body-md text-text-secondary max-w-2xl">
          Explore our extensive catalog of courses organized by category. Find the perfect path to advance your career.
        </p>
      </section>

      {error && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <span className="material-symbols-outlined animate-spin-slow text-4xl text-primary mb-4 block">refresh</span>
          <p>Loading categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.length === 0 ? (
            <div className="col-span-full py-12 text-center text-text-secondary bg-white/40 rounded-3xl border border-white">
              No course categories available at the moment.
            </div>
          ) : (
            categories.map(category => (
              <Link 
                key={category.category_id} 
                to={`/courses/category/${category.category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`}
                className="group relative bg-white/60 backdrop-blur-md border border-white shadow-lg shadow-black/5 rounded-3xl p-6 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                {/* Decorative background glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors"></div>
                
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary mb-6 shrink-0 relative z-10 border border-black/5">
                  {category.icon ? (
                    category.icon.startsWith('http') ? (
                      <img src={category.icon} alt={category.category_name} className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{category.icon}</span>
                    )
                  ) : (
                    <span className="material-symbols-outlined text-3xl">category</span>
                  )}
                </div>
                
                <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2 relative z-10">
                  {category.category_name}
                </h3>
                
                <p className="font-body-md text-text-secondary text-sm flex-grow relative z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                  {category.description || 'Explore courses in this category.'}
                </p>
                
                <div className="mt-6 flex items-center gap-2 text-primary font-label-mono text-[10px] font-bold uppercase tracking-widest relative z-10 group-hover:translate-x-2 transition-transform">
                  Explore <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </StudentLayout>
  );
}
