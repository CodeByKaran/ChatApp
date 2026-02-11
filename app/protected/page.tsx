import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";

import { Suspense } from "react";
import RoomButton from "@/components/room-button";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return JSON.stringify(data.claims, null, 2);
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col  items-center ">
      <div className="flex flex-col gap-2 items-center  w-full">
        <h2 className="font-bold text-2xl">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto bg-transparent backdrop-blur-lg max-[460px]:w-[75%]">
          <Suspense>
            <UserDetails />
          </Suspense>
        </pre>
        <h2 className="font-bold text-2xl mt-4">Chat Safely</h2>
        <RoomButton />
      </div>
    </div>
  );
}
