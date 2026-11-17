import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, requireRole, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

const inviteUserSchema = z.object({
  email: z.string().email("فرمت پست الکترونیکی نامعتبر است."),
  role: z.enum(["admin", "viewer"], {
    errorMap: () => ({ message: "نقش کاربر باید admin یا viewer باشد." }),
  }),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const currentUser = await requireAuth(supabase);
    requireRole(currentUser, "admin");

    const adminClient = createAdminClient();
    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("user_id, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "خطا در دریافت فهرست کاربران." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { profiles },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { error: "خطای پیش‌بینی‌نشده در سرور." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const currentUser = await requireAuth(supabase);
    requireRole(currentUser, "admin");

    const body = await request.json();
    const validation = inviteUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { email, role } = validation.data;
    const adminClient = createAdminClient();

    // Send invitation via Supabase Auth Admin
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      return NextResponse.json(
        { error: `ارسال دعوت‌نامه ناموفق بود: ${inviteError.message}` },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Assign role in profiles table
    if (inviteData?.user) {
      await adminClient.from("profiles").upsert({
        user_id: inviteData.user.id,
        role,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        message: "دعوت‌نامه با موفقیت ارسال شد و نقش کاربر ذخیره گردید.",
        userId: inviteData.user?.id,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { error: "خطای سیستمی در پردازش دعوت‌نامه." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
