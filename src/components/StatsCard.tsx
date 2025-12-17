interface StatsCardProps {
  title: string;
  value: number;
}

export default function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-white/50 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-4xl font-bold" style={{ color: 'rgb(231, 86, 80)' }}>{value}</p>
    </div>
  );
}
