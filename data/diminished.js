
import { createScale } from './create-data.js';

export const diminishedC7 = createScale('C7♭9 diminished', 'C', 0.5,
    'C4','A♭', 'D♭4','A♭', 'D♯4','B', 'E4','B', 'F♯4','D', 'G4','D', 'A4','F', 'B♭4','F',
    'C5','A♭'
);

export const diminishedTriads = createScale('C7♭9 triads', 'C', 0.5,
    'G3','F', 'C4','F', 'E4','F',   'G4','A♭', 'E♭4','A♭', 'B♭3','A♭',  'C♯4','B', 'F♯4','B', 'A♯4','B',  'C♯5','D',   'A4','D',   'E4','D',
    'G4','F', 'C5','F', 'E5','F',  'C♯5','D',   'A4','D',   'E4','D',   'C♯4','B', 'F♯4','B', 'A♯4','B',   'G4','A♭', 'E♭4','A♭', 'B♭3','A♭',
    'C4','F'
);

export const diminishedCs7 = createScale('C♯7♭9 diminished', 'C', 0.5,
    'C♯4','A',  'D4','A',  'E4','C', 'F4','C', 'G4','E♭', 'A♭4','E♭', 'A♯4','F♯', 'B4','F♯',
    'C♯5','A'
);

export const diminishedD7 = createScale('D7♭9 diminished', 'C', 0.5,
    'D4','B♭', 'E♭4','B♭',  'F4','D♭', 'G♭4','D♭', 'G♯4','E', 'A4','E', 'B4','G', 'C5','G',
    'D5','B♭'
);
