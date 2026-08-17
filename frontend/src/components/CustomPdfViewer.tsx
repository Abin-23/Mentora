import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure the worker for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface CustomPdfViewerProps {
  url: string;
  title?: string;
  courseTitle?: string;
  token?: string;
  apiUrl?: string;
  onProgressStart?: () => void;
  onProgressUpdate?: (percent: number, timeSpent: number) => void;
  onRealtimeProgress?: (percent: number) => void;
  onProgressComplete?: () => void;
}

export default function CustomPdfViewer({ url, title, courseTitle, token, apiUrl, onProgressStart, onProgressUpdate, onRealtimeProgress, onProgressComplete }: CustomPdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  
  // Tracking
  const [maxScrolledPercent, setMaxScrolledPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Reset state on url change
    setMaxScrolledPercent(0);
    setIsCompleted(false);
    hasStartedRef.current = false;
  }, [url]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    if (!hasStartedRef.current && onProgressStart) {
       hasStartedRef.current = true;
       onProgressStart();
    }
  }

  // Periodic heartbeat sync
  useEffect(() => {
    if (!hasStartedRef.current || !onProgressUpdate) return;
    const interval = setInterval(() => {
      onProgressUpdate(maxScrolledPercent, 15); // Sending delta of 15 seconds
    }, 15000);
    return () => clearInterval(interval);
  }, [maxScrolledPercent, onProgressUpdate]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPos = target.scrollTop + target.clientHeight;
    const maxScroll = target.scrollHeight;
    
    if (maxScroll > 0) {
      const p = Math.min(100, Math.round((scrollPos / maxScroll) * 100));
      if (p > maxScrolledPercent) {
        setMaxScrolledPercent(p);
        if (onRealtimeProgress) onRealtimeProgress(p);
      }
      // If user scrolls near the very bottom (95%+)
      if (p >= 95 && !isCompleted) {
        setIsCompleted(true);
        setMaxScrolledPercent(100);
        if (onRealtimeProgress) onRealtimeProgress(100);
        if (onProgressComplete) onProgressComplete();
      }
    }
  };

  const proxyUrl = apiUrl && token ? `${apiUrl}/resources/proxy?url=${encodeURIComponent(url)}` : url;
  const fileOptions = {
    url: proxyUrl,
    ...(token && apiUrl ? { httpHeaders: { Authorization: `Bearer ${token}` } } : {})
  };

  return (
    <div className="relative w-full h-[75vh] min-h-[650px] rounded-[32px] overflow-hidden bg-[#F8F9FA] flex flex-col border border-outline-variant/30 shadow-inner group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      
      {/* Header Toolbar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 shadow-sm shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md text-white shrink-0">
               <span className="material-symbols-outlined">description</span>
            </div>
            <div className="overflow-hidden">
               <h3 className="font-bold text-sm text-on-surface leading-tight truncate max-w-[300px]">{title || 'Document'}</h3>
               <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-0.5 truncate max-w-[200px]">{courseTitle || 'Course Material'}</p>
            </div>
         </div>
         
         {/* Controls */}
         <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-container-low rounded-lg p-1 border border-outline-variant/20">
              <button 
                onClick={() => setScale(s => Math.max(0.5, s - 0.2))} 
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-on-surface transition-all"
                title="Zoom Out"
              >
                 <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <span className="text-xs font-bold w-12 text-center text-text-secondary">{Math.round(scale * 100)}%</span>
              <button 
                onClick={() => setScale(s => Math.min(3, s + 0.2))} 
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-on-surface transition-all"
                title="Zoom In"
              >
                 <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-white border border-outline-variant/30 text-on-surface rounded-xl hover:bg-surface-container-low hover:text-primary transition-colors tooltip-trigger ml-2" title="Download">
               <span className="material-symbols-outlined text-[18px]">download</span>
            </a>
         </div>
      </div>

      {/* PDF Viewport */}
      <div 
        className="flex-1 relative z-10 w-full overflow-auto custom-scrollbar flex justify-center py-8"
        onScroll={handleScroll}
      >
        <Document
          file={fileOptions}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-64 text-primary gap-4">
               <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
               <p className="font-bold text-sm">Loading Document...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-64 text-error gap-2 bg-error/10 p-8 rounded-2xl border border-error/20">
               <span className="material-symbols-outlined text-4xl">error</span>
               <p className="font-bold">Failed to load PDF</p>
               <a href={url} target="_blank" rel="noreferrer" className="mt-2 text-xs font-bold text-error underline hover:text-error/80">Try opening directly</a>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-8">
            {numPages ? Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} className="shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-outline-variant/20 bg-white transition-transform overflow-hidden rounded">
                <Page 
                  pageNumber={index + 1} 
                  scale={scale} 
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="max-w-full"
                />
              </div>
            )) : null}
          </div>
        </Document>
      </div>
      
      {/* Page Count Indicator */}
      {numPages && numPages > 0 ? (
        <div className="h-10 bg-white/80 backdrop-blur-md border-t border-outline-variant/20 flex items-center justify-center px-6 absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <span className="text-xs font-bold text-text-secondary">
             {numPages} {numPages === 1 ? 'Page' : 'Pages'}
          </span>
        </div>
      ) : null}
    </div>
  );
}
