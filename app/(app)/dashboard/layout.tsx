// app/(app)/layout.tsx or app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Leader dashboard in Alayon App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
   {children}
   </>
  );
}
