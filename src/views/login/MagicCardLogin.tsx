"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagicCard } from "@/components/magicui/magic-card";
import { useTheme } from "next-themes";

export function MagicCardLogin() {
  const { theme } = useTheme();
  return (
    <Card className="p-0 w-full shadow-none border-none rounded-xl">
  <MagicCard
    className="rounded-xl"
    gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
  >
        
      </MagicCard>
    </Card>
  );
}
