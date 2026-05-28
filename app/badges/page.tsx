import { redirect } from "next/navigation";

/** Legacy route — badges live in profile Collections. */
export default function BadgesRedirectPage() {
  redirect("/profile/me");
}
