import { useState, useCallback } from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { Download, Play, Plus, Trash2 } from "lucide-react";
import Home from "./Home.tsx";
import DfaGraph from "./DfaGraph";
import { NFAState, Transition, DFAConversionResult } from "./types";
import { convertNFAtoDFA } from "./converter";
import "./App.css"; // Import the CSS file

function Converter() {
  const [states, setStates] = useState<NFAState[]>([]);
  const [startState, setStartState] = useState<string>("");
  const [finalStates, setFinalStates] = useState<Set<string>>(new Set());
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [convertedDFA, setConvertedDFA] = useState<DFAConversionResult | null>(null);
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
    <div className="app-container">
      <header className="header">
        <h1>NFA to DFA Converter</h1>
      </header>
      <main className="main-content">
        <div className="main-container">
          <div className="content-section">
            {/* States Section */}
            <div className="section">
              <h2>States</h2>
              <div className="states-container">
                {states.map((state) => (
                  <div key={state.name} className="state-item">
                    <div
                      className={`state-box ${finalStates.has(state.name) ? "final-state" : ""}`}
                      onClick={() => toggleFinalState(state.name)}
                      onDoubleClick={() => setStartState(state.name)}
                    >
                      {state.name}
                      {state.name === startState && (
                        <span className="start-state"> (start)</span>
                      )}
                    </div>
                    <button onClick={() => deleteState(state.name)} className="delete-button">
                      <Trash2 className="icon" />
                    </button>
                  </div>
                ))}
                <button onClick={addState} className="add-button">
                  <Plus className="icon" />
                  Add State
                </button>
              </div>
              <p className="instruction">
                Click a state to toggle final state • Double-click to set as start state
              </p>
            </div>

            {/* Transitions Section */}
            <div className="section">
              <h2>Transitions</h2>
              <div className="transitions-container">
                {transitions.map((transition, index) => (
                  <div key={index} className="transition-item">
                    <select
                      value={transition.from}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].from = e.target.value;
                        setTransitions(newTransitions);
                      }}
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
                    />
                    <select
                      value={transition.to}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].to = e.target.value;
                        setTransitions(newTransitions);
                      }}
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
                      className="delete-button"
                    >
                      <Trash2 className="icon" />
                    </button>
                  </div>
                ))}
                <button onClick={addTransition} className="add-button">
                  <Plus className="icon" />
                  Add Transition
                </button>
              </div>
            </div>

            {/* Display NFA Transition Table */}
            <div className="section">
              <h2>NFA Transition Table</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>From State</th>
                      <th>Input</th>
                      <th>To State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transitions.map((t, index) => (
                      <tr key={index}>
                        <td>{t.from}</td>
                        <td>{t.input}</td>
                        <td>{t.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="actions-section">
              <div className="action-buttons">
                <button
                  onClick={handleConvert}
                  disabled={!startState || !isValidTransition}
                  className="convert-button"
                >
                  <Play className="icon" />
                  Convert to DFA
                </button>
                <button
                  onClick={exportData}
                  disabled={!convertedDFA}
                  className="export-button"
                >
                  <Download className="icon" />
                  Export
                </button>
              </div>
              <button onClick={clearAll} className="clear-button">
                <Trash2 className="icon" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Display DFA Transition Table and Graph */}
        {convertedDFA && graphData && (
          <>
            <div className="section">
              <h2>DFA Transition Table</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>State</th>
                      {convertedDFA.states[0] &&
                        Array.from(convertedDFA.states[0].transitions.keys()).map((symbol) => (
                          <th key={symbol}>{symbol}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {convertedDFA.states.map((state) => (
                      <tr key={state.name}>
                        <td>
                          {state.name}
                          {state.name === convertedDFA.startState && (
                            <span className="start-state">(start)</span>
                          )}
                          {state.isFinal && (
                            <span className="final-state">(final)</span>
                          )}
                        </td>
                        {Array.from(state.transitions.keys()).map((symbol) => (
                          <td key={symbol}>{state.transitions.get(symbol)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section">
              <h2>DFA Graph</h2>
              <DfaGraph data={graphData} title="DFA Graph" />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <div>
        <nav className="navbar">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/converter">Converter</Link>
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