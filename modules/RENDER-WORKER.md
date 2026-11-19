# The Plan

The aim is to efficiently transfer large numbers of events to a worker and get an
HTML diff back. This will be exposed through a render function with the same
signature as other render functions:

```
renderHTMLByWorker(sequence, parts, key, timesig, transpose, displace, duration, settings, debug)`
```

## Proposed flow

1. Flatten and serialise sequence to a stride-8 `Float64Array` using
   `modules/render/serialise.js` (skipping non-notation events like `control`,
   `rate`, and `sequence`). Include event ids (`scribeId`), `target` ids, and
   `voice` in the serialisation, storing event ids on the original events as we
   do now. Strings from `text` events are stored in a companion `texts` lookup
   array.

2. If we have already rendered once we have an array of hashes of bars. Get it.

3. Call `renderWorker({ data, texts, hashes }, [data.buffer])` (handing
   control of the `Float64Array` buffer to the worker via transfers).

4. In the worker, deserialise `data` and `texts` into `Event` objects using
   `modules/render/deserialise.js`, and treat them as we do currently. Create
   tree, quantise, spell, symbolise and generate HTML per-bar as we do
   currently.

5. Hash the bar strings. Compare the new hashes with the hashes passed to the
   worker in step 3. Filter out equal hashes, leaving only bars with different
   hashes in the bars array. The bars array should contain bar objects of the
   form: `{ index, beat, html, hash }`.

6. Create an HTML string for a single set of staves. Place it in a signatures
   array, in an object of the form `{ beat: 0, html, hash }`.

7. Return `{ signatures, bars, length }` to the main thread.

8. Back on the main thread, loop through bars. For each { index, html, hash } in
   bars, replace barElements[index] (or append if index >= barElements.length)
   and update hashes[index] = hash. If barElements.length > length, remove the
   trailing elements and set hashes.length = length.

9. Generate signatures by copying the content of signatures (if it has changed)
   and inserting/replacing that in the DOM.
