import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/proxy";

// Next 16: el convenio se llama proxy, no middleware.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // todo salvo estáticos e imágenes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
