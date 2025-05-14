import { Suspense } from "react"
import DrillingSim from "@/components/drilling-sim"
import LoadingSpinner from "@/components/loading-spinner"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Advanced Drilling Simulation Platform</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <DrillingSim />
        </Suspense>
      </div>
    </main>
  )
}
