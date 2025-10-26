
// Inputs
// Make inputs size of their placeholders
document.querySelectorAll('input').forEach((input) => {
    input.size = input.value ? input.value.length : input.placeholder.length || 6;
});

// Make inputs auto-expand to size of value or placeholder or 6
events({ type: 'input', select: 'input' }, document.body)
.each((e) => (e.target.size =
    e.target.value ? e.target.value.length :
    e.target.placeholder ? e.target.placeholder.length :
    6
));

// Update sequence from inputs
events({ type: 'input', select: 'input' }, document.body)
.each(overload((e) => e.target.name, {
    'name': (e) => sequence.name = e.target.value,

    'author': (e) => sequence.author ?
        (sequence.author.name = e.target.value) :
        (sequence.author = { name: e.target.value }),

    'arranger': (e) => sequence.arranger = e.target.value,

    'edit-duration': (e) => {
        if (!e.target.value) {
            document.body.classList.remove('edit');
            clear();
            unhighlightZones();
            unhighlightSymbols();
            return;
        }

        document.body.classList.add('edit');
        changeZoneDuration(Number(e.target.value));
        highlightZones();
    },

    default: (e) => console.log('name="' + e.target.name + '" not handled')
}));
