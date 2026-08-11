import { Link } from 'react-router-dom';

interface CategoryCourseCardProps {
  course: {
    course_id: number;
    title: string;
    slug: string;
    short_description: string;
    difficulty_level: string;
    price: number;
    duration_hours: number | null;
    thumbnail_key: string | null;
    course_admin?: { full_name: string; profile_image: string | null };
    is_enrolled?: boolean;
  };
}

export default function CategoryCourseCard({ course }: CategoryCourseCardProps) {
  return (
    <Link to={`/courses/${course.slug}`} className="group relative bg-white/60 backdrop-blur-md border border-white shadow-lg shadow-black/5 rounded-3xl p-6 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col h-full overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors"></div>
      
      {course.thumbnail_key ? (
        <img src={course.thumbnail_key} alt={course.title} className="w-full h-40 object-cover rounded-2xl mb-6 relative z-10 border border-black/5" />
      ) : (
        <div className="w-full h-40 bg-surface-container-low rounded-2xl mb-6 flex items-center justify-center relative z-10 border border-outline-variant/30">
           <span className="material-symbols-outlined text-4xl text-text-secondary opacity-50">school</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 relative z-10">
        <span className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-bold uppercase tracking-widest text-text-secondary border border-outline-variant/30">{course.difficulty_level}</span>
        {course.duration_hours && <span className="text-[10px] text-text-secondary font-label-mono uppercase tracking-widest bg-white/50 px-2 py-1 rounded">{course.duration_hours} hrs</span>}
      </div>
      
      <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2 relative z-10 leading-tight">{course.title}</h3>
      <p className="font-body-md text-text-secondary text-sm flex-grow relative z-10 opacity-80 group-hover:opacity-100 transition-opacity mb-6 line-clamp-3">
        {course.short_description}
      </p>

      <div className="flex justify-between items-center relative z-10 border-t border-outline-variant/30 pt-4 mt-auto">
        <div className="flex items-center gap-2">
          {course.course_admin && (
             <>
                <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20">
                  {course.course_admin.profile_image ? (
                     <img src={course.course_admin.profile_image} alt={course.course_admin.full_name} className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-primary text-[10px] font-bold">{course.course_admin.full_name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-on-surface">{course.course_admin.full_name}</span>
             </>
          )}
        </div>
        {course.is_enrolled ? (
          <span className="font-bold text-white bg-primary px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-primary/20 shadow-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span> Enrolled
          </span>
        ) : (
          <span className="font-bold text-primary bg-primary/5 px-3 py-1 rounded-full text-sm border border-primary/10">
            {Number(course.price) === 0 ? 'Free' : `₹${Number(course.price).toFixed(2)}`}
          </span>
        )}
      </div>
    </Link>
  );
}
