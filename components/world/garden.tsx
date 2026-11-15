import Image from "next/image";
import type { GroupMemberStatus } from "@/types";
import { GardenCharacters } from "./garden-characters";
import { Icon } from "@/components/ui/icons";

export function Garden({
  progress,
  members = [],
  name = "The Little Sprouts",
}: {
  progress: number;
  members?: GroupMemberStatus[];
  name?: string;
}) {
  const stage =
    progress >= 100
      ? 4
      : progress >= 80
        ? 3
        : progress >= 60
          ? 2
          : progress >= 25
            ? 1
            : 0;
  const label = [
    "A little seed of something",
    "A new friend awakens",
    "Growing, together",
    "A flourishing little world",
    "Your garden is in full bloom",
  ][stage];
  return (
    <div className={`garden-scene stage-${stage}`}>
      <Image
        src="/dig-in/garden-starter.png"
        alt={`A shared pixel woodland garden. ${label}.`}
        fill
        sizes="(max-width: 760px) 100vw, 700px"
        priority
      />
      <Image
        src="/dig-in/garden.png"
        alt=""
        fill
        sizes="(max-width: 760px) 100vw, 700px"
        className="garden-growth-layer"
        style={{ opacity: [0, 0.2, 0.65, 0.9, 1][stage] }}
      />
      <span className="garden-label">
        <Icon name="leaf" size={15} /> {name}
      </span>
      <GardenCharacters members={members} />
    </div>
  );
}
