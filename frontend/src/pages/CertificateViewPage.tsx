import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';

export default function CertificateViewPage() {
  const { credentialId } = useParams();
  const navigate = useNavigate();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const verificationUrl = `${window.location.origin}/certificate/${credentialId}`;

  useEffect(() => {
    const verifyCert = async () => {
      try {
        const res = await fetch(`${API_URL}/certificates/verify/${credentialId}`);
        if (!res.ok) throw new Error('Invalid or unverified certificate credential.');
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

  const handleDownloadPng = async () => {
    if (!certificateRef.current || !cert) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(certificateRef.current, {
        quality: 1.0,
        pixelRatio: 2.5,
        cacheBust: true,
      });
      const link = document.createElement('a');
      const safeName = cert.student?.full_name?.replace(/\s+/g, '_') || 'Student';
      const safeCourse = cert.course?.title?.replace(/\s+/g, '_') || 'Course';
      link.download = `Mentora_Certificate_${safeName}_${safeCourse}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddToLinkedIn = () => {
    if (!cert) return;
    const issuedDate = new Date(cert.issued_at);
    const year = issuedDate.getFullYear();
    const month = issuedDate.getMonth() + 1;
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: cert.course.title,
      organizationName: 'Mentora',
      issueYear: year.toString(),
      issueMonth: month.toString(),
      certUrl: verificationUrl,
      certId: cert.credential_id
    });
    window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    if (!cert) return;
    const text = `I just earned my verified Certificate of Mastery in "${cert.course.title}" on @Mentora! Check out my verified credential:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verificationUrl)}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    if (!cert) return;
    const text = `Check out my verified Certificate of Mastery in "${cert.course.title}" from Mentora: ${verificationUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="text-sm font-bold text-text-secondary">Verifying credential against registry...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl">gpp_bad</span>
        </div>
        <h1 className="text-2xl font-black mb-2 text-on-surface">Credential Verification Failed</h1>
        <p className="text-text-secondary max-w-md mb-6">{error || 'This credential could not be found or has not been officially registered.'}</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all"
        >
          Return to Mentora Home
        </button>
      </div>
    );
  }

  const dateStr = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-900/5 print:bg-white text-on-surface flex flex-col items-center py-8 px-4 print:p-0 print:m-0">
      
      {/* Print CSS Custom Rules */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-[1040px] w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary font-bold text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Add to LinkedIn */}
          <button
            onClick={handleAddToLinkedIn}
            className="inline-flex items-center gap-2 bg-[#0A66C2] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#004182] transition-all shadow-sm active:scale-95"
            title="Add this verified credential directly to your LinkedIn profile"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
            </svg>
            <span>Add to LinkedIn</span>
          </button>

          {/* Download PNG */}
          <button 
            onClick={handleDownloadPng}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant/30 transition-all shadow-sm disabled:opacity-50 active:scale-95"
            title="Download high-resolution certificate image (PNG)"
          >
            <span className="material-symbols-outlined text-[16px]">
              {downloading ? 'sync' : 'image'}
            </span>
            <span>{downloading ? 'Exporting...' : 'Download PNG'}</span>
          </button>

          {/* Print / Save PDF */}
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95"
            title="Print or Save as PDF"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print / PDF</span>
          </button>

          {/* Copy Verification Link */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container-high text-text-secondary px-3 py-2 rounded-xl text-xs font-bold border border-outline-variant/30 transition-all shadow-sm active:scale-95"
            title="Copy Public Verification Link"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* 
        ========================================================================
        LUXURY CREDENTIAL CARD (Rendered element for viewing, printing & PNG)
        ========================================================================
      */}
      <div 
        ref={certificateRef}
        id="mentora-certificate"
        className="w-full max-w-[1040px] aspect-[1.414/1] relative bg-[#FCFBF7] text-[#1A1A1A] shadow-2xl rounded-3xl print:rounded-none print:shadow-none print:max-w-none print:w-full print:h-screen print:m-0 flex flex-col overflow-hidden border-8 border-[#0E2018]"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Outer Inset Gold Filigree Border */}
        <div className="absolute inset-3 border-2 border-[#D4AF37] rounded-2xl pointer-events-none opacity-90"></div>
        <div className="absolute inset-4 border border-[#D4AF37]/40 rounded-xl pointer-events-none"></div>

        {/* Ornate Corner Accents */}
        <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-[#D4AF37] pointer-events-none"></div>
        <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-[#D4AF37] pointer-events-none"></div>
        <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-[#D4AF37] pointer-events-none"></div>
        <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-[#D4AF37] pointer-events-none"></div>

        {/* Security Guilloche Watermark Pattern in Center */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at center, #0E2018 1px, transparent 1px), radial-gradient(circle at center, #D4AF37 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        />

        {/* Main Certificate Content Container */}
        <div className="relative z-10 flex-1 flex flex-col justify-between p-8 sm:p-12 md:p-14">
          
          {/* Header Section */}
          <div className="flex flex-col items-center text-center">
            {/* Top Brand Logo & Seal Line */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E2018] to-[#1F3D2F] text-[#D4AF37] flex items-center justify-center shadow-md border border-[#D4AF37]/50">
                <span className="material-symbols-outlined text-2xl font-bold">auto_awesome</span>
              </div>
              <span className="font-display-md text-3xl font-black tracking-tight text-[#0E2018]">
                Mentora
              </span>
            </div>

            <p className="text-[11px] uppercase tracking-[0.35em] font-extrabold text-[#D4AF37] mb-1">
              Adaptive Learning & Intelligence Academy
            </p>

            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-[#0E2018] mt-2 mb-1">
              Certificate of Mastery
            </h1>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-3"></div>
            <p className="text-xs uppercase tracking-widest text-[#555] font-semibold">
              This is to officially certify that
            </p>
          </div>

          {/* Student Recipient Section */}
          <div className="flex flex-col items-center text-center my-auto py-2">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-[#0E2018] tracking-tight pb-1 border-b-2 border-[#D4AF37]/40 max-w-2xl px-6">
              {cert.student?.full_name || 'Accomplished Learner'}
            </h2>
            
            <p className="text-xs sm:text-sm text-[#444] max-w-2xl leading-relaxed mt-4 font-medium">
              has successfully fulfilled all rigorous curriculum requirements, demonstrated comprehensive proficiency, and validated topic competencies with distinguished achievement in:
            </p>

            {/* Course Title Badge */}
            <div className="mt-4 px-6 py-2.5 rounded-2xl bg-white border border-[#D4AF37]/40 shadow-sm flex flex-col items-center">
              <span className="text-base sm:text-xl md:text-2xl font-black text-[#0E2018] tracking-tight">
                {cert.course?.title}
              </span>
              {cert.course?.category?.category_name && (
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] mt-0.5">
                  Specialization: {cert.course.category.category_name}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Footer Section: Signatures, Official Seal, & QR Code */}
          <div className="grid grid-cols-3 items-end pt-4 mt-auto border-t border-[#D4AF37]/30">
            
            {/* Left: Issue Date & Credential ID */}
            <div className="flex flex-col items-start text-left">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-[#777]">Date of Issue</p>
                <p className="text-xs font-bold text-[#0E2018] font-mono">{dateStr}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-black/10">
                <p className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Credential ID</p>
                <p className="text-[10px] font-mono font-bold text-[#0E2018] tracking-wider truncate max-w-[180px]">
                  {cert.credential_id}
                </p>
              </div>
            </div>

            {/* Center: Official Embossed Gold Mastery Rosette Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Gold Seal Outer Scallop Rosette */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#B38728] via-[#FBF5B7] to-[#AA771C] p-1 shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center border border-[#996515]">
                  {/* Inner Dark Green Core */}
                  <div className="w-full h-full rounded-full bg-[#0E2018] flex flex-col items-center justify-center text-center p-1 border-2 border-dashed border-[#FBF5B7]/80">
                    <span className="material-symbols-outlined text-[#FBF5B7] text-lg sm:text-xl leading-none">
                      verified
                    </span>
                    <span className="text-[7px] sm:text-[8px] uppercase tracking-widest font-black text-[#FBF5B7] mt-0.5 leading-tight">
                      MENTORA
                    </span>
                    <span className="text-[5px] sm:text-[6px] uppercase tracking-wider font-bold text-white/80">
                      ACCREDITED
                    </span>
                  </div>
                </div>

                {/* Hanging Ribbon Tails */}
                <div className="absolute -bottom-3 flex gap-1 z-[-1]">
                  <div className="w-3.5 h-6 bg-[#AA771C] [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]"></div>
                  <div className="w-3.5 h-6 bg-[#0E2018] [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]"></div>
                </div>
              </div>
              <p className="text-[8px] uppercase tracking-[0.2em] font-extrabold text-[#666] mt-4">
                Official Credential
              </p>
            </div>

            {/* Right: Signature & QR Code */}
            <div className="flex items-center justify-end gap-4">
              {/* Instructor Signature */}
              <div className="flex flex-col items-center text-center">
                <div className="h-9 flex items-end justify-center px-2">
                  <span 
                    className="text-2xl text-[#0E2018] italic font-semibold leading-none select-none"
                    style={{ fontFamily: '"Caveat", "Brush Script MT", cursive' }}
                  >
                    {cert.course?.course_admin?.full_name || 'Course Instructor'}
                  </span>
                </div>
                <div className="w-28 sm:w-36 border-b border-black/40 my-1"></div>
                <p className="text-[9px] uppercase tracking-widest font-extrabold text-[#777]">Instructor & Mentor</p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center shrink-0">
                <div className="p-1 bg-white rounded-lg border border-[#D4AF37]/40 shadow-sm">
                  <QRCodeSVG value={verificationUrl} size={54} level="M" fgColor="#0E2018" />
                </div>
                <span className="text-[7px] uppercase tracking-wider font-extrabold text-[#777] mt-1">Scan to Verify</span>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* 
        ========================================================================
        PUBLIC VERIFICATION & TRUST PANEL (Recruiter & Employer Details)
        ========================================================================
      */}
      <div className="max-w-[1040px] w-full mt-10 print:hidden space-y-6">
        
        {/* Verification Status Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 border border-green-500/20">
                <span className="material-symbols-outlined text-2xl font-bold">verified</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-on-surface">Verified Authentic Credential</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                    Active & Valid
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  This credential is cryptographically registered in the Mentora Academic Registry and cannot be forged.
                </p>
              </div>
            </div>

            {/* Social Sharing Shortcuts */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <span className="text-xs font-bold text-text-secondary mr-1">Share:</span>
              <button 
                onClick={handleAddToLinkedIn}
                className="w-9 h-9 rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-all flex items-center justify-center"
                title="Add to LinkedIn Profile"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
                </svg>
              </button>
              <button 
                onClick={handleShareTwitter}
                className="w-9 h-9 rounded-xl bg-black/5 hover:bg-black hover:text-white text-on-surface transition-all flex items-center justify-center font-bold text-xs"
                title="Share on X"
              >
                𝕏
              </button>
              <button 
                onClick={handleShareWhatsApp}
                className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center"
                title="Share on WhatsApp"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </button>
              <button 
                onClick={handleCopyLink}
                className="w-9 h-9 rounded-xl bg-surface-container-high hover:bg-primary hover:text-white text-text-secondary transition-all flex items-center justify-center"
                title="Copy Credential URL"
              >
                <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'link'}</span>
              </button>
            </div>
          </div>

          {/* Verification Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Student / Recipient</p>
              <p className="text-sm font-bold text-on-surface">{cert.student?.full_name}</p>
              <p className="text-xs text-text-secondary">{cert.student?.email}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Issuing Authority</p>
              <p className="text-sm font-bold text-on-surface">Mentora Adaptive Academy</p>
              <p className="text-xs text-text-secondary">AI-Powered Skill Assessment</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Issued Date</p>
              <p className="text-sm font-bold text-on-surface">{dateStr}</p>
              <p className="text-xs text-green-600 font-semibold">No Expiration Date</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Permanent Credential ID</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-primary truncate max-w-[150px]">
                  {cert.credential_id}
                </span>
                <button 
                  onClick={handleCopyLink}
                  className="text-text-secondary hover:text-primary transition-colors"
                  title="Copy ID"
                >
                  <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Verified Competencies / Topics Mastered */}
          {cert.course?.topics && cert.course.topics.length > 0 && (
            <div className="mt-8 pt-6 border-t border-outline-variant/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                Verified Competencies & Topics Mastered ({cert.course.topics.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {cert.course.topics.map((t: any, idx: number) => (
                  <div 
                    key={t.topic_id || idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs font-medium text-on-surface"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span>{t.topic_title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permanent Verification URL Link */}
          <div className="mt-6 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Direct Verification URL</p>
              <p className="text-xs font-mono text-primary truncate">{verificationUrl}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-outline-variant/30 text-xs font-bold text-text-secondary hover:text-primary hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
              <span>{copied ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
