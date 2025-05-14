export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-t-transparent border-r-green-500 border-b-transparent border-l-transparent rounded-full animate-spin animation-delay-150"></div>
        <div className="absolute inset-4 border-4 border-t-transparent border-r-transparent border-b-red-500 border-l-transparent rounded-full animate-spin animation-delay-300"></div>
      </div>
      <p className="ml-4 text-xl font-semibold">Loading Simulation...</p>
    </div>
  )
}
