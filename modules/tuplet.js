
export function isTupletSymbol(swing, shuffle, data) {
    if (data.straightened) return false;

    if (data.rhythm === 1) return false;

    if (data.divisor === 2) {
        // If we are rendering swing rhythms decide whether a duplet
        // should render as a tuplet
        switch (data.duration) {
            case 0.5:
                if (!shuffle) return false;
                break;
            case 1:
                if (!swing) return false;
                break;
            default:
                return false;
        }
    }

    return true;
}
