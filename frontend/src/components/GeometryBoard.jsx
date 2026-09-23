import { useEffect, useId, useRef } from "react";
import JXG from "jsxgraph";
import "../../node_modules/jsxgraph/distrib/jsxgraph.css";

export default function GeometryBoard({ mode = "triangle" }) {
  const rawId = useId();
  const boardId = `jxg-${rawId.replace(/:/g, "")}`;
  const boardRef = useRef(null);

  useEffect(() => {
    const board = JXG.JSXGraph.initBoard(boardId, {
      boundingbox: [-1, 6, 7, -1],
      axis: mode === "line",
      showCopyright: false,
      showNavigation: false,
      keepaspectratio: true,
    });
    boardRef.current = board;

    if (mode === "line") {
      const a = board.create("point", [0, 1], { name: "(0,1)", size: 3, fixed: true });
      const b = board.create("point", [3, 4], { name: "(3,4)", size: 3, fixed: true });
      board.create("line", [a, b], { straightFirst: true, straightLast: true, strokeWidth: 2 });
    } else {
      const a = board.create("point", [1, 1], { name: "", visible: false, fixed: true });
      const b = board.create("point", [5, 1], { name: "", visible: false, fixed: true });
      const c = board.create("point", [1, 4], { name: "", visible: false, fixed: true });
      board.create("polygon", [a, b, c], {
        fillColor: "#eef4ff",
        fillOpacity: 0.8,
        borders: { strokeColor: "#173a78", strokeWidth: 2 },
      });
      board.create("text", [2.8, 0.65, "4"], { fixed: true });
      board.create("text", [0.65, 2.5, "3"], { fixed: true });
      board.create("text", [3.2, 2.8, "5"], { fixed: true });
    }

    return () => {
      JXG.JSXGraph.freeBoard(board);
      boardRef.current = null;
    };
  }, [boardId, mode]);

  return <div id={boardId} className="geometry-board" aria-label="Visualisasi geometri interaktif" />;
}
