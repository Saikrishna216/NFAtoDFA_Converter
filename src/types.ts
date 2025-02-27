// types.ts
export interface NFAState {
    name: string;
    transitions: Transition[];
  }
  
  export interface Transition {
    from: string;
    to: string;
    input: string;
  }
  
  export interface DFAState {
    name: string;
    transitions: Map<string, string>;
    isFinal: boolean;
  }
  
  export interface DFAConversionStep {
    description: string;
    stateSet: string[];
    newTransitions: { from: string; input: string; to: string }[];
  }
  
  export interface DFAConversionResult {
    states: DFAState[];
    startState: string;
    finalStates: string[];
    steps: DFAConversionStep[];
  }
  