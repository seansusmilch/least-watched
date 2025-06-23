import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/scan')({
  component: ScanPage,
});

function ScanPage() {
  return (
    <main className='flex min-h-screen flex-col p-8'>
      <div className='max-w-7xl mx-auto w-full'>
        <h1 className='text-4xl font-bold mb-8'>Scan Media</h1>
        <p>Scan page content will be here</p>
      </div>
    </main>
  );
}
