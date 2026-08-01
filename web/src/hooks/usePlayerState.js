import { useReducer } from 'react';

// Player Durumları (State Machine)
export const PLAYER_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  BUFFERING: 'buffering',
  ERROR: 'error'
};

// State Geçiş Eylemleri (Actions)
export const PLAYER_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_PLAYING: 'SET_PLAYING',
  SET_PAUSED: 'SET_PAUSED',
  SET_BUFFERING: 'SET_BUFFERING',
  SET_ERROR: 'SET_ERROR',
  SET_LEVELS: 'SET_LEVELS',
  SET_CURRENT_LEVEL: 'SET_CURRENT_LEVEL'
};

const initialState = {
  status: PLAYER_STATES.IDLE, // idle | loading | playing | paused | buffering | error
  levels: [],                 // Kalite seviyeleri (1080p, 720p vb.)
  currentLevel: -1,           // -1 = Otomatik (ABR)
  errorMessage: null
};

function playerReducer(state, action) {
  switch (action.type) {
    case PLAYER_ACTIONS.SET_LOADING:
      return { ...state, status: PLAYER_STATES.LOADING, errorMessage: null };
    case PLAYER_ACTIONS.SET_PLAYING:
      return { ...state, status: PLAYER_STATES.PLAYING, errorMessage: null };
    case PLAYER_ACTIONS.SET_PAUSED:
      return { ...state, status: PLAYER_STATES.PAUSED };
    case PLAYER_ACTIONS.SET_BUFFERING:
      return { ...state, status: PLAYER_STATES.BUFFERING };
    case PLAYER_ACTIONS.SET_ERROR:
      return { ...state, status: PLAYER_STATES.ERROR, errorMessage: action.payload };
    case PLAYER_ACTIONS.SET_LEVELS:
      return { ...state, levels: action.payload };
    case PLAYER_ACTIONS.SET_CURRENT_LEVEL:
      return { ...state, currentLevel: action.payload };
    default:
      return state;
  }
}

export const usePlayerState = () => {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  return { state, dispatch };
};