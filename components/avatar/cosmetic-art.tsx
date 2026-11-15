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
      {id === "sage-sweater" || id === "rust-flannel" ? (
        <>
          <path
            fill="#403f30"
            d="M15 6h7v3h4V6h7l11 9-6 10-5-4v22H15V21l-5 4-6-10z"
          />
          <path
            fill={id === "sage-sweater" ? "#88a18a" : "#b87855"}
            d="M16 8h5v4h6V8h5l9 8-4 6-6-5v24H17V17l-6 5-4-6z"
          />
          {id === "sage-sweater" ? (
            <path
              fill="#627f68"
              d="M17 36h14v5H17zM8 17l3-2 3 4-3 3zM34 19l3-4 3 2-3 5zM19 8h2v4h6V8h2v6H19z"
            />
          ) : (
            <>
              <path
                fill="#734530"
                d="M20 13h3v27h-3zM28 13h3v27h-3zM17 20h14v3H17zM17 30h14v3H17zM9 16l3-3 5 6-3 3zM31 19l5-6 3 3-5 6z"
              />
              <path
                fill="#dba971"
                d="M24 12h1v29h-1zM17 26h14v1H17zM17 36h14v1H17z"
              />
              <path
                fill="#ead5a6"
                d="M24 17h2v2h-2zM24 25h2v2h-2zM24 33h2v2h-2z"
              />
            </>
          )}
        </>
      ) : id === "meadow-trousers" || id === "slate-cargos" ? (
        <>
          <path fill="#3d4437" d="M10 5h28v18l4 20H27l-3-18-3 18H6l4-20z" />
          <path
            fill={id === "meadow-trousers" ? "#727c52" : "#687d88"}
            d="M12 8h24v16l3 16h-9l-4-21h-4l-4 21H9l3-16z"
          />
          <path fill="#4c5140" d="M12 8h24v4H12zM9 37h10v3H9zM29 37h10v3H29z" />
          <path fill="#c4ad78" d="M22 8h5v4h-5z" />
          {id === "slate-cargos" ? (
            <>
              <path fill="#435b66" d="M10 23h10v9H9zM28 23h10l1 9H28z" />
              <path fill="#91a3a4" d="M10 23h10v2H10zM28 23h10v2H28z" />
            </>
          ) : (
            <path
              stroke="#a0a781"
              strokeWidth="1"
              fill="none"
              d="M13 13v7l5-5M35 13v7l-5-5M16 24l-3 11M32 24l3 11"
            />
          )}
        </>
      ) : id === "acorn-cap" ? (
        <>
          <path fill="#493d2b" d="M13 8h20v4h5v13h5v7H5v-7h5V12h3z" />
          <path fill="#9c7953" d="M15 10h16v4h5v12H12V14h3zM7 27h34v3H7z" />
          <path fill="#b99163" d="M16 12h5v12h-5zM10 27h28v2H10z" />
          <path fill="#695138" d="M12 23h24v4H12z" />
        </>
      ) : id === "fisher-bucket" ? (
        <>
          <path fill="#3d535b" d="M14 6h20l4 20 7 6v6H3v-6l7-6z" />
          <path fill="#83a4b1" d="M16 8h16l4 19 7 7v2H5v-2l7-7z" />
          <path fill="#698b99" d="M13 22h22l1 5H12zM6 32h36v4H6z" />
          <path fill="#acc5c9" d="M17 10h4l-2 11h-4zM8 31h32v2H8z" />
        </>
      ) : id === "hoodie" ? (
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
