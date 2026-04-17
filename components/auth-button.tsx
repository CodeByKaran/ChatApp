import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  const ellipsedEmailOnly6 = user?.email ? user.email.split("@")[0] : "User";

  return user ? (
    <div className="flex items-center gap-2">
      Hey,{" "}
      {ellipsedEmailOnly6.length > 6
        ? `${ellipsedEmailOnly6.slice(0, 6)}...`
        : ellipsedEmailOnly6}
      <span className="text-green-500 text-xs">●</span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
