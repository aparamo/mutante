"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, Menu, Search, MessageSquare, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex md:hidden flex-1 items-center justify-between">
      <Link href="/" className="flex items-center space-x-2" onClick={() => setOpen(false)}>
        <Leaf className="h-5 w-5 text-green-500" />
        <span className="font-bold">Mutante - LE4D</span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="md:hidden inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <VisuallyHidden>
            <SheetTitle>Menu</SheetTitle>
          </VisuallyHidden>
          <div className="flex flex-col space-y-4 py-4">
            <Link 
              href="/" 
              className="flex items-center space-x-2"
              onClick={() => setOpen(false)}
            >
              <Leaf className="h-5 w-5 text-green-500" />
              <span className="font-bold">Mutante - LE4D</span>
            </Link>
            <div className="flex flex-col space-y-6 pt-8">
              <Link
                href="/"
                className="text-xl font-medium flex items-center gap-3 text-foreground/70 transition-colors hover:text-foreground p-2 rounded-md hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                <Search className="h-6 w-6" />
                Directorio
              </Link>
              <Link
                href="/knowledge"
                className="text-xl font-medium flex items-center gap-3 text-foreground/70 transition-colors hover:text-foreground p-2 rounded-md hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                <MessageSquare className="h-6 w-6" />
                Chatbot
              </Link>
              <Link
                href="/works"
                className="text-xl font-medium flex items-center gap-3 text-foreground/70 transition-colors hover:text-foreground p-2 rounded-md hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                <Book className="h-6 w-6" />
                Biblioteca
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
