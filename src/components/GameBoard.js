import React from 'react';

export default class GameBoard extends React.Component {

    constructor(props) {
        super(props);
        this.boardSize = 812;
        this.ctx = null;
        this.wallWidth = 12;
    }

    clearBoard() {
        this.ctx.clearRect(0, 0, this.boardSize, this.boardSize);
    }

    drawPlayer() {
        const { position, size } = this.props.player;

        this.ctx.lineWidth = '1';
        this.ctx.strokeStyle ='yellow';
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, size/2, 0, Math.PI * 2, true);
        this.ctx.fill();
    }

    drawWalls() {
        const { walls } = this.props.level;
        this.ctx.lineWidth = '3';
        this.ctx.strokeStyle ='blue';
        this.ctx.beginPath();

        for (const wall of walls) {
            const wallEdges = [wall[0] + this.wallWidth / 2, wall[1] + this.wallWidth / 2, wall[2] - this.wallWidth, wall[3] - this.wallWidth];
            this.ctx.rect(...wallEdges);
        }
        this.ctx.stroke();
    }

    doDrawing() {
        if(this.ctx) {
            this.clearBoard();
            this.drawPlayer();
            this.drawWalls();
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
