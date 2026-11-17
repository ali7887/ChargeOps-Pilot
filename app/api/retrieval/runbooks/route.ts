import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { retrieveRunbookSections } from "@/lib/retrieval";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireAuth(supabase);

    const { searchParams } = new URL(request.url);
    const errorCode = searchParams.get("errorCode") || undefined;
    const query = searchParams.get("query") || undefined;

    if (!errorCode && !query) {
      return NextResponse.json(
        { error: "پارامتر errorCode یا query الزامی است." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await retrieveRunbookSections(
      { errorCode, searchTerm: query },
      supabase
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { error: "خطا در بازیابی مستندات ران‌بوک." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
