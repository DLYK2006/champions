import { Suspense } from "react";
import { ProfileController } from "@/components/profile/ProfileController";

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Opening Profile...</p>}>
      <ProfileController />
    </Suspense>
  );
}
