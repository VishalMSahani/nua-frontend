import Image from "next/image";

interface DashboardHeaderProps {
  userName?: string;
  userEmail?: string;
}

export default function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-white/50 p-1 mb-6">
      <div className="flex items-center justify-between pl-4">
           
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nua File Storage</h1>
          <p className="text-gray-600 mt-1">Welcome back, {userName || userEmail || 'User'}</p>
        </div>
        <div className="flex items-center gap-3">
           <div>
            <Image 
            src="/data-show.svg" 
            alt="Nua Logo" width={200} height={200} />
        </div>
        </div>
      </div>
    </div>
  );
}
