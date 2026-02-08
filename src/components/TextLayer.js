import React from 'react';
import { connect } from 'react-redux';
import { introFinished } from '../actions/gameInfoActions';

class TextLayer extends React.Component {
    state = {
        isLeaving: false,
        text: '',
    };

    componentDidUpdate(oldProps) {
        const { showStageName, level: { currentLevel: { name } } } = this.props;
        const { showStageName: oldShowStageName, level: { currentLevel: { name: oldName } } } = oldProps;

        if(showStageName && !oldShowStageName) {
            this.setState({
                isLeaving: false,
            });
        }
        
        if(!showStageName && oldShowStageName) {
            this.setState({
                isLeaving: true,
            });
        }

        if(name !== oldName) {
            this.setState({
                text: name,
            });
        }
    };

    componentDidMount() {
        const { level: { currentLevel: {name}} } = this.props;
        this.setState({
            text: name,
        });
    }

    render() {
        return (
            <div className="text-overlay">
                <span className={"text-overlay-content " + (this.state.isLeaving ? 'intro-hide' : '')}>
                    {this.state.text}
                </span>
            </div>
        );
    }
}

const mapDispatchToProps = dispatch => ({
    introFinished: () => dispatch(introFinished()),
});
  
export default connect(null, mapDispatchToProps)(TextLayer);
