import React from 'react';

export default class GameInfo extends React.Component {
    render() {
        const { score, lives, killCount } = this.props.gameInfo;

        return (
            <section className="Info game-info">
                <h2>Game Info:</h2>
                <div className="Info-content">
                    <span>Score: {score}</span>
                    <span>Lives: {lives}</span>
                    <span>Kills: {killCount}</span>
                </div>
            </section>
        );
    }
}
