import { getAllExperts } from "@/lib/actions/expert-actions";
import { ExpertListClient } from "@/components/admin/ExpertListClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ExpertsAdminPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  const experts = await getAllExperts();
  const enrichedCount = experts.filter(e => e.isEnriched).length;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center flex-shrink-0">
        <h2 className="text-2xl font-semibold text-zinc-100">
          Administración de Expertos y Conocimiento
        </h2>
        <div className="flex gap-2">
            <span className="bg-zinc-800 text-zinc-300 text-xs font-semibold px-2.5 py-1.5 rounded flex items-center border border-zinc-700">
              {enrichedCount} Enriquecidos / {experts.length} Total
            </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm">
        <ExpertListClient initialExperts={experts} />
      </div>
    </div>
  );
}
