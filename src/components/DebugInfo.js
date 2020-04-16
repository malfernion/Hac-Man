import React from 'react';

export default class DebugInfo extends React.Component {
    render() {
        const { debug, gameStarted } = this.props.gameInfo;
        if (!debug) {
            return null;
        }

        const { position, direction } = this.props.player;

        return (
            <section className="Info">
                <h2>Debug Info:</h2>
                <div className="Info-content">
                    <span>Game Started: {gameStarted}</span>
                    <span>Position: (x: {position.x}, y: {position.y})</span>
                    <span>Direction: {direction}</span>
                </div>
            </section>
        );
    }
}
