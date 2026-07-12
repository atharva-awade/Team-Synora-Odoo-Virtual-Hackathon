import { redirect } from "next/navigation";

// The cinematic public landing page is built in a later phase. For now the
// root routes users into the application (which bounces to /login if needed).
export default function Home() {
  redirect("/dashboard");
}
