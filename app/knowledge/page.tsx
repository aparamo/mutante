"use client";

import { useChat } from "ai/react";
import { Send, Bot, User, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";

export default function KnowledgeChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container max-w-screen-md mx-auto py-8 px-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-center gap-2">
          <Leaf className="h-8 w-8 text-green-500" />
          Experto IA en Desarrollo Sustentable
        </h1>
        <p className="text-muted-foreground">
          Hazme preguntas sobre medio ambiente, recursos naturales, políticas y las investigaciones de los egresados de LEAD-México.
        </p>
      </div>

      <Card className="flex-1 flex flex-col bg-background/50 backdrop-blur-sm border shadow-sm overflow-hidden relative">
        <ScrollArea className="flex-1 p-4 h-full overflow-y-auto" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4">
              <Bot className="h-16 w-16 opacity-20" />
              <p className="max-w-sm">
                Soy un sistema experto impulsado por IA, entrenado con las publicaciones, tesis y entrevistas de decenas de especialistas en desarrollo sustentable.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <BadgeHint text="¿Qué impacto tiene el maíz nativo frente al cambio climático?" onClick={() => handleInputChange({ target: { value: "¿Qué impacto tiene el maíz nativo frente al cambio climático?" } } as any)} />
                <BadgeHint text="Háblame de la sobreexplotación de acuíferos" onClick={() => handleInputChange({ target: { value: "Háblame de la sobreexplotación de acuíferos" } } as any)} />
                <BadgeHint text="¿Qué proponen sobre manejo forestal comunitario?" onClick={() => handleInputChange({ target: { value: "¿Qué proponen sobre manejo forestal comunitario?" } } as any)} />
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-4 ${
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div
                    className={`flex flex-col space-y-2 max-w-[80%] ${
                      m.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-xl whitespace-pre-wrap leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted/50 rounded-tl-sm prose dark:prose-invert max-w-none text-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 flex-row animate-pulse">
                   <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">
                      <Bot className="h-5 w-5" />
                   </div>
                   <div className="px-4 py-3 rounded-xl bg-muted/50 w-24">
                     <span className="inline-block w-2 h-2 bg-foreground/30 rounded-full mr-1"></span>
                     <span className="inline-block w-2 h-2 bg-foreground/30 rounded-full mr-1"></span>
                     <span className="inline-block w-2 h-2 bg-foreground/30 rounded-full"></span>
                   </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 bg-background border-t">
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Haz tu pregunta al sistema experto..."
              className="flex-1 pr-12 rounded-full bg-muted/50 border-muted-foreground/20 focus-visible:ring-primary"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="absolute right-1 top-1 h-8 w-8 rounded-full"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">La IA puede cometer errores. Verifica la información.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BadgeHint({ text, onClick }: { text: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs bg-muted hover:bg-muted/80 text-foreground/80 px-3 py-1.5 rounded-full transition-colors border border-border"
    >
      {text}
    </button>
  );
}
