import Navbar from "@/components/home/Navbar";
import { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col justify-between">
        <Navbar/>
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default PublicLayout;
