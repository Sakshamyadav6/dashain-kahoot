import { Suspense } from "react";
import { JoinForm } from "@/components/player/JoinForm";
import { LoadingScreen } from "@/components/ui";

export const metadata = { title: "Join" };

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Join" />}>
      <JoinForm />
    </Suspense>
  );
}
