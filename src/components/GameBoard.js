import React from 'react';
import GameBackground from './GameBackground';

export default class GameBoard extends React.Component {

    clearCanvas(ctx) {
        ctx.clearRect(0, 0, this.props.level.boardSize, this.props.level.boardSize);
    }

    drawCharacter(ctx, character) {
        const { position, size, spriteCords } = character;
        ctx.drawImage(this.sprite, spriteCords[0], spriteCords[1], 16, 16, position.x-size/2, position.y-size/2, size, size);
    }

    drawCoins(ctx, coins) {
        ctx.lineWidth = '1';
        ctx.strokeStyle ='#ffb897';
        ctx.fillStyle = '#ffb897';
        for (const coin of coins) {
            ctx.beginPath();
            ctx.arc(coin[0], coin[1], 2.5, 0, Math.PI * 2, true);
            ctx.fill();
        }
    }

    drawGhosts(ctx, ghosts, poweredUp) {
        const frightenedColor = '#2c6ed5';
        const eyeColor = '#f8f8ff';
        const pupilColor = '#1b1b1b';

        for (const ghost of ghosts) {
            const radius = ghost.size / 2;
            const color = poweredUp ? frightenedColor : ghost.color;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(ghost.position.x, ghost.position.y, radius, Math.PI, 0, false);
            ctx.lineTo(ghost.position.x + radius, ghost.position.y + radius);
            ctx.lineTo(ghost.position.x - radius, ghost.position.y + radius);
            ctx.closePath();
            ctx.fill();

            const eyeOffsetX = radius * 0.4;
            const eyeOffsetY = radius * -0.2;
            const eyeRadius = radius * 0.22;
            const pupilRadius = eyeRadius * 0.55;

            ctx.fillStyle = eyeColor;
            ctx.beginPath();
            ctx.arc(ghost.position.x - eyeOffsetX, ghost.position.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
            ctx.arc(ghost.position.x + eyeOffsetX, ghost.position.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = pupilColor;
            ctx.beginPath();
            ctx.arc(ghost.position.x - eyeOffsetX, ghost.position.y + eyeOffsetY, pupilRadius, 0, Math.PI * 2);
            ctx.arc(ghost.position.x + eyeOffsetX, ghost.position.y + eyeOffsetY, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawPills(ctx, pills) {
        ctx.lineWidth = '1';
        ctx.strokeStyle ='#ffd27a';
        ctx.fillStyle = '#ffd27a';
        for (const pill of pills) {
            ctx.beginPath();
            ctx.arc(pill[0], pill[1], 6, 0, Math.PI * 2, true);
            ctx.fill();
        }
    }

    doDrawing() {
        const {level: { currentLevel: {coins, pills}}} = this.props;
        const { gameInfo: { poweredUp }, ghosts } = this.props;
        if(this.activeCtx) {
            this.clearCanvas(this.activeCtx);
            this.drawCharacter(this.activeCtx, this.props.player);
            this.drawGhosts(this.activeCtx, ghosts, poweredUp);
            this.drawCoins(this.activeCtx, coins);
            this.drawPills(this.activeCtx, pills);
        }
    }

    componentDidMount() {
        const activeCanvas = document.getElementById('active-canvas');
        this.activeCtx = activeCanvas.getContext('2d');

        this.sprite = new Image();
        this.sprite.src = require('../assets/sprites_16_x_16.png');
        this.sprite.onload = () => {
            this.doDrawing();
        };
    }

    render() {
        const {level: { boardSize }} = this.props;
        this.doDrawing();

        return (
            <section className="game-board">
                <GameBackground
                    level={this.props.level}
                    gameInfo={this.props.gameInfo}>
                </GameBackground>
                <canvas
                    id="active-canvas"
                    width={boardSize}
                    height={boardSize}>
                    <span>Sorry, the game requires canvas support which you don't appear to have..</span>
                </canvas>
            </section>
        );
    }
}
