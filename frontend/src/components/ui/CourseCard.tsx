export default function CourseCard() {
  return (
    <div className="md:col-span-8 bg-white rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-8 hover:-translate-y-2 transition-transform duration-300 shadow-xl shadow-black/5">
      <div className="w-32 h-32 rounded-[24px] bg-surface-container-low flex items-center justify-center flex-shrink-0 relative overflow-hidden">
        <img className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwsCIY_ZCVdgqYSpAYZxkPUnpdhzB3gc2AD35eZnB6f9ksi828OHLmJcvRRcVGPIvhcj6AYwz7poM8XBNJXU-jlCjiCnlniPNHM-BTQhZ8D_6G2qffiC4ygenvHnF6gE1X3XJQbGhOa9D7kzIcEh7Lu7_tC9EIBzQdsB-MshBYpEDumOFy45aggOUGNF6FfPa_w4qMae0N3eRyBZvCPef7ehFuwBVjraESLZURJBCU7MJEgy4ydPoOO5G2HZ4t2lLoNVG2uKrt-Gs0" alt="Course" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-accent-neon animate-pulse"></span>
          <span className="font-label-mono text-[10px] uppercase tracking-widest text-text-secondary">In Progress</span>
        </div>
        <h3 className="font-headline-md text-2xl mb-2">Advanced Machine Learning</h3>
        <p className="font-body-md text-text-secondary mb-6 line-clamp-2">Dive deep into neural networks, reinforcement learning, and deploying models to production with real-world datasets.</p>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[45%] rounded-full"></div>
          </div>
          <span className="font-label-mono text-[12px] text-text-secondary">45%</span>
        </div>
      </div>
      <button className="hidden md:flex w-14 h-14 rounded-full border border-outline-variant items-center justify-center hover:bg-surface-container-low transition-colors group cursor-pointer flex-shrink-0">
        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </button>
    </div>
  );
}
