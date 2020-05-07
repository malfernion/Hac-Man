import React from 'react';

export default class GameBoard extends React.Component {
    boardSize = 800;
    ctx = null;

    clearBoard() {
        this.ctx.clearRect(0, 0, this.boardSize, this.boardSize);
    }

    drawPlayer() {
        const { position, size } = this.props.player;

        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, size, 0, Math.PI * 2, true);
        this.ctx.fillStyle = 'rgb(255, 255, 0)';
        this.ctx.fill();
    }

    doDrawing() {
        if(this.ctx) {
            this.clearBoard();
            this.drawPlayer();
        }
    }

    componentDidMount() {
        const canvas = document.getElementById('gameCanvas');
        if(canvas && canvas.getContext) {
            this.ctx = canvas.getContext('2d');
        }
        this.doDrawing();
    }

    render() {
        this.doDrawing();

        return (
            <section className="Game-board">
                <canvas id="gameCanvas" width={this.boardSize} height={this.boardSize}>
                    <span>Sorry, the game requires canvas support which you don't appear to have..</span>
                </canvas>
            </section>
        );
    }
}
