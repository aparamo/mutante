import { getAllWorksAction } from "@/lib/actions/knowledge-actions";
import { WorksDirectoryClient } from "@/components/WorksDirectoryClient";

export const metadata = {
  title: "Biblioteca de Obras | Mutante",
  description: "Directorio completo de publicaciones, tesis y artículos de los expertos en desarrollo sustentable.",
};

export default async function WorksPage() {
  const allWorks = await getAllWorksAction();

  return (
    <main className="min-h-screen bg-zinc-950">
      <WorksDirectoryClient initialWorks={allWorks} />
    </main>
  );
}
