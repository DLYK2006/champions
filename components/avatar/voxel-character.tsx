import type { CSSProperties } from "react";
import type { AvatarConfig } from "@/types";

function color(value: string | undefined, fallback: string) {
  return value && /^#?[0-9a-f]{6}$/i.test(value)
    ? `#${value.replace("#", "")}`
    : fallback;
}
function Block({
  part,
  x,
  y,
  w,
  h,
  d,
  tone,
}: {
  part: string;
  x: number;
  y: number;
  w: number;
  h: number;
  d: number;
  tone: string;
}) {
  return (
    <span
      className={`voxel-block voxel-${part}`}
      style={
        {
          "--x": `${x}px`,
          "--y": `${y}px`,
          "--w": `${w}px`,
          "--h": `${h}px`,
          "--d": `${d}px`,
          "--tone": tone,
        } as CSSProperties
      }
    >
      {["front", "back", "left", "right", "top", "bottom"].map((face) => (
        <span className={`block-face face-${face}`} key={face}>
          {face === "front" && part === "head" && (
            <>
              <i className="voxel-eyes" />
              <i className="voxel-mouth" />
            </>
          )}
          {face === "front" && part === "body" && (
            <i className="voxel-shirt-detail" />
          )}
        </span>
      ))}
    </span>
  );
}

export function VoxelCharacter({
  config,
  equipped = [],
  variant = 0,
  name,
}: {
  config?: AvatarConfig;
  equipped?: string[];
  variant?: number;
  name?: string;
}) {
  const skin = color(
    config?.skinColor,
    ["#DCA16E", "#F0C29D", "#AB7252", "#EAC399"][variant % 4],
  );
  const hair = color(
    config?.hairColor,
    ["#643D29", "#352F2B", "#92512D", "#573C32"][variant % 4],
  );
  const shirt =
    equipped.includes("hoodie") || config?.clothing === "hoodie"
      ? "#527548"
      : config?.clothing === "overall"
        ? "#688A94"
        : config?.clothing === "graphicShirt"
          ? "#D4AB55"
          : "#EFE1C0";
  return (
    <span
      className={`voxel-character ${equipped.includes("sunglasses") ? "has-glasses" : ""} ${equipped.includes("hoodie") ? "has-hoodie" : ""}`}
      style={{ "--skin": skin } as CSSProperties}
      role={name ? "img" : undefined}
      aria-label={name ? `${name}, block character` : undefined}
      aria-hidden={!name}
      data-eyes={config?.eyes}
      data-mouth={config?.mouth}
    >
      <span className="voxel-rig">
        <Block part="head" x={10} y={5} w={24} h={22} d={20} tone={skin} />
        <Block
          part="hair"
          x={9}
          y={0}
          w={26}
          h={10}
          d={22}
          tone={config?.top === "hat" ? "#81985B" : hair}
        />
        {config?.top === "bun" && (
          <Block part="bun" x={17} y={-5} w={11} h={8} d={12} tone={hair} />
        )}
        <Block part="body" x={13} y={27} w={18} h={22} d={12} tone={shirt} />
        <Block part="arm-left" x={6} y={27} w={6} h={22} d={10} tone={shirt} />
        <Block
          part="arm-right"
          x={33}
          y={27}
          w={6}
          h={22}
          d={10}
          tone={shirt}
        />
        <Block
          part="leg-left"
          x={13}
          y={49}
          w={8}
          h={19}
          d={10}
          tone="#4F5650"
        />
        <Block
          part="leg-right"
          x={23}
          y={49}
          w={8}
          h={19}
          d={10}
          tone="#4F5650"
        />
        {equipped.includes("crown") && (
          <Block part="crown" x={8} y={-5} w={28} h={7} d={24} tone="#E6B74E" />
        )}
      </span>
    </span>
  );
}
