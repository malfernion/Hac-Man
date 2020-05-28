import React from 'react';
import GameBackground from './GameBackground';

export default class GameBoard extends React.Component {
    clearCanvas(ctx) {
        ctx.clearRect(0, 0, this.props.level.boardSize, this.props.level.boardSize);
    }

    drawPlayer(ctx) {
        const { position, size } = this.props.player;
        ctx.drawImage(this.sprite, 2+0, 64, 16, 16, position.x-size/2, position.y-size/2, size, size);

        // ctx.lineWidth = '1';
        // ctx.strokeStyle ='yellow';
        // ctx.fillStyle = 'yellow';
        // ctx.beginPath();
        // ctx.arc(position.x, position.y, size/2, 0, Math.PI * 2, true);
        // ctx.fill();
    }

    doDrawing() {
        if(this.activeCtx) {
            this.clearCanvas(this.activeCtx);
            this.drawPlayer(this.activeCtx);
        }
    }

    componentDidMount() {
        const activeCanvas = document.getElementById('active-canvas');
        this.activeCtx = activeCanvas.getContext('2d');

        this.sprite = new Image();
        this.sprite.src = require('../assets/sprites_16_x_16.png');
        this.sprite.onload = () => {
            this.spriteLoaded = true;
            this.doDrawing();
        };
    }

    render() {
        const {level: { boardSize }} = this.props;
        this.doDrawing();

        return (
            <section className="game-board">
                <GameBackground level={this.props.level}></GameBackground>
                <canvas id="active-canvas" width={boardSize} height={boardSize}>
                    <span>Sorry, the game requires canvas support which you don't appear to have..</span>
                </canvas>
            </section>
        );
    }
}
