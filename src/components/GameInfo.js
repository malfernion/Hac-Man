import React from 'react';

export default class GameInfo extends React.Component {
    render() {
        const { score, lives, killCount, poweredUp } = this.props.gameInfo;
        const powerStatus = poweredUp ? 'ON' : 'OFF';

        return (
            <section className="Info game-info">
                <div className="Info-content">
                    <span>Score: {score}</span>
                    <span>Lives: {lives}</span>
                    <span>Kills: {killCount}</span>
                    <span>Power: {powerStatus}</span>
                </div>
            </section>
        );
    }
}
