// utils.ts
import { Transition } from './types';

/**
 * Computes the epsilon-closure for the given state names.
 */
export function getEpsilonClosure(
  states: string[],
  transitions: Transition[]
): Set<string> {
  const closure = new Set(states);
  const stack = [...states];

  while (stack.length > 0) {
    const currentState = stack.pop()!;
    const epsilonTransitions = transitions.filter(
      (t) => t.from === currentState && t.input === 'ε'
    );
    for (const transition of epsilonTransitions) {
      if (!closure.has(transition.to)) {
        closure.add(transition.to);
        stack.push(transition.to);
      }
    }
  }
  return closure;
}

/**
 * For a given set of states and input symbol, get the next set.
 */
export function move(
  states: Set<string>,
  symbol: string,
  transitions: Transition[]
): Set<string> {
  const nextStates = new Set<string>();
  for (const state of states) {
    const validTransitions = transitions.filter(
      (t) => t.from === state && t.input === symbol
    );
    for (const transition of validTransitions) {
      nextStates.add(transition.to);
    }
  }
  return nextStates;
}

/**
 * Generates a string representation for a set of states.
 */
export function getStateSetName(stateSet: Set<string>): string {
  return `{${Array.from(stateSet).sort().join(',')}}`;
}
    