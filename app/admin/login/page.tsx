import { signIn } from "@/auth"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/admin/experts");
  }

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <div className="w-full max-w-sm bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-zinc-100">Acceso Admin</h2>
        <form
          action={async (formData) => {
            "use server"
            await signIn("credentials", {
                password: formData.get("password"),
                redirectTo: "/admin/experts"
            })
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Contraseña
            </label>
            <input 
              name="password" 
              type="password" 
              required
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
