import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const adminEmail = "admin@spiceroot.com";
  const adminPassword = "SpiceRoot@2024";

  // Check if admin already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === adminEmail);

  if (existing) {
    // Ensure role exists
    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", existing.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) {
      await supabase.from("user_roles").insert({ user_id: existing.id, role: "admin" });
    }

    return new Response(JSON.stringify({ message: "Admin already exists", email: adminEmail }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create admin user
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { name: "Admin" },
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Assign admin role
  await supabase.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });

  return new Response(JSON.stringify({ message: "Admin created", email: adminEmail }), {
    headers: { "Content-Type": "application/json" },
  });
});
