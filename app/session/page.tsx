import { redirect } from "next/navigation";

/** Session page removed — daily flow lives on Home. */
export default function SessionRedirectPage() {
  redirect("/");
}
