import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import AssessmentTaker from '../components/assessments/AssessmentTaker';

export default function TakeAssessmentPage() {
  const user = useAuthUser();
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // If there's a returnUrl in state, we go there, otherwise we fallback to /my-learning
  const returnUrl = location.state?.returnUrl || '/my-learning';

  if (!user) return null;
  
  if (!assessmentId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
         <div className="p-10 text-center text-error">Invalid assessment ID</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl h-[calc(100vh-64px)]">
         <AssessmentTaker 
           assessmentId={Number(assessmentId)} 
           onClose={() => navigate(returnUrl)} 
         />
      </div>
    </div>
  );
}
