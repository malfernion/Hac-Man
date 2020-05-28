import React from 'react';
import GameBackground from './GameBackground';

export default class GameBoard extends React.Component {
    clearCanvas(ctx) {
        ctx.clearRect(0, 0, this.props.level.boardSize, this.props.level.boardSize);
    }

    drawPlayer(ctx) {
        const { position, size } = this.props.player;

        ctx.lineWidth = '1';
        ctx.strokeStyle ='yellow';
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(position.x, position.y, size/2, 0, Math.PI * 2, true);
        ctx.fill();
    }

    doDrawing() {
        if(this.activeCtx) {
            this.clearCanvas(this.activeCtx);
            this.drawPlayer(this.activeCtx);
        }
    }

    componentDidMount() {
        const activeCanvas = document.getElementById('active-canvas');
        if(activeCanvas && activeCanvas.getContext) {
            this.activeCtx = activeCanvas.getContext('2d');
        }
        this.doDrawing();
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
