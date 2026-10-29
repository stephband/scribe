
import straighten from './rhythm/straighten.js';

export function isTupletSymbol(settings, stave, /*part,*/ data) {
    switch (data.divisor) {
        case 2:
            // If we are rendering swing rhythms decide whether a duplet
            // should render as a tuplet
            if (data.rhythm === 1) {
                return;
            }
            else if (data.duration === 1) {
                if (!settings.swingAsStraight8ths) return;
            }
            else if (data.duration === 0.5) {
                if (!settings.swingAsStraight16ths) return;
            }
            else {
                return;
            }
            break;

        case 3:
            if (settings.swingAsStraight8ths) switch (data.duration) {
                // Convert duration 1 swing rhythm 101 to duplet 11
                case 1:
                    straighten(data);
                    if (data.divisor === 2) return;
                    break;

                // Change duration 2 rhythm 110 to duplet duration 1 rhythm 11
                case 2:
                    if (data.rhythm === 3) {
                        data.divisor  = 2;
                        data.duration = 1;
                        return;
                    }
                    break;
            }

            if (settings.swingAsStraight16ths) switch (data.duration) {
                // Convert duration 0.5 shuffle rhythm 101 to duplet 11
                case 0.5:
                    straighten(data);
                    if (data.divisor === 2) return;
                    break;

                // Change duration 1 rhythm 110 to duplet duration 0.5 rhythm 11
                case 1:
                    if (data.rhythm === 3) {
                        data.divisor  = 2;
                        data.duration = 0.5;
                        return;
                    }
                    break;
            }
    }

    return true;
}
