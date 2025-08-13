'use client';

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function Home() {
  const tasks = useQuery(api.tasks.get);

  return (
    <div className="grid h-screen grid-rows-[1fr_auto] items-center justify-items-center gap-16 p-8 pb-20 font-sans sm:p-20">
      <main className="flex flex-col items-center gap-[32px] sm:items-start">
        {tasks?.map(({ _id, text }) => (
          <div key={_id}>{text}</div>
        ))}
      </main>
      <footer className="flex items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://subconscious.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by Subconscious
        </a>
      </footer>
    </div>
  );
}
