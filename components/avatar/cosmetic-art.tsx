export function CosmeticArt({ id }: { id: string }) {
  return (
    <svg
      className={`cosmetic-art cosmetic-${id}`}
      width="100"
      height="100"
      viewBox="0 0 48 48"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {id === "hoodie" ? (
        <>
          <path fill="#303F2E" d="M15 5h18v3h5v5h5v23h-8v8H13v-8H5V13h5V8h5z" />
          <path
            fill="#78965B"
            d="M16 7h16v4h5v5h4v18h-6V18h-2v24H15V18h-2v16H7V16h4v-5h5z"
          />
          <path
            fill="#4F7045"
            d="M16 7h16v7H16zM18 31h12v7H18zM11 17h2v16h-2zM35 17h2v16h-2z"
          />
          <path
            fill="#DDE2B5"
            d="M19 13h3v11h-3zM27 13h3v11h-3zM19 10h11v3H19z"
          />
          <path fill="#E1B854" d="M28 25h4v4h-4z" />
        </>
      ) : id === "crown" ? (
        <>
          <path
            fill="#846026"
            d="M3 9h6v4h4V5h7v7h8V5h7v8h4V9h6v25h-3v7H6v-7H3z"
          />
          <path
            fill="#E7B650"
            d="M5 12h3v5h7V8h3v9h12V8h3v9h7v-5h3v20h-3v6H8v-6H5z"
          />
          <path
            fill="#FFE393"
            d="M9 28h30v4H9zM8 18h4v7H8zM20 18h7v5h-7zM36 18h4v7h-4z"
          />
          <path fill="#79945C" d="M21 28h6v7h-6z" />
          <path fill="#C28A45" d="M8 36h32v3H8z" />
        </>
      ) : (
        <>
          <path
            fill="#6C4B2E"
            d="M2 13h19v3h6v-3h19v19h-3v4H30v-4h-3V21h-6v11h-3v4H5v-4H2z"
          />
          <path fill="#293D37" d="M5 16h13v16H5zM30 16h13v16H30z" />
          <path fill="#6C9684" d="M7 18h9v4H7zM32 18h9v4h-9z" />
          <path fill="#A8C4A3" d="M8 18h4v3H8zM33 18h4v3h-4z" />
          <path fill="#C49652" d="M5 14h13v2H5zM30 14h13v2H30zM21 17h6v2h-6z" />
        </>
      )}
    </svg>
  );
}
