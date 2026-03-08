import { auth } from "@/auth";

import { SessionProvider } from "next-auth/react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <header className="bg-zinc-900 shadow-sm border-b border-zinc-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-zinc-100">Admin - Mutante</h1>
            <nav className="flex items-center space-x-4">
              {session ? (
                <>
                  <span className="text-sm text-zinc-400">
                    Hola, {session.user?.name}
                  </span>
                </>
              ) : null}
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
