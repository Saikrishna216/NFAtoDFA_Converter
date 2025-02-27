// App.tsx
import { useState, useCallback } from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { Download, Play, Plus, Trash2 } from "lucide-react";
import Home from "./Home.tsx";
import DfaGraph from "./DfaGraph";
import { NFAState, Transition, DFAConversionResult } from "./types";
import { convertNFAtoDFA } from "./converter";

// Converter Component containing your NFA-to-DFA converter logic
function Converter() {
  const [states, setStates] = useState<NFAState[]>([]);
  const [startState, setStartState] = useState<string>("");
  const [finalStates, setFinalStates] = useState<Set<string>>(new Set());
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [convertedDFA, setConvertedDFA] = useState<DFAConversionResult | null>(null);

  // Graph data for vis-network
  const [graphData, setGraphData] = useState<{
    states: string[];
    startState: string;
    finalStates: string[];
    transitions: [string, string, string][];
  } | null>(null);

  const addState = () => {
    const newState = `q${states.length}`;
    setStates((prev) => [...prev, { name: newState, transitions: [] }]);
  };

  const deleteState = (stateName: string) => {
    setStates((prev) => prev.filter((state) => state.name !== stateName));
    setTransitions((prev) =>
      prev.filter((transition) => transition.from !== stateName && transition.to !== stateName)
    );
    setFinalStates((prev) => {
      const newFinalStates = new Set(prev);
      newFinalStates.delete(stateName);
      return newFinalStates;
    });
    if (startState === stateName) {
      setStartState("");
    }
  };

  const addTransition = () => {
    setTransitions((prev) => [...prev, { from: "", to: "", input: "" }]);
  };

  const toggleFinalState = (state: string) => {
    setFinalStates((prev) => {
      const newFinalStates = new Set(prev);
      newFinalStates.has(state) ? newFinalStates.delete(state) : newFinalStates.add(state);
      return newFinalStates;
    });
  };

  const isValidTransition = transitions.every((t) => t.from && t.to && t.input);

  const handleConvert = () => {
    try {
      const dfa = convertNFAtoDFA(states, startState, Array.from(finalStates), transitions);
      setConvertedDFA(dfa);

      // Prepare graph data for vis-network.
      const dfaStates = dfa.states.map((s) => s.name);
      const dfaTransitions: [string, string, string][] = [];
      dfa.states.forEach((state) => {
        state.transitions.forEach((target, symbol) => {
          dfaTransitions.push([symbol, state.name, target]);
        });
      });
      setGraphData({
        states: dfaStates,
        startState: dfa.startState,
        finalStates: dfa.finalStates,
        transitions: dfaTransitions,
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const exportData = useCallback(() => {
    const data = {
      nfa: { states, startState, finalStates: Array.from(finalStates), transitions },
      dfa: convertedDFA,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nfa-dfa-conversion.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [states, startState, finalStates, transitions, convertedDFA]);

  const clearAll = () => {
    setStates([]);
    setStartState("");
    setFinalStates(new Set());
    setTransitions([]);
    setConvertedDFA(null);
    setGraphData(null);
  };

  return (
    <div className="min-h-screen">
      <header className="py-4 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">NFA to DFA Converter</h1>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <div className="main-container">
          {/* Input Sections */}
          <div className="space-y-6">
            {/* States Section */}
            <div>
              <h2 className="text-lg font-medium mb-4">States</h2>
              <div className="flex flex-wrap gap-2">
                {states.map((state) => (
                  <div key={state.name} className="flex items-center space-x-2">
                    <div
                      className={`px-4 py-2 rounded-full border cursor-pointer ${
                        finalStates.has(state.name)
                          ? "border-indigo-500 bg-indigo-700"
                          : "border-gray-500 bg-gray-800"
                      }`}
                      onClick={() => toggleFinalState(state.name)}
                      onDoubleClick={() => setStartState(state.name)}
                    >
                      {state.name}
                      {state.name === startState && (
                        <span className="ml-1 text-green-400"> (start)</span>
                      )}
                    </div>
                    <button onClick={() => deleteState(state.name)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addState}
                  className="inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add State
                </button>
              </div>
              <p className="mt-2 text-sm">
                Click a state to toggle final state • Double-click to set as start state
              </p>
            </div>

            {/* Transitions Section */}
            <div>
              <h2 className="text-lg font-medium mb-4">Transitions</h2>
              <div className="space-y-2">
                {transitions.map((transition, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={transition.from}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].from = e.target.value;
                        setTransitions(newTransitions);
                      }}
                      className="rounded-md"
                    >
                      <option value="">From State</option>
                      {states.map((state) => (
                        <option key={state.name} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={transition.input}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].input = e.target.value;
                        setTransitions(newTransitions);
                      }}
                      placeholder="Input (ε for epsilon)"
                      className="rounded-md w-32"
                    />
                    <select
                      value={transition.to}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].to = e.target.value;
                        setTransitions(newTransitions);
                      }}
                      className="rounded-md"
                    >
                      <option value="">To State</option>
                      {states.map((state) => (
                        <option key={state.name} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const newTransitions = transitions.filter((_, i) => i !== index);
                        setTransitions(newTransitions);
                      }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addTransition} className="inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Transition
                </button>
              </div>
            </div>

            {/* Display NFA Transition Table */}
            <div>
              <h2 className="text-lg font-medium mb-4">NFA Transition Table</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y border">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 border">From State</th>
                      <th className="px-4 py-2 border">Input</th>
                      <th className="px-4 py-2 border">To State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border">
                    {transitions.map((t, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 border">{t.from}</td>
                        <td className="px-4 py-2 border">{t.input}</td>
                        <td className="px-4 py-2 border">{t.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <div className="space-x-2">
                <button
                  onClick={handleConvert}
                  disabled={!startState || !isValidTransition}
                  className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Convert to DFA
                </button>
                <button
                  onClick={exportData}
                  disabled={!convertedDFA}
                  className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-gray-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
              <button
                onClick={clearAll}
                className="inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium bg-white hover:bg-gray-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Display DFA Transition Table Above the Graph */}
        {convertedDFA && graphData && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-medium mb-4">DFA Transition Table</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y border">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 border">State</th>
                    {convertedDFA.states[0] &&
                      Array.from(convertedDFA.states[0].transitions.keys()).map((symbol) => (
                        <th key={symbol} className="px-4 py-2 border">
                          {symbol}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y border">
                  {convertedDFA.states.map((state) => (
                    <tr key={state.name}>
                      <td className="px-4 py-2 border">
                        {state.name}
                        {state.name === convertedDFA.startState && (
                          <span className="ml-1 text-green-400">(start)</span>
                        )}
                        {state.isFinal && (
                          <span className="ml-1 text-red-400">(final)</span>
                        )}
                      </td>
                      {Array.from(state.transitions.keys()).map((symbol) => (
                        <td key={symbol} className="px-4 py-2 border">
                          {state.transitions.get(symbol)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Display DFA Graph using vis-network */}
        {convertedDFA && graphData && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-medium mb-4">DFA Graph</h2>
            <DfaGraph data={graphData} title="DFA Graph" />
          </div>
        )}
      </main>
    </div>
  );
}

// Main App component with routing
function App() {
  return (
    <HashRouter>
      <div>
        <nav className="bg-gray-800 text-white p-4">
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="hover:text-gray-300">Home</Link>
            </li>
            <li>
              <Link to="/converter" className="hover:text-gray-300">Converter</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/converter" element={<Converter />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
