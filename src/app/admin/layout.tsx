import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal - Strazza Corp",
  description: "Administrative portal for managing firms and clients",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}