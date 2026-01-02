"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@mui/material/Breadcrumbs";

// Utility function to detect dynamic path parameters (IDs, UUIDs, etc.)
const isPathParam = (segment: string): boolean => /^\d+$/.test(segment) || /^[a-f0-9]{6,}$/i.test(segment);

export default function DynamicBreadcrumbs(): JSX.Element {
  const pathname = usePathname();

  // Split pathname into segments and filter out dynamic path parameters (like IDs)
  const pathSegments: string[] = pathname
    .split("/")
    .filter((segment: string) => segment && !isPathParam(segment)) // Remove path params
    .map((segment: string) =>
      segment
        .replace(/-/g, " ") // Replace hyphens with spaces
        .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter
    );

  return (
    <Breadcrumbs aria-label="breadcrumb" className="m-5">
      {/* Home Link */}
      <Link href="/" passHref style={{ textDecoration: "none", color: "inherit" }}>
        Home
      </Link>

      {pathSegments.length > 0 &&
        pathSegments.map((value: string, index: number) => {
          // Construct breadcrumb path up to the current segment
          const href = `/${pathname
            .split("/")
            .filter((segment: string) => segment && !isPathParam(segment))
            .slice(0, index + 1)
            .join("/")}`;

          const isLast: boolean = index === pathSegments.length - 1;

          return isLast ? (
            <span key={href} style={{ color: "gray" }}>
              {decodeURIComponent(value)}
            </span>
          ) : (
            <Link
              key={href}
              href={href}
              passHref
              style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
            >
              {decodeURIComponent(value)}
            </Link>
          );
        })}
    </Breadcrumbs>
  );
}
