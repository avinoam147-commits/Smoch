import "server-only";

// Israeli Companies Registrar open data (data.gov.il, CKAN datastore).
// Dataset: "חברות רשומות ברשם החברות".
const RESOURCE_ID = process.env.REGISTRY_RESOURCE_ID ?? "f004176c-b85f-4542-8901-7b3176f9a054";
const ENDPOINT = "https://data.gov.il/api/3/action/datastore_search";

export type RegistryRecord = {
  number: string;
  name: string;
  nameEn: string | null;
  type: string | null;
  status: string | null;
  city: string | null;
  incorporated: string | null;
  raw: Record<string, unknown>;
};

/** "51-555001-2" -> "515550012" */
export function normalizeRegistryId(id: string) {
  return id.replace(/\D/g, "");
}

function pick(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

export async function lookupRegistry(
  id: string,
): Promise<{ ok: true; record: RegistryRecord | null } | { ok: false; error: string }> {
  const number = normalizeRegistryId(id);
  if (number.length < 8 || number.length > 9) return { ok: false, error: "מספר ח.פ. צריך להכיל 9 ספרות." };

  const url = `${ENDPOINT}?resource_id=${RESOURCE_ID}&filters=${encodeURIComponent(JSON.stringify({ "מספר חברה": Number(number) }))}&limit=1`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "smoch-registry-lookup" },
    });
    if (!res.ok) return { ok: false, error: `רשם החברות לא זמין כרגע (${res.status}).` };
    const json = (await res.json()) as { success: boolean; result?: { records?: Record<string, unknown>[] } };
    const row = json.result?.records?.[0];
    if (!json.success) return { ok: false, error: "רשם החברות החזיר שגיאה." };
    if (!row) return { ok: true, record: null };
    return {
      ok: true,
      record: {
        number,
        name: pick(row, "שם חברה", "שם_חברה") ?? "",
        nameEn: pick(row, "שם באנגלית", "שם_באנגלית"),
        type: pick(row, "סוג תאגיד", "סוג_תאגיד"),
        status: pick(row, "סטטוס חברה", "סטטוס_חברה"),
        city: pick(row, "שם עיר", "שם_עיר"),
        incorporated: pick(row, "תאריך התאגדות", "תאריך_התאגדות"),
        raw: row,
      },
    };
  } catch {
    return { ok: false, error: "לא הצלחנו להתחבר לרשם החברות. אפשר להזין את הפרטים ידנית." };
  }
}
