import Link from "next/link";
import { CompanyEditor } from "../company-editor";
import { PageHeader } from "../../_components/ui";

export const metadata = { title: "חברה חדשה" };

export default function NewCompanyPage() {
  return (
    <>
      <Link href="/admin/companies" className="text-sm text-muted hover:text-ink">
        → כל החברות
      </Link>
      <div className="mt-2">
        <PageHeader title="חברה חדשה" description="חברה שנוצרת כאן עולה לאוויר מיד אם הסטטוס ״באוויר״." />
      </div>
      <CompanyEditor
        initial={{
          name: "",
          slug: "",
          category: "courses",
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
