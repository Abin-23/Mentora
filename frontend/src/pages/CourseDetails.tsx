import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';

interface Topic {
  topic_id: number;
  topic_title: string;
  topic_description: string;
  difficulty_level: string;
  estimated_duration: number | null;
}

interface CourseDetails {
  course_id: number;
  title: string;
  short_description: string;
  description: string;
  learning_objectives: string;
  prerequisites: string | null;
  difficulty_level: string;
  price: string;
  duration_hours: string | null;
  thumbnail_key: string | null;
  course_admin?: { full_name: string };
  topics: Topic[];
  is_enrolled?: boolean;
}

export default function CourseDetails() {
  const user = useAuthUser();
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_URL}/courses/${courseSlug}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Course not found');
        const data = await res.json();
        setCourse(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (courseSlug) fetchCourse();
  }, [courseSlug, API_URL, token]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleEnrollment = async () => {
    if (!course) return;
    setEnrolling(true);
    setError('');
    const price = Number(course.price);

    try {
      if (price === 0) {
        // Free enrollment
        const res = await fetch(`${API_URL}/enrollments/free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ courseId: course.course_id })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to enroll');
        alert('Enrolled successfully!');
        navigate('/my-learning');
      } else {
        // Paid enrollment via Razorpay
        const resLoaded = await loadRazorpay();
        if (!resLoaded) throw new Error('Razorpay SDK failed to load');

        const orderRes = await fetch(`${API_URL}/purchases/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ courseId: course.course_id })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.message || 'Failed to create order');

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy',
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Mentora',
          description: `Purchase ${course.title}`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch(`${API_URL}/purchases/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed');
              alert('Payment successful! You are now enrolled.');
              navigate('/my-learning');
            } catch (err: any) {
              alert(err.message);
            }
          },
          prefill: {
            name: user?.full_name,
            email: user?.email,
          },
          theme: {
            color: '#16a34a'
          }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (!user) return null;

  return (
    <StudentLayout user={user}>
      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>
      ) : error ? (
        <div className="text-error bg-error/10 p-4 rounded-xl">{error}</div>
      ) : course ? (
        <div className="max-w-4xl mx-auto pb-20">
          <button onClick={() => navigate(-1)} className="flex items-center text-text-secondary hover:text-primary mb-6 transition-colors font-bold text-sm">
            <span className="material-symbols-outlined mr-1">arrow_back</span> Back
          </button>
          
          <div className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-black/5 border border-outline-variant/30 mb-8">
            {course.thumbnail_key && (
              <div className="w-full h-64 md:h-80 bg-surface-container-low relative">
                <img src={course.thumbnail_key} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 inline-block shadow-lg">{course.difficulty_level}</span>
                  <h1 className="font-display-xl text-3xl md:text-5xl tracking-tight leading-tight">{course.title}</h1>
                </div>
              </div>
            )}
            
            <div className="p-6 md:p-10 flex flex-col md:flex-row gap-10">
              <div className="flex-1 space-y-8">
                {!course.thumbnail_key && (
                  <div>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 inline-block">{course.difficulty_level}</span>
                    <h1 className="font-display-xl text-3xl md:text-4xl tracking-tight mb-2">{course.title}</h1>
                  </div>
                )}
                
                <div>
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">info</span> About this course</h3>
                  <p className="text-text-secondary leading-relaxed">{course.description}</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> Learning Objectives</h3>
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">{course.learning_objectives}</p>
                </div>
                
                {course.prerequisites && (
                  <div>
                    <h3 className="font-bold text-xl mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">assignment_late</span> Prerequisites</h3>
                    <p className="text-text-secondary leading-relaxed">{course.prerequisites}</p>
                  </div>
                )}
                
                {course.topics && course.topics.length > 0 && (
                  <div>
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">format_list_bulleted</span> Course Content</h3>
                    <div className="space-y-3">
                      {course.topics.map((topic, i) => (
                        <div key={topic.topic_id} className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">{i + 1}</div>
                          <div>
                            <h4 className="font-bold text-on-surface">{topic.topic_title}</h4>
                            {topic.topic_description && <p className="text-sm text-text-secondary mt-1">{topic.topic_description}</p>}
                            <div className="flex gap-4 mt-2">
                              <span className="text-xs font-bold text-text-secondary bg-surface-container-low px-2 py-0.5 rounded">{topic.difficulty_level}</span>
                              {topic.estimated_duration && <span className="text-xs text-text-secondary font-medium">{topic.estimated_duration} Hrs</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="md:w-80 shrink-0">
                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 sticky top-24 shadow-lg shadow-black/5">
                  <div className="text-4xl font-display-lg font-bold text-primary mb-2">
                    {Number(course.price) === 0 ? 'Free' : `₹${Number(course.price).toFixed(2)}`}
                  </div>
                  {course.duration_hours && (
                    <div className="flex items-center gap-2 text-text-secondary mb-6 font-medium">
                      <span className="material-symbols-outlined text-sm">schedule</span> {course.duration_hours} Hours total
                    </div>
                  )}
                  
                  {course.is_enrolled ? (
                    <div className="w-full py-4 rounded-xl bg-primary/10 text-primary font-bold text-lg text-center flex justify-center items-center gap-2 border border-primary/20">
                      <span className="material-symbols-outlined">check_circle</span> You are enrolled
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={handleEnrollment} 
                        disabled={enrolling}
                        className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-md hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                      >
                        {enrolling ? (
                          <><span className="material-symbols-outlined animate-spin">refresh</span> Processing...</>
                        ) : (
                          <>{Number(course.price) === 0 ? 'Enroll for Free' : 'Buy Now'}</>
                        )}
                      </button>
                      <p className="text-xs text-center text-text-secondary mt-4">Full lifetime access. 30-day money-back guarantee.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </StudentLayout>
  );
}
