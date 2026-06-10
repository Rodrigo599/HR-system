import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      theme="light"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNameFunction: (toast) => {
          return `${
            toast.type === "error"
              ? "group toast group-[.toaster]:bg-red-600 group-[.toaster]:text-slate-50 group-[.toaster]:border-red-700 group-[.toaster]:shadow-lg"
              : toast.type === "success"
                ? "group toast group-[.toaster]:bg-green-600 group-[.toaster]:text-slate-50 group-[.toaster]:border-green-700 group-[.toaster]:shadow-lg"
                : toast.type === "loading"
                  ? "group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-50 group-[.toaster]:border-slate-800 group-[.toaster]:shadow-lg"
                  : "group toast group-[.toaster]:bg-slate-950 group-[.toaster]:text-slate-50 group-[.toaster]:border-slate-800 group-[.toaster]:shadow-lg"
          } group-[.toaster]:shadow-xl`
        },
      }}
    />
  )
}
