// converter.tsx
import { NFAState, Transition, DFAState, DFAConversionResult } from './types';
import { getEpsilonClosure, move, getStateSetName } from './utils';

export function convertNFAtoDFA(
  states: NFAState[],
  startState: string,
  finalStates: string[],
  transitions: Transition[]
): DFAConversionResult {
  if (!startState || states.length === 0) {
    throw new Error('Invalid input: Start state and states are required');
  }
  // Determine non-epsilon input symbols
  const inputSymbols = Array.from(
    new Set(transitions.map((t) => t.input).filter((input) => input !== 'ε' && input !== ''))
  ).sort();

  if (inputSymbols.length === 0) {
    throw new Error('Invalid input: At least one non-epsilon transition is required');
  }

  const dfaStatesMap = new Map<string, DFAState>();
  const dfaFinalStates: string[] = [];
  const conversionSteps: DFAConversionResult['steps'] = [];

  // Compute epsilon closure for start state.
  const initialStateSet = getEpsilonClosure([startState], transitions);
  const initialStateName = getStateSetName(initialStateSet);
  const initialDFAState: DFAState = {
    name: initialStateName,
    transitions: new Map(),
    isFinal: Array.from(initialStateSet).some((s) => finalStates.includes(s)),
  };
  dfaStatesMap.set(initialStateName, initialDFAState);
  if (initialDFAState.isFinal) {
    dfaFinalStates.push(initialStateName);
  }
  conversionSteps.push({
    description: `Starting with ε-closure of start state ${startState}: ${Array.from(initialStateSet).join(', ')}`,
    stateSet: Array.from(initialStateSet),
    newTransitions: [],
  });

  const stateQueue: Set<string>[] = [initialStateSet];

  while (stateQueue.length > 0) {
    const currentStateSet = stateQueue.shift()!;
    const currentStateName = getStateSetName(currentStateSet);
    const currentDFAState = dfaStatesMap.get(currentStateName);
    if (!currentDFAState) continue; // Should not occur.

    const newTransitions: { from: string; input: string; to: string }[] = [];

    for (const symbol of inputSymbols) {
      // Get all states reachable on symbol from current set.
      const moveResult = move(currentStateSet, symbol, transitions);

      // Expand via epsilon closure.
      const nextStateSet = new Set<string>();
      for (const state of moveResult) {
        const epsilonClosure = getEpsilonClosure([state], transitions);
        epsilonClosure.forEach(s => nextStateSet.add(s));
      }

      if (nextStateSet.size > 0) {
        const nextStateName = getStateSetName(nextStateSet);
        currentDFAState.transitions.set(symbol, nextStateName);
        newTransitions.push({ from: currentStateName, input: symbol, to: nextStateName });

        if (!dfaStatesMap.has(nextStateName)) {
          const newDFAState: DFAState = {
            name: nextStateName,
            transitions: new Map(),
            isFinal: Array.from(nextStateSet).some((s) => finalStates.includes(s)),
          };
          dfaStatesMap.set(nextStateName, newDFAState);
          if (newDFAState.isFinal) {
            dfaFinalStates.push(nextStateName);
          }
          stateQueue.push(nextStateSet);
        }
      } else {
        // Define a dead state.
        const deadStateName = 'ø';
        currentDFAState.transitions.set(symbol, deadStateName);
        newTransitions.push({ from: currentStateName, input: symbol, to: deadStateName });
        if (!dfaStatesMap.has(deadStateName)) {
          const deadState: DFAState = {
            name: deadStateName,
            transitions: new Map(inputSymbols.map(s => [s, deadStateName])),
            isFinal: false,
          };
          dfaStatesMap.set(deadStateName, deadState);
        }
      }
    }
    conversionSteps.push({
      description: `Processed state ${currentStateName}`,
      stateSet: Array.from(currentStateSet),
      newTransitions,
    });
  }

  return {
    states: Array.from(dfaStatesMap.values()),
    startState: initialStateName,
    finalStates: dfaFinalStates,
    steps: conversionSteps,
  };
}
