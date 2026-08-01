import { useReducer } from 'react';

const initialState = {
  status: 'idle', // 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error'
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  qualities: [],
  currentQuality: -1, // -1 = Auto
  errorMessage: null,
};

function playerReducer(state, action) {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_TIME':
      return { 
        ...state, 
        currentTime: action.payload.currentTime, 
        duration: action.payload.duration || state.duration 
      };
    case 'SET_BUFFERED':
      return { ...state, buffered: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload, isMuted: action.payload === 0 };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'SET_SPEED':
      return { ...state, playbackRate: action.payload };
    case 'SET_QUALITIES':
      return { ...state, qualities: action.payload };
    case 'SET_CURRENT_QUALITY':
      return { ...state, currentQuality: action.payload };
    case 'SET_ERROR':
      return { ...state, status: 'error', errorMessage: action.payload };
    default:
      return state;
  }
}

export function usePlayerState() {
  return useReducer(playerReducer, initialState);
}