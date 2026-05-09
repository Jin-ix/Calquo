export function getFunctions() { return {}; }
export function httpsCallable(functions: any, name: string) {
  return async (data: any) => {
    console.warn(`[Supabase Shim] Called httpsCallable for ${name}. This should be migrated to Edge Functions.`);
    return { data: { success: true } };
  };
}
