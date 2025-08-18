import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Firm Dashboard - Strazza Corp",
  description: "Firm management dashboard for client and account management",
};

export default function FirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}