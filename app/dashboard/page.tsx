import { redirect } from "next/navigation";

/** Dashboard removed — journey lives on Home. */
export default function DashboardRedirectPage() {
  redirect("/");
}
