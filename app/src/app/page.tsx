import { GridBoard } from '@/components/board/GridBoard';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Narabell</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Grid-based card layout</span>
          </div>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="h-[calc(100vh-73px)]">
        <GridBoard />
      </main>
    </div>
  );
}
