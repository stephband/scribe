# Fonts

Scribe supports (SMuFL)[https://w3c.github.io/smufl/latest/index.html] compliant
fonts. The fonts included in this repo are all originally published under the
(Open Font License)[https://openfontlicense.org/] (as far as the authors are aware).

- Bravura and Petaluma come from (Steinberg's github account)[https://github.com/steinbergmedia]
- Leipzig comes from the (Verovio repository)[https://github.com/rism-digital/verovio]
- Leland is available in (MuseScore's repo)[https://github.com/MuseScoreFonts/Leland]
- Ash, Jazz and Broadway are originally part of Finale and can be found (here)[https://makemusic.zendesk.com/hc/en-us/articles/1500013053461-MakeMusic-Fonts-and-Licensing-Information]
- MartianMono, by Evil Martians, is not an SMuFL font, and is included for documentation

Not all these fonts have all glyphs that Scribe supports. There is a test page
at (test/glyphs.html)[../test/glyphs.html]. In particular Ash and Leipzig have
several note heads and chord symbols missing. Your mileage may vary.

## Scribe Developers

Where fonts are available in a git repo, feel free to add them here as submodules
along with a CSS file that includes them.
