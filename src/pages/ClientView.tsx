import { useParams } from 'react-router-dom';

export default function ClientView() {
  const { shareCode } = useParams();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-neutral-900">Project View</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Client Project View
          </h2>
          <p className="text-neutral-500">Share Code: {shareCode}</p>
          <p className="text-neutral-500 mt-2">Client-facing project content will go here</p>
        </div>
      </main>
    </div>
  );
}
