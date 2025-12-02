"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  collapsed?: boolean;
  href?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  collapsed = false,
  href = "/",
}) => {
  const logoElement = (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="deusXmachina Logo"
        width={collapsed ? 32 : 180}
        height={32}
        className={cn(collapsed ? "mx-auto" : "")}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
};
