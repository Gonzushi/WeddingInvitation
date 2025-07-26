import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://lfxesdtamsdjddgxnxmr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGVzZHRhbXNkamRkZ3hueG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTQxOTQsImV4cCI6MjA2OTA5MDE5NH0.JCdrpqxEt5ZneQm6CqADLwICsAQfTiDxFZAtUpZjjmI"
);
