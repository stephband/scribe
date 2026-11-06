
import push from '../object/push.js';


const { assign } = Object;


export default function getVoice(part, name) {
    let i = -1;
    while (part[++i]) if (part[i].name === name) {
        return part[i];
    }

    const staveVoice = part.stave && part.stave.voices && part.stave.voices.find((v) => v.name === name);
    const voice = assign({
        type: 'voice',
        name
    }, staveVoice);

    push(part, voice);
    return voice;
}
