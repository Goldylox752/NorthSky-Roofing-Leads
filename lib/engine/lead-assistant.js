const settings = await supabase
  .from("org_settings")
  .select("*")
  .eq("org_id", org_id)
  .single();
