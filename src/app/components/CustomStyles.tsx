"use client";

export default function CustomStyles() {
  return (
    <style jsx global>{`
      .terminal-bg {
        background-color: #0a0f16;
        background-image: 
          radial-gradient(circle at 10% 20%, rgba(0, 52, 89, 0.15) 0%, transparent 70%),
          radial-gradient(circle at 90% 80%, rgba(0, 108, 111, 0.1) 0%, transparent 70%);
        position: relative;
        z-index: 1;
      }
      
      nav, header {
        z-index: 50 !important;
        position: relative !important;
      }
      
      .geometric-overlay {
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233259a8' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      }
    `}</style>
  );
}