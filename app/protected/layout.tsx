import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";

import { Suspense } from "react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col relative ">
      <FlickeringGrid
        className="z-0 absolute inset-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#0b6923"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <h1 className="text-xl">
              <span className="text-purple-600 text-[1.5rem] -rotate-12 inline-block -mb-1">
                C
              </span>
              hatSafe
            </h1>
          </div>
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
        </div>
      </nav>

      <main className="flex-1 w-full flex flex-col gap-20 items-center z-10 relative">
        <div className="flex-1 w-full flex flex-col items-center gap-20 max-w-5xl p-5 ">
          {children}
        </div>
      </main>

      <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-6 z-10 bg-background/80 backdrop-blur-sm">
        <div>
          <p>Developed by Karan Kumar </p>
          <p>Contact: karankumarascode@gmail.com</p>
        </div>
        <div>
          <ThemeSwitcher />
        </div>
      </footer>
    </div>
  );
}
