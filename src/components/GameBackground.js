import React from 'react';

export default class GameBackground extends React.Component {

    shouldComponentUpdate = (nextProps) => {
        return this.props.gameInfo.levelCompleted !== nextProps.gameInfo.levelCompleted;
    }

    componentDidUpdate = (oldProps) => {
        const { gameInfo: {levelCompleted} } = this.props;
        const { gameInfo: {levelCompleted: oldLevelCompleted} } = oldProps;
    
        if(levelCompleted && !oldLevelCompleted) {
            this.flashWalls();
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.props.boardSize, this.props.boardSize);
    }

    /**
     * Draws a rounded rectangle using the current state of the canvas.
     * Taken from Juan Mendes' anwer here: https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
     * @param {Number} x The top left x coordinate
     * @param {Number} y The top left y coordinate
     * @param {Number} width The width of the rectangle
     * @param {Number} height The height of the rectangle
     */
    drawRoundedRect(x, y, width, height) {
        const radius = 9;

        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawWalls(wallRenderWidth, walls, wallColour) {
        this.ctx.lineWidth = '3';
        this.ctx.strokeStyle = wallColour;
        this.ctx.fillStyle = 'black';
        
        for (const wall of walls) {
            const wallEdges = [wall[0] + wallRenderWidth / 2, wall[1] + wallRenderWidth / 2, wall[2] - wallRenderWidth, wall[3] - wallRenderWidth];
            this.drawRoundedRect(...wallEdges);
        }
    }

    doDrawing(wallRenderWidth, walls, wallColour = 'blue') {
        if(this.ctx) {
            this.clearCanvas();
            this.drawWalls(wallRenderWidth, walls, wallColour);
        }
    }

    flashWalls(sequence = ['blue', 'pink', 'blue', 'pink', 'blue', 'pink', 'blue', 'pink', 'blue', 'pink', 'blue', 'pink', 'blue']) {
        const {level: { wallRenderWidth, currentLevel: {walls}}} = this.props;

        const singleFlash = () => {
            if(sequence.length) {
                this.doDrawing(wallRenderWidth, walls, sequence.pop());
                setTimeout(singleFlash, 150);
            }
        }

        singleFlash();
    }

    shouldComponentUpdate(nextProps) {
        return this.props.level.currentLevelNumber !== nextProps.level.currentLevelNumber;
    }

    componentDidMount() {
        const {level: { wallRenderWidth, currentLevel: {walls}}} = this.props;
        const backgroundCanvas = document.getElementById('background-canvas');

        if(backgroundCanvas && backgroundCanvas.getContext) {
            this.ctx = backgroundCanvas.getContext('2d');
        }
        this.doDrawing(wallRenderWidth, walls);
    }

    render() {
        const {level: { boardSize, wallRenderWidth, currentLevel: {walls}}} = this.props;
        this.doDrawing(wallRenderWidth, walls);

        return (
            <canvas id="background-canvas" width={boardSize} height={boardSize}></canvas>
        );
    }
}
