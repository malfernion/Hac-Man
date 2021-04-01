import React from 'react';
import { connect } from 'react-redux';
import { introFinished } from '../actions/gameInfoActions';

class GameAudio extends React.Component {

    componentDidUpdate(oldProps) {
        const { playingIntro, gameStarted, score } = this.props.gameInfo;
        const { playingIntro: oldPlayingIntro, gameStarted: oldGameStarted, score: oldScore } = oldProps.gameInfo;

        if(playingIntro && !oldPlayingIntro) {
            this.playIntro();
        }
        
        if(gameStarted && !oldGameStarted) {
            this.siren.play();
        } else if(!gameStarted && oldGameStarted) {
            this.siren.pause();
            this.siren.currentTime = 0;
        }

        if(score !== oldScore && score !== 0) {
            this.playWacka();
        }
    };

    playIntro() {
        this.intro.pause();
        this.intro.currentTime = 0;
        this.intro.play();
    }

    playSiren() {
        this.siren.pause();
        this.siren.currentTime = 0;
        this.siren.play();
    }

    playWacka() {
        this.wacka1.pause();
        this.wacka1.currentTime = 0;
        this.wacka2.pause();
        this.wacka2.currentTime = 0;
        this.wacka1.play();
    }

    componentDidMount() {
        this.intro = new Audio();
        this.intro.src = require('../assets/game_start.wav');
        this.intro.addEventListener('ended', () => {
            this.props.introFinished();
        },false);

        this.siren = new Audio();
        this.siren.src = require('../assets/siren.wav');
        this.siren.addEventListener('ended', () => {
            if(this.props.gameInfo.gameStarted) {
                this.siren.pause();
                this.siren.currentTime = 0;
                this.siren.play();
            }
        },false);

        this.wacka1 = new Audio();
        this.wacka1.src = require('../assets/munch_1.wav');
        this.wacka2 = new Audio();
        this.wacka2.src = require('../assets/munch_2.wav');

        this.wacka1.addEventListener('ended', () => {
            this.wacka2.play();
        },false);
    }

    render() {
        return null;
    }
}

const mapDispatchToProps = dispatch => ({
    introFinished: () => dispatch(introFinished()),
});
  
export default connect(null, mapDispatchToProps)(GameAudio);