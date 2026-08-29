import type { Metadata } from "next";
import TechnocoreAdmin from "@/components/admin/TechnocoreAdmin";

export const metadata: Metadata = {
  title: "Technocore Admin — AgentFlow Engine",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <TechnocoreAdmin />;
}
