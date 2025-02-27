// DfaGraph.tsx
import { useEffect, useRef } from "react";
import { Network } from "vis-network/standalone/esm/vis-network";
import "vis-network/styles/vis-network.css";

interface DfaGraphProps {
  data: {
    states: string[];
    startState: string;
    finalStates: string[];
    transitions: [string, string, string][];
  };
  title?: string;
}

const DfaGraph: React.FC<DfaGraphProps> = ({ data, title = "DFA Graph" }) => {
  const { states, startState, finalStates, transitions } = data;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create nodes with dark theme colors.
    const nodes = states.map((state) => ({
      id: state,
      label: state,
      color: {
        background: "#333333",
        border:
          state === startState
            ? "#00FF00"
            : finalStates.includes(state)
            ? "#FF4500"
            : "#AAAAAA",
      },
      borderWidth: state === startState || finalStates.includes(state) ? 3 : 1,
      font: { color: "#FFFFFF" },
      title:
        state === startState
          ? "Start State"
          : finalStates.includes(state)
          ? "Final State"
          : "State",
    }));

    // Group transitions and offset overlapping ones.
    const edgeGroups = new Map<string, { symbols: string[]; source: string; target: string }>();
    transitions.forEach(([symbol, source, target]) => {
      const key = `${source}-${target}`;
      if (edgeGroups.has(key)) {
        edgeGroups.get(key)!.symbols.push(symbol);
      } else {
        edgeGroups.set(key, { symbols: [symbol], source, target });
      }
    });
    const edges = [];
    edgeGroups.forEach((group) => {
      const { symbols, source, target } = group;
      const count = symbols.length;
      symbols.forEach((symbol, index) => {
        const roundness = (index - (count - 1) / 2) * 0.2;
        edges.push({
          id: `${source}-${target}-${index}`,
          from: source,
          to: target,
          label: symbol,
          arrows: "to",
          smooth: { type: "cubicBezier", roundness },
          font: { color: "#FFFFFF", align: "middle" },
          color: { color: "#CCCCCC" },
        });
      });
    });

    const networkData = { nodes, edges };
    const options = {
      autoResize: true,
      layout: { hierarchical: false, improvedLayout: true },
      nodes: {
        shape: "circle",
        size: 30,
        font: { size: 16 },
        borderWidth: 2,
        margin: 10,
      },
      edges: {
        width: 2,
        arrows: { to: { scaleFactor: 0.5 } },
        smooth: { type: "cubicBezier" },
      },
      physics: false,
    };

    const network = new Network(containerRef.current!, networkData, options);

    return () => {
      network.destroy();
    };
  }, [states, startState, finalStates, transitions]);

  return (
    <div className="DfaGraph">
      <h2 style={{ color: "#e0e0e0" }}>{title}</h2>
      <p style={{ color: "#e0e0e0" }}>
        <span style={{ color: "#FF4500" }}>Red</span> represents final states and{" "}
        <span style={{ color: "#00FF00" }}>green</span> represents the start state.
      </p>
      <div
        ref={containerRef}
        style={{
          height: "600px",
          borderRadius: "8px",
          background: "#222222",
        }}
      />
    </div>
  );
};

export default DfaGraph;
