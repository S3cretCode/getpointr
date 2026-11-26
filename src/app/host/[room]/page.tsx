import type { Metadata } from "next";
import HostView from "@/components/HostView";
import { normalizeRoom } from "@/lib/ids";

export const metadata: Metadata = {
  title: "Your session",
  description: "Your trusted helper can point while you stay in control.",
};

export default async function HostPage({ params }: PageProps<"/host/[room]">) {
  const { room } = await params;
  return <HostView room={normalizeRoom(room)} />;
}
