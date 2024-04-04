
import overload from '../../fn/modules/overload.js';
import create   from '../../dom/modules/create.js';
import element  from '../../dom/modules/element.js';

const assign = Object.assign;

const defaults = {
    cursor:  0,
    key:     'C',
    timesig: '4/4',
    stave:   'treble'
};


function parseEvents(source) {
    return [];
}

function toSymbols(source) {
    return [
        [0,   'note', 'G4',  0.8, 2],
        [2,   'note', 'C#5', 0.8, 0.5],
        [2.5, 'rest', 'C5',  0.8, 0.5],
        [3,   'note', 'Db5', 0.8, 1]
    ];
}


const createSymbols = overload((nodes, event) => event[1], {
    note: (nodes, event) => {
        const acci = event[2].includes('#') ? 'sharp' :
            event[2].includes('b') ? 'flat' :
            'natural' ;

        // Create accidental
        nodes.push(create('svg', {
            class:   "acci",
            viewBox: acci === 'sharp' ? "0 -4 2.3 4" :
                acci === 'flat' ? "0 -4 2 4" :
                "0 -4 1.8 4" ,
            preserveAspectRatio: "xMidYMid slice",
            data: { beat: event[0] + 1, pitch: event[2], duration: event[4] },
            html: '<use href="#acci-' + acci + '"></use>'
        }));

        // Create note head
        nodes.push(create('svg', {
            class:   "head",
            viewBox: "0 -1 2.7 2",
            preserveAspectRatio: "xMidYMid slice",
            data: { beat: event[0] + 1, pitch: event[2], duration: event[4] },
            html: '<use href="#head[' + event[4] + ']"></use>'
        }));

        return nodes;
    },

    rest: (nodes, event) => {
        // Create note head
        nodes.push(create('svg', {
            class:   "rest",
            viewBox:
                event[4] === 0.125 ? "0 -4 3.0 8" :
                event[4] === 0.25  ? "0 -4 2.8 8" :
                event[4] === 0.375 ? "0 -4 3.8 8" :
                event[4] === 0.5   ? "0 -4 2.6 8" :
                event[4] === 0.75  ? "-0.2 -4 3.6 8" :
                event[4] === 1     ? "0 -4 2.6 8" :
                event[4] === 1.5   ? "0 -4 3.5 8" :
                event[4] === 2     ? "0 -4 2.6 8" :
                event[4] === 3     ? "0 -4 2.6 8" :
                event[4] === 4     ? "0 -4 2.6 8" :
                event[4] === 6     ? "0 -4 2.6 8" :
                "0 -4 2.6 8" ,
            preserveAspectRatio: "xMidYMid slice",
            data: { beat: event[0] + 1, pitch: event[2], duration: event[4] },
            html: '<use href="#rest[' + event[4] + ']"></use>'
        }));

        return nodes;
    }
});

function renderBar(data) {
    return create('div', {
        class: 'stave 4/4-bar bar',
        children: data.reduce(createSymbols, [])
    });
}

function renderBars(data) {
    return [renderBar(data)];
}

export default element('scribe-script', {
    shadow: `
        <style>
            @import './shadow.css';
        </style>
        <svg width="0" height="0">
            <defs>
                <path id="rest[0.125]" class="rest-path" transform="scale(0.111111) translate(-495 -154)" d="M507.3916,171.1987c0,0.5762,0.2881,1.2241,0.9365,1.8003c0.5762,0.6479,0.9365,1.1519,0.9365,1.4399c0,0.8643-0.6484,2.0884-1.873,3.8164c-1.2236,1.728-2.2314,2.5205-3.0234,2.5205s-1.2246-0.2881-1.4404-0.9365c-0.0723-0.2158-0.0723-0.8638-0.0723-1.9438c0-0.936,0.792-4.3926,2.4482-10.3691c-1.3682,0.2881-2.4482,0.3604-3.3838,0.3604c-3.8887,0-5.833-2.1602-5.833-6.5527c0-2.9521,0.792-5.9043,2.376-8.7847l1.3682-2.3042c-0.2881-1.0083-0.4316-2.0161-0.4316-3.0962c0-2.8804,0.8643-5.8325,2.4482-8.7852c-1.0078-1.1519-1.584-2.8081-1.584-4.9683c0-1.8003,0.5762-4.1045,1.584-6.8403c1.2959-3.2407,2.6641-4.8965,4.1768-4.8965c0.6475,0,0.9355,0.3599,0.9355,1.0801c0,0.6479-0.1436,1.584-0.5039,2.7363c-0.2881,1.1519-0.4316,2.0161-0.4316,2.5918c0,1.6562,0.8633,2.4482,2.6641,2.4482c1.7998,0,3.8164-0.7197,5.9043-2.2319c1.0078-0.7202,2.7363-2.0884,5.04-4.1763c0.2168-0.144,0.5762-0.2881,1.1523-0.2881c1.1523,0,1.7285,0.7197,1.7285,2.0879c0,0.5762-0.0723,1.0801-0.2158,1.3682c-6.4814,15.4097-11.0898,28.3706-13.8262,38.8833C507.752,169.1108,507.3916,170.7666,507.3916,171.1987z M509.4082,153.269c-1.8721,0.4321-3.3125,0.6484-4.3926,0.6484c-1.0078,0-1.8721-0.2163-2.5918-0.6484c-0.1445,0.3604-0.2881,0.6484-0.4326,0.8643c-0.1436,0.6479-0.2158,1.2964-0.2158,1.8721c0,1.5845,0.8643,2.3765,2.6641,2.3765c0.9365,0,2.1602-0.2881,3.8164-0.936C508.4004,156.7974,508.832,155.4297,509.4082,153.269z M513.5127,138.8682c-4.1768,0.8638-6.4805,1.2959-6.9844,1.2959c-0.4326,0-0.8643,0-1.2246-0.0718c-0.1436,0.7197-0.2158,1.2241-0.2158,1.6558c0,1.6562,0.8643,2.4482,2.6641,2.4482c1.1523,0,2.5928-0.4316,4.4648-1.4399C512.2168,142.7563,512.6484,141.4604,513.5127,138.8682z"/>
                <path id="rest[0.25]"  class="rest-path" transform="scale(0.111111) translate(-467 -154)" d="M478.5918,168.4624c0,0.6484,0.2168,1.2964,0.7207,1.8726c0.5039,0.5757,0.792,1.0801,0.792,1.3677c0,0.7925-0.7197,2.0884-2.1602,3.8164c-1.4404,1.7285-2.5205,2.5923-3.2402,2.5923c-0.8643,0-1.2959-0.4321-1.2959-1.4399c0-2.4482,1.0078-6.4805,3.0957-12.1689c-1.8721,0.4316-3.3838,0.6479-4.4639,0.6479c-3.3848,0-5.041-2.0161-5.041-6.1929c0-2.8081,1.0078-5.9043,3.1689-9.3604c-0.7207-1.0083-1.1523-2.4482-1.1523-4.3208c0-1.7998,0.7197-4.248,2.0879-7.2725c1.584-3.3843,3.168-5.1123,4.7529-5.1123c0.5752,0,0.8633,0.2881,0.8633,0.8638c0,0.7202-0.2158,1.6562-0.7197,2.9526c-0.5039,1.2959-0.7197,2.3042-0.7197,2.9521c0,1.4399,0.792,2.0879,2.4482,2.0879c1.8721,0,3.96-0.7197,6.2646-2.3042c0.8633-0.5757,2.5918-1.9438,5.2559-4.1763c0.2158-0.144,0.5762-0.2881,1.1523-0.2881c1.0801,0,1.584,0.5762,1.584,1.7285c0,0.7197-0.1436,1.2959-0.3604,1.728c-3.3115,6.3364-5.5439,10.729-6.624,13.105c-2.376,4.9688-4.1768,9.5049-5.4727,13.6812C478.8799,167.2383,478.5918,168.3184,478.5918,168.4624z M481.832,150.1011c-4.3203,0.8638-6.6963,1.2959-7.0557,1.2959c-0.4326,0-0.8643,0-1.2246-0.0718c-0.2881,0.8638-0.4316,1.584-0.4316,2.0879c0,1.3682,0.8633,2.0166,2.5195,2.0166c1.0801,0,2.5928-0.4321,4.5371-1.4404C480.6084,152.7651,481.1846,151.4692,481.832,150.1011z"/>
                <g id="rest[0.375]">
                    <use xlink:href="#rest[0.25]"></use>
                    <use xlink:href="#dot" transform="translate(0 1)"></use>
                </g>
                <path id="rest[0.5]"   class="rest-path" transform="scale(0.111111) translate(-444 -154)" d="M454.4014,160.0381c0,0.6479,0.2158,1.2959,0.7197,1.8721c0.5039,0.5757,0.792,1.0801,0.792,1.3682c0,0.792-0.7197,2.0879-2.1602,3.8159c-1.4404,1.7285-2.5205,2.5923-3.2402,2.5923c-0.792,0-1.2959-0.2881-1.5117-0.8638c-0.0723-0.2881-0.1445-0.936-0.1445-1.9443c0-1.0078,2.2324-6.1924,6.6963-15.6973c-4.248,0.8643-6.6963,1.2241-7.2725,1.2241c-3.6719,0-5.4727-2.0161-5.4727-6.1206c0-1.8003,0.6484-4.2485,2.0166-7.2725c1.584-3.3125,3.168-5.0405,4.752-5.0405c0.5762,0,0.8643,0.2881,0.8643,0.8638c0,0.7202-0.2158,1.6562-0.7197,2.9526c-0.5039,1.2959-0.7197,2.2319-0.7197,2.9521c0,1.3682,0.792,2.0161,2.4473,2.0161c1.7285,0,3.8164-0.7202,6.4092-2.2324c2.1602-1.2959,4.0322-2.6641,5.4727-4.1763c0.4316-0.144,0.792-0.2158,1.2236-0.2158c1.0801,0,1.584,0.5762,1.584,1.6562c0,0.5757-0.1436,1.1519-0.4316,1.728c-0.8643,1.9443-2.6641,4.9683-5.3281,9.1445c-2.5205,3.8164-4.3213,7.0566-5.3291,9.6489C454.6895,159.3179,454.4727,159.894,454.4014,160.0381z"/>
                <g id="rest[0.75]">
                    <use xlink:href="#rest[0.5]"></use>
                    <use xlink:href="#dot" transform="translate(0 1)"></use>
                </g>
                <path id="rest[1]" class="rest-path" transform="scale(0.111111) translate(-418 -154)" d="M431.4346,152.5493c2.4482,0.4321,3.8877,0.6479,4.3926,0.7197c1.8721,0.3604,3.2402,0.7925,4.1035,1.2241c-0.1436,0.2881-2.3037,2.8804-6.2637,7.7769c-3.5283,4.3203-5.2568,6.6245-5.2568,6.9126c0,0.7202,0.5762,1.8003,1.7285,3.3843c1.1514,1.584,1.7998,2.8081,1.7998,3.8164c0,1.2241-0.7197,2.4482-2.0879,3.6724c-1.3682,1.2959-2.665,1.8721-3.8164,1.8721c-1.8721,0-2.8086-1.5122-2.8086-4.6084c0-2.3042,2.5205-7.4888,7.7051-15.4814c-1.2246-0.4321-2.7363-0.792-4.6084-1.0078c-1.5127-0.0723-3.0967-0.2163-4.6807-0.3604v-0.2881c-0.1445-1.728,2.376-5.3281,7.5605-10.8008c-0.792-0.3599-1.9443-0.936-3.4561-1.8003c-4.7529-2.8081-7.0566-6.6963-7.0566-11.665c0-2.52,0.5039-4.6802,1.6562-6.4805c0.9355-1.5122,2.5195-3.168,4.8242-4.8965c-0.4326,2.3042-0.6484,4.0327-0.6484,5.1846c0,2.7363,1.1523,5.1123,3.6006,7.1289c2.2324,1.8721,5.4727,2.8081,9.7207,2.8799c2.0166,0.0723,3.0967,0.4321,3.0967,1.0083c0,0.5039-1.4404,2.376-4.249,5.6885C434.8906,148.5171,433.1621,150.5332,431.4346,152.5493z"/>
                <g id="rest[1.5]">
                    <use xlink:href="#rest[1]"></use>
                    <use xlink:href="#dot" transform="translate(0 1)"></use>
                </g>
                <path id="rest[2]" class="rest-path" transform="translate(-45 -17) scale(0.1111)" d="M418.5479,143.0444v1.4399c0.0723,2.1602-0.4316,5.1128-1.4404,8.7129h-26.9297c0.2158-3.8882,0.792-7.2007,1.6562-9.937c2.9521,0,7.416,0,13.3926-0.0718C411.2031,143.1162,415.668,143.0444,418.5479,143.0444z"/>
                <g id="rest[3]">
                    <use xlink:href="#rest[2]"></use>
                    <use xlink:href="#dot" transform="translate(0 0)"></use>
                </g>
                <g id="rest[4]">
                    <use xlink:href="#rest[2]" transform="translate(0 1.1)"></use>
                </g>
                <path id="dot" class="scribe-symbol" transform="translate(-70     -36.28) scale(0.1111)" d="M661.3232,322.9727c0,1.0078-0.4316,2.4482-1.2959,4.248c-0.9365,2.0166-1.7998,3.1689-2.5918,3.3125c-0.3604,0.1445-1.7285,0.1445-4.249,0.1445h-1.2236c-1.1523,0-1.7285-0.5039-1.7285-1.5117c0-0.7207,0.4316-2.0176,1.3682-3.9609c1.0078-1.8721,1.7285-3.0957,2.3047-3.5283c0.2871-0.1436,1.584-0.2881,3.8877-0.2881c1.2959,0,2.0166,0.0723,2.2324,0.0723C660.8916,321.6768,661.3232,322.1807,661.3232,322.9727z"/>
                <path id="acci-flat"    class="acci-path" transform="scale(0.054) translate(-607.4 -191)" d="M629.4297,136.6357c1.4404,0,2.5928,0.8643,3.3848,2.5923c0.5039,1.2959,0.792,2.8081,0.792,4.5366c0,5.04-1.9443,10.6567-5.7607,16.8491c-2.9521,4.8247-6.624,9.5771-11.1611,14.1855l0.5762-60.1255c1.0078-1.1519,2.0879-1.8003,3.2402-1.8003c0.2881,0,0.4326,0.0723,0.5762,0.0723l-0.2881,29.2344C622.877,138.5078,625.7578,136.6357,629.4297,136.6357z M625.9014,145.6367c-1.0801,0-2.376,1.0801-3.7441,3.168c-1.2959,1.9443-1.9443,3.3843-2.0156,4.3208l-0.1445,8.2085c4.9688-4.6802,7.4883-9.2168,7.4883-13.6094C627.4854,146.3564,626.9102,145.6367,625.9014,145.6367z"/>
                <path id="acci-natural" class="acci-path" transform="scale(0.054) translate(-646 -191)"   d="M669.0293,136.9961l-2.9521,56.6685c-1.0088,0.7202-1.585,1.0801-1.873,1.0801c-0.792,0-1.1514,0-1.0801-0.0718l1.6562-30.8906c-0.5039,1.1519-1.7998,2.2319-3.7441,3.312s-3.5283,1.5845-4.8242,1.5845c-0.7197,0-1.4404-0.144-1.9443-0.4321l2.8799-54.5806c0.7207-0.4321,1.2969-0.6484,1.7285-0.6484c0.9365,0,1.2959,0,1.1523,0l-1.0078,28.4429c0.4316-0.8643,1.9434-1.8726,4.5361-2.9526C666.0049,137.5,667.8047,136.9961,669.0293,136.9961z M664.9961,148.4448c-2.6641,0.7202-4.8242,2.0161-6.4805,3.8882l-0.2158,5.4727c2.7363-0.4321,4.8242-1.4399,6.3369-3.1685C664.7803,153.4854,664.9248,151.4692,664.9961,148.4448z"/>
                <path id="acci-sharp"   class="acci-path" transform="scale(0.054) translate(-623.5 -191)" d="M655.709,134.8354c0.1445,0.4321,0.2168,1.1523,0.2168,2.3042c0,1.2964-0.1445,2.5923-0.2881,4.0327c0,0.5757-0.1445,1.4399-0.4326,2.52c-0.5039,1.0083-2.3037,2.3042-5.3281,3.7446l-0.2881,6.6963c1.6562-1.2241,3.0967-1.8721,4.1768-1.8721c0.2871,0,0.5752,1.584,0.7197,4.7524c0.0723,1.0078,0.0723,1.728,0.0723,2.3042c0,1.728-0.0723,2.7363-0.3604,3.168c-0.0723,0.2163-1.8721,1.4404-5.3281,3.6724c0,3.3125-0.1445,6.6968-0.3604,10.2969c-0.0723,1.4404-0.1445,2.8804-0.2158,4.2485c-0.2881,2.3042-0.7207,3.4565-1.3682,3.4565c-0.0723,0.0718-0.1445,0.0718-0.1445,0.0718c-0.792,0-1.1514-1.9443-1.1514-5.8325c0-0.936,0-2.376,0.1436-4.3203c0.0723-1.9443,0.1436-3.3843,0.1436-4.3926c0-1.0078-0.0713-1.6558-0.2158-2.0161c-1.0078,0.144-1.7275,0.5039-2.2314,1.0083c-0.0723,1.9438-0.2168,4.8242-0.4326,8.5688c-0.0723,2.0161-0.1436,3.96-0.2158,5.8325c-0.1445,3.3843-0.4326,5.2563-0.6484,5.6162c-0.2158,0.2163-0.4316,0.2881-0.7197,0.2881c-1.0078,0-1.5117-1.5122-1.5117-4.6802c0-2.3047,0.3594-7.1289,0.9355-14.6177c-1.4404,0.5044-2.8799,1.0083-4.3926,1.4404c-0.7197,0-1.0078-1.9443-1.0078-5.9048c0-0.2881,0-0.792,0.0723-1.5122c0-0.7197,0.0713-1.2241,0.0713-1.5117c0.1445-0.4321,1.0088-1.0083,2.4482-1.8003c1.0088-0.4321,1.9443-0.936,2.9531-1.5122c0.2871-1.4399,0.3594-3.3843,0.2871-5.6885l-0.0713-0.8643c-1.2959,0.7202-2.8809,1.3682-4.7529,2.0161c-0.3594-0.1436-0.5039-0.792-0.5039-1.9438c0-0.8643,0.0723-2.3765,0.3604-4.4644c0.2158-2.0884,0.4316-3.4565,0.7197-4.1045c1.0078-0.8643,2.6641-1.9443,5.1123-3.3125c0-1.7998,0.1445-4.5361,0.3604-8.2803c0.2881-4.9688,0.792-7.4888,1.5117-7.4888c0.8643,0,1.2969,2.3042,1.2969,6.7686c0,1.728-0.1445,4.1763-0.4326,7.4165c0.792,0,1.7285-0.3599,2.8086-1.1519c0.2881-0.4321,0.5762-4.8965,0.8643-13.4653c0.2881-7.8486,1.1514-11.8091,2.5918-11.8091c0.5762,1.1523,0.8643,2.5205,0.8643,4.1045c0,4.4644-0.4326,11.0889-1.1523,20.0176C653.0449,135.4839,654.7012,134.8354,655.709,134.8354z M647.501,148.7329c-1.0801,0.5039-2.3047,1.2241-3.8887,2.2319c-0.1436,2.3042-0.2158,4.1045-0.2158,5.4009c0,0.5757,0,1.0078,0,1.2959c1.0801-0.4321,2.3037-1.0801,3.7441-2.0884C647.1406,154.0615,647.2842,151.7573,647.501,148.7329z"/>
                <use xlink:href="#head[1]" id="head[0.125]"></use>
                <use xlink:href="#head[1]" id="head[0.25]"></use>
                <use xlink:href="#head[1]" id="head[0.5]"></use>
                <path id="head[1]" class="head-path" transform="translate(-18.9 -36.28) scale(0.1111)" d="M177.2754,335.8613c-2.0884,0-3.8164-0.3594-5.2568-1.1514c-1.728-1.0088-2.5918-2.4482-2.5918-4.3926c0-3.0244,1.7998-6.1201,5.5444-9.4326c3.6001-3.168,6.9126-4.752,9.9365-4.752c5.7607,0,8.6411,2.2314,8.6411,6.6953c0,3.0254-1.9443,6.0488-5.9766,8.9297C183.8999,334.4941,180.4434,335.8613,177.2754,335.8613z"/>
                <path id="head[2]" class="head-path" transform="translate(-16   -36.28) scale(0.1111)" d="M169.5732,322.1094c0,1.6553-0.3599,3.168-1.1523,4.4639c-1.5117,2.6641-4.4644,5.1846-8.8564,7.6318c-4.4644,2.4492-8.2808,3.6729-11.521,3.6729c-1.8721,0-3.4565-0.6475-4.6807-2.0166c-1.1519-1.3672-1.728-2.9512-1.728-4.8242c0-4.0312,2.2324-7.9199,6.8408-11.5928c4.4644-3.5283,8.9287-5.3281,13.3931-5.3281C166.981,314.1162,169.5732,316.7803,169.5732,322.1094z M160.5005,325.4209c0-1.1514-0.2163-2.376-0.7202-3.8164c-0.7202-1.7275-1.584-2.5918-2.5923-2.5918c-2.3042,0-4.0322,1.1514-5.3281,3.3115c-1.0083,1.7285-1.4404,3.8164-1.4404,6.1211c0,3.0957,0.8643,4.6084,2.5923,4.6084c2.0161,0,3.7441-0.792,5.2563-2.376S160.5005,327.3652,160.5005,325.4209z"/>
                <path id="head[4]" class="head-path" transform="translate(-13.9 -36.28) scale(0.1111)" d="M118.0923,336.0781c-6.0488,0-9.001-2.1602-9.001-6.4805c0-3.8887,2.6641-7.2734,8.1367-10.1533c4.7524-2.5205,9.5049-3.8154,14.3291-3.8154c2.7363,0,5.0405,0.5752,6.9126,1.6553c2.1602,1.2236,3.2402,2.9521,3.2402,5.1846c0,2.9521-1.0801,5.3281-3.168,7.2012c-2.1602,1.8711-5.2568,3.4551-9.5049,4.6797C125.2207,335.502,121.5483,336.0781,118.0923,336.0781z M131.269,326.2129c0-4.4648-1.7998-6.7686-5.4004-6.7686c-2.0161,0-3.6724,0.9365-5.0405,2.8086s-2.0161,3.6729-2.0161,5.4717c0,3.0967,1.8721,4.6094,5.6167,4.6094c2.0161,0,3.6001-0.5762,4.8965-1.7285C130.6211,329.4531,131.269,327.9414,131.269,326.2129z"/>
                <g id="head[1.5]">
                    <use xlink:href="#head[1]"></use>
                    <use xlink:href="#dot" transform="translate(0 0)"></use>
                </g>
            </defs>
        </svg>
        <div class="stave 4/4-bar bar">
            <svg class="head" data-beat="1"      data-pitch="E4"  viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="acci" data-beat="1.5"    data-pitch="G#4" viewbox="0 -4 2.3 4" preserveAspectRatio="xMidYMid slice"><use href="#acci-sharp"></use></svg>
            <svg class="head" data-beat="1.5"    data-pitch="G#4" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="acci" data-beat="2"      data-pitch="B4"  viewbox="0 -4 1.8 4" preserveAspectRatio="xMidYMid slice"><use href="#acci-natural"></use></svg>
            <svg class="head" data-beat="2"      data-pitch="B4"  viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="head" data-beat="2.5"    data-pitch="D5"  viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="acci" data-beat="3"      data-pitch="Eb5" viewbox="0 -4 2 4"   preserveAspectRatio="xMidYMid slice"><use href="#acci-flat"></use></svg>
            <svg class="head" data-beat="3"      data-pitch="Eb5" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="head" data-beat="3.3333" data-pitch="F#5" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="head" data-beat="3.6666" data-pitch="C#5" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="head" data-beat="4"      data-pitch="A#4" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="acci" data-beat="4.3333" data-pitch="G#4" viewbox="0 -4 2.3 4" preserveAspectRatio="xMidYMid slice"><use href="#acci-sharp"></use></svg>
            <svg class="head" data-beat="4.3333" data-pitch="G#4" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="acci" data-beat="4.6666" data-pitch="B4"  viewbox="0 -4 1.8 4" preserveAspectRatio="xMidYMid slice"><use href="#acci-natural"></use></svg>
            <svg class="head" data-beat="4.6666" data-pitch="B4"  viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></div>
        </div>
        <div class="stave 4/4-bar bar">
            <svg class="head" data-beat="1"      data-pitch="E4"  viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="acci" data-beat="1.5"    data-pitch="G#4" viewbox="0 -4 2.3 4" preserveAspectRatio="xMidYMid slice"><use href="#acci-sharp"></use></svg>
            <svg class="head" data-beat="1.5"    data-pitch="G#4" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="acci" data-beat="2"      data-pitch="B4"  viewbox="0 -4 1.8 4" preserveAspectRatio="xMidYMid slice"><use href="#acci-natural"></use></svg>
            <svg class="head" data-beat="2"      data-pitch="B4"  viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="head" data-beat="2.5"    data-pitch="D5"  viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="acci" data-beat="3"      data-pitch="Eb5" viewbox="0 -4 2 4" preserveAspectRatio="xMidYMid slice"><use href="#acci-flat"></use></svg>
            <svg class="head" data-beat="3"      data-pitch="Eb5" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="rest" data-beat="4"      data-duration="1" viewbox="0 -4 2.6 8" preserveAspectRatio="xMidYMid meet"><use href="#rest[1]"></use></svg>
        </div>
        <div class="stave 4/4-bar bar">
            <svg class="head" data-beat="1"      data-pitch="E4"  viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="head" data-beat="2"      data-pitch="B4"  viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="head" data-beat="3"      data-pitch="Eb5" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
            <svg class="head" data-beat="4"      data-pitch="A#4" viewbox="0 -1 2.7 2" preserveAspectRatio="xMidYMid slice"><use href="#head[1]"></use></svg>
        </div>
        <div class="stave 4/4-bar bar">
            <div class="head" data-pitch="E4"  data-beat="1"></div>
            <div class="head" data-pitch="G#4" data-beat="1.5"></div>
            <div class="head" data-pitch="B4"  data-beat="2"></div>
            <div class="head" data-pitch="D5"  data-beat="2.5"></div>
            <svg class="rest" data-beat="2.75" data-duration="0.25" viewbox="0 -4 2.6 8" preserveAspectRatio="xMidYMid meet"><use href="#rest[0.25]"></use></svg>
            <div class="head" data-pitch="E5"  data-beat="3"></div>
            <div class="head" data-pitch="F#5" data-beat="3.3333"></div>
            <div class="head" data-pitch="C#5" data-beat="3.6666"></div>
            <div class="head" data-pitch="A#4" data-beat="4"></div>
        </div>
        <div class="stave 4/4-bar bar">
            <div class="head" data-pitch="E4"  data-beat="1"></div>
            <svg class="rest" data-beat="1.5" data-duration="0.5" viewbox="0 -4 2.6 8" preserveAspectRatio="xMidYMid meet"><use href="#rest[0.5]"></use></svg>
            <div class="head" data-pitch="B4"  data-beat="2"></div>
            <div class="head" data-pitch="D5"  data-beat="2.5"></div>
            <svg class="rest" data-beat="3" data-duration="1" viewbox="0 -4 2.6 8" preserveAspectRatio="xMidYMid meet"><use href="#rest[1]"></use></svg>
            <div class="head" data-pitch="A#4" data-beat="4"></div>
            <div class="head" data-pitch="G#4" data-beat="4.3333"></div>
            <div class="head" data-pitch="F#4" data-beat="4.6666"></div>
        </div>
        <div class="stave 4/4-bar bar">
            <svg class="rest" data-beat="1" data-duration="4" viewbox="0 -4 2.6 8" preserveAspectRatio="xMidYMid"><use href="#rest[4]"></use></svg>
        </div>
        <div class="stave 4/4-bar bar">
            <div class="head" data-beat="1"   data-pitch="E4"></div>
            <div class="head" data-beat="1.5" data-pitch="G#4"></div>
            <div class="head" data-beat="2"   data-pitch="B4"></div>
            <div class="head" data-beat="2.5" data-pitch="D5"></div>
            <svg class="rest" data-beat="3"   data-duration="2" viewbox="0 -4 2.6 8" preserveAspectRatio="xMidYMid meet"><use href="#rest[2]"></use></svg>
        </div>
        <div class="stave 4/4-bar bar">
            <div class="head" data-pitch="E4"  data-beat="1"></div>
            <div class="head" data-pitch="G#4" data-beat="1.5"></div>
            <div class="head" data-pitch="B4"  data-beat="2"></div>
            <div class="head" data-pitch="D5"  data-beat="2.5"></div>
            <div class="head" data-pitch="E5"  data-beat="3"></div>
            <div class="head" data-pitch="F#5" data-beat="3.3333"></div>
            <div class="head" data-pitch="C#5" data-beat="3.6666"></div>
            <div class="head" data-pitch="A#4" data-beat="4"></div>
            <div class="head" data-pitch="G#4" data-beat="4.3333"></div>
            <div class="head" data-pitch="F#4" data-beat="4.6666"></div>
        </div>
        <div class="stave 4/4-bar bar">
            <div class="head" data-pitch="E4"  data-beat="1"></div>
            <div class="head" data-pitch="G#4" data-beat="1.5"></div>
            <svg class="rest" data-beat="2"    data-duration="3" viewbox="0 -4 2.6 8" preserveAspectRatio="xMidYMid meet"><use href="#rest[3]"></use></svg>
        </div>
        <div class="stave 4/4-bar bar">
            <svg class="rest" data-beat="1"     data-duration="0.75"  viewbox="-0.2 -4 3.6 8" preserveAspectRatio="xMidYMid"><use href="#rest[0.75]"></use></svg>
            <svg class="rest" data-beat="1.75"  data-duration="0.25"  viewbox="0 -4 2.8 8"    preserveAspectRatio="xMidYMid"><use href="#rest[0.25]"></use></svg>
            <svg class="rest" data-beat="2"     data-duration="0.125" viewbox="0 -4 3.0 8"    preserveAspectRatio="xMidYMid"><use href="#rest[0.125]"></use></svg>
            <svg class="rest" data-beat="2.125" data-duration="0.375" viewbox="0 -4 3.8 8"    preserveAspectRatio="xMidYMid"><use href="#rest[0.375]"></use></svg>
            <svg class="rest" data-beat="3"     data-duration="1.5"   viewbox="0 -4 3.5 8"    preserveAspectRatio="xMidYMid"><use href="#rest[1.5]"></use></svg>
            <svg class="rest" data-beat="4.5"   data-duration="0.5"   viewbox="0 -4 2.6 8"    preserveAspectRatio="xMidYMid"><use href="#rest[0.5]"></use></svg>
        </div>
    `,

    construct: function(shadow, internals) {
        const bar   = shadow.querySelector('.bar');
        internals.state = assign({}, defaults);
    },

    connect: function(shadow, internals) {
        const source  = this.innerHTML;
        const type    = internals.type;
        const data    = parseEvents(source);
        const symbols = toSymbols(data);
        const bars    = renderBars(symbols, internals.state);

        // Put bars in the DOM
        shadow.append.apply(shadow, bars);
    }
}, {

}, './shadow.css');
