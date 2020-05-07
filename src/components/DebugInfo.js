import React from 'react';

export default class DebugInfo extends React.Component {
    render() {
        const { debug, gameStarted } = this.props.gameInfo;
        if (!debug) {
            return null;
        }

        const { position, direction } = this.props.player;

        return (
            <section className="Info debug-info">
                <h2>Debug Info:</h2>
                <div className="Info-content">
                    <span>Game Started: {gameStarted.toString()}</span>
                    <span>Position: (x: {Math.floor(position.x)}, y: {Math.floor(position.y)})</span>
                    <span>Direction: {direction}</span>
                </div>
            </section>
        );
    }
}
