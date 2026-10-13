import Link from "next/link";
import { getCategories } from "@/lib/queries";
import { CompanyEditor } from "../company-editor";
import { PageHeader } from "../../_components/ui";

export const metadata = { title: "חברה חדשה" };

export default async function NewCompanyPage() {
  const categories = await getCategories();
  return (
    <>
      <Link href="/admin/companies" className="text-sm text-muted hover:text-ink">
        → כל החברות
      </Link>
      <div className="mt-2">
        <PageHeader title="חברה חדשה" description="חברה שנוצרת כאן עולה לאוויר מיד אם הסטטוס ״באוויר״." />
      </div>
      <CompanyEditor
        categories={categories}
        initial={{
          name: "",
          slug: "",
          category: categories[0]?.id ?? "other",
          tagline: "",
          about: "",
          website: "",
          socialUrl: "",
          registryId: "",
          registryVerified: false,
          city: "",
          founded: "",
          priceRange: "",
          status: "published",
          adminNote: "",
        }}
      />
    </>
  );
}
