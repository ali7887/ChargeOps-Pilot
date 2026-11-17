import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await requireAuth(supabase);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { error: "خطای داخلی در اعتبارسنجی نشست." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
