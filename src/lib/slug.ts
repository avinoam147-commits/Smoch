const translit: Record<string, string> = {
  א: "a",
  ב: "b",
  ג: "g",
  ד: "d",
  ה: "h",
  ו: "v",
  ז: "z",
  ח: "ch",
  ט: "t",
  י: "y",
  כ: "k",
  ך: "k",
  ל: "l",
  מ: "m",
  ם: "m",
  נ: "n",
  ן: "n",
  ס: "s",
  ע: "a",
  פ: "p",
  ף: "f",
  צ: "tz",
  ץ: "tz",
  ק: "k",
  ר: "r",
  ש: "sh",
  ת: "t",
};

/** Latin, lowercase, dash-separated slug. Hebrew is transliterated roughly. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => translit[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function slugFromWebsite(url: string | null | undefined) {
  if (!url) return "";
  try {
    const host = new URL(url.includes("://") ? url : `https://${url}`).hostname.replace(/^www\./, "");
    return slugify(host.split(".")[0] ?? "");
  } catch {
    return "";
  }
}
