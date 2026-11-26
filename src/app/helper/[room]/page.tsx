import type { Metadata } from "next";
import HelperView from "@/components/HelperView";
import { normalizeRoom } from "@/lib/ids";

export const metadata: Metadata = {
  title: "Helper console",
  description: "Guide someone through their phone with visual pointers.",
};

export default async function HelperPage({ params }: PageProps<"/helper/[room]">) {
  const { room } = await params;
  return <HelperView room={normalizeRoom(room)} />;
}
