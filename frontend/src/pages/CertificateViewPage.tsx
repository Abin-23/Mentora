import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function CertificateViewPage() {
  const { credentialId } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const verificationUrl = `${window.location.origin}/certificate/${credentialId}`;

  useEffect(() => {
    const verifyCert = async () => {
      try {
        const res = await fetch(`${API_URL}/certificates/verify/${credentialId}`);
        if (!res.ok) throw new Error('Invalid or unverified certificate.');
        const data = await res.json();
        setCert(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (credentialId) verifyCert();
  }, [credentialId, API_URL]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
         <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-6">
         <span className="material-symbols-outlined text-6xl text-error mb-4">gpp_bad</span>
         <h1 className="text-2xl font-bold mb-2 text-on-surface">Verification Failed</h1>
         <p className="text-text-secondary">{error}</p>
         <button onClick={() => navigate('/')} className="mt-6 bg-primary text-white px-6 py-2 rounded-xl font-bold">Go Home</button>
      </div>
    );
  }

  const dateStr = new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-surface-container flex flex-col items-center py-10 px-4 print:p-0 print:bg-white text-on-surface">
       
       <div className="max-w-[1000px] w-full flex items-center justify-between mb-8 print:hidden">
         <button onClick={() => navigate('/progress')} className="flex items-center gap-2 text-text-secondary hover:text-primary font-bold transition-colors">
           <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
         </button>
         <div className="flex gap-4">
            <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 font-bold transition-colors shadow-lg shadow-primary/20" onClick={() => window.print()}>
              <span className="material-symbols-outlined text-[18px]">print</span> Print / Save PDF
            </button>
         </div>
       </div>

       {/* Certificate Container */}
       <div className="w-full max-w-[1000px] aspect-[1.414/1] bg-surface-container-lowest relative shadow-2xl overflow-hidden rounded-3xl print:shadow-none print:rounded-none print:max-w-none print:w-[11in] print:h-[8.5in] print:m-0 flex flex-col border border-outline-variant/30 print:border-0" style={{
         backgroundImage: 'radial-gradient(circle at center, var(--surface-container-lowest) 0%, var(--surface-container-low) 100%)'
       }}>
          
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>

          {/* Decorative Corner Ornaments (Mentora Style) */}
          <div className="absolute top-8 left-8 w-16 h-16 border-t-[3px] border-l-[3px] border-primary/40 rounded-tl-xl"></div>
          <div className="absolute top-8 right-8 w-16 h-16 border-t-[3px] border-r-[3px] border-primary/40 rounded-tr-xl"></div>
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-[3px] border-l-[3px] border-primary/40 rounded-bl-xl"></div>
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b-[3px] border-r-[3px] border-primary/40 rounded-br-xl"></div>

          <div className="flex-1 flex flex-col items-center justify-center p-16 relative z-10 h-full">
            
            {/* Header / Brand */}
            <div className="mb-10 flex flex-col items-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                 <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined text-3xl font-light">auto_awesome</span>
                 </div>
                 <h1 className="text-on-surface font-display-md font-black text-4xl tracking-tight">Mentora</h1>
              </div>
              <h2 className="text-xs font-bold tracking-[0.4em] text-primary uppercase">Certificate of Mastery</h2>
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center justify-center text-center w-full max-w-3xl mx-auto flex-1">
              <p className="text-text-secondary uppercase tracking-widest text-sm font-bold mb-4">This proudly certifies that</p>
              
              <h2 className="text-6xl font-display-md font-black text-on-surface mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent pb-2">
                {cert.student.full_name}
              </h2>
              
              <p className="text-text-secondary text-lg leading-relaxed mb-6 max-w-2xl font-medium">
                has successfully fulfilled all requirements, demonstrated comprehensive mastery, and achieved extraordinary proficiency in:
              </p>
              
              <h3 className="text-3xl font-bold text-on-surface bg-surface-container-high px-8 py-4 rounded-2xl border border-outline-variant/30 shadow-sm">
                {cert.course.title}
              </h3>
            </div>

            {/* Footer / Signatures */}
            <div className="flex items-end justify-between w-full max-w-4xl mx-auto mt-12 pb-4">
              
              <div className="flex flex-col items-center flex-1">
                 <div className="w-48 border-b-2 border-outline-variant/50 mb-3 text-center pb-2">
                    <span className="font-bold text-on-surface font-mono text-sm">{dateStr}</span>
                 </div>
                 <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">Date of Issue</p>
              </div>

              {/* QR Code and Validation Section */}
              <div className="flex flex-col items-center mx-8">
                 <div className="bg-white p-2 rounded-xl shadow-md border border-outline-variant/20 mb-3">
                    <QRCodeSVG value={verificationUrl} size={90} level="H" fgColor="#1e293b" />
                 </div>
                 <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">Scan to Verify</p>
                 <p className="text-[10px] text-text-secondary font-mono bg-surface-container-highest px-3 py-1 rounded-md border border-outline-variant/30">ID: {cert.credential_id.split('-')[0]}</p>
              </div>

              <div className="flex flex-col items-center flex-1">
                 <div className="w-48 border-b-2 border-outline-variant/50 mb-3 text-center pb-2 relative h-[40px]">
                    <span className="absolute bottom-0 left-0 right-0 font-handwriting text-4xl text-on-surface italic" style={{ fontFamily: '"Caveat", "Brush Script MT", cursive' }}>
                      {cert.course.course_admin?.full_name}
                    </span>
                 </div>
                 <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">Course Instructor</p>
              </div>

            </div>

          </div>
       </div>
    </div>
  );
}
