import { combineReducers } from 'redux';

import playerReducer from './playerReducer';
import gameInfoReducer from './gameInfoReducer';

export default combineReducers({
    player: playerReducer,
    gameInfo: gameInfoReducer,
});
