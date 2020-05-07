import { combineReducers } from 'redux';

import playerReducer from './playerReducer';
import gameInfoReducer from './gameInfoReducer';
import levelReducer from './levelReducer';

export default combineReducers({
    player: playerReducer,
    gameInfo: gameInfoReducer,
    levels: levelReducer,
});
