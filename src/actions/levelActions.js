export const progessLevel = () => {
    return {
        type: 'PROGRESS_LEVEL',
    };
};

export const coinCollected = (coin) => {
    return {
        type: 'COIN_COLLECTED',
        coin
    };
};

export const pillCollected = (pill) => {
    return {
        type: 'PILL_COLLECTED',
        pill
    };
};

export const resetLeveLProgress = () => {
    return {
        type: 'RESET_LEVEL_PROGRESS',
    };
};
