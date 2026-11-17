import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          MotoTrack SaaS &nbsp;
          <code className="font-bold">v0.1.0-alpha</code>
        </p>
      </div>

      <div className="flex flex-col items-center justify-center mt-20 text-center">
        <h1 className="text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
          Control total para tu <span className="text-orange-600">taller de motos</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mb-8">
          Optimiza la recepción, mantén el historial clínico de cada vehículo y mejora la confianza del cliente con seguimiento en tiempo real vía WhatsApp.
        </p>
        
        <div className="flex gap-4">
          <Link 
            href="/dashboard/orders/new"
            className="rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-orange-500 transition-colors"
          >
            Ir al Dashboard
          </Link>
          <Link 
            href="/mechanic"
            className="rounded-full border-2 border-slate-300 px-8 py-4 text-lg font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Modo Mecánico
          </Link>
        </div>
      </div>

      <div className="mt-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left gap-8">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h2 className={`mb-3 text-2xl font-semibold`}>Recepción 🛠️</h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Captura daños, fotos y requerimientos en segundos.
          </p>
        </div>
        
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h2 className={`mb-3 text-2xl font-semibold`}>Live Tracking 🛰️</h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Tus clientes ven el progreso sin llamarte por teléfono.
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h2 className={`mb-3 text-2xl font-semibold`}>WhatsApp 📱</h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Notificaciones automáticas y estados de reparación.
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h2 className={`mb-3 text-2xl font-semibold`}>Catálogo ⚙️</h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Gestión de repuestos y mano de obra unificada.
          </p>
        </div>
      </div>
    </main>
  );
}
