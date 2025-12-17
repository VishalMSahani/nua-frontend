export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(239, 250, 248)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'rgb(231, 86, 80)' }}></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
