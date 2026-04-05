import { combineReducers } from 'redux';
import playerReducer from './playerReducer';
import gameInfoReducer from './gameInfoReducer';
import levelReducer from './levelReducer';
import ghostsReducer from './ghostsReducer';

const rootReducer = combineReducers({
  player: playerReducer,
  gameInfo: gameInfoReducer,
  levels: levelReducer,
  ghosts: ghostsReducer,
});

export default rootReducer;
