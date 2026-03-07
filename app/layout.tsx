import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Leaf } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "El mutante",
  description: "Banco de conocimiento de especialistas en desarrollo sustentable",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
            <div className="mr-4 hidden md:flex">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <Leaf className="h-6 w-6 text-green-500" />
                <span className="hidden font-bold sm:inline-block">
                  Mutante - LE4D
                </span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Directorio
                </Link>
                <Link
                  href="/knowledge"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Chatbot
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center">
          {children}
        </main>
      </body>
    </html>
  );
}
