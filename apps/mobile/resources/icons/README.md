## Icon Set

The icon set is generated from the svg icons in the `source-svgs` folder (those are exported from figma).
The icons have been uploaded to `https://icomoon.io/app/` and a font has been generated.
The generated font has been downloaded an extracted into the safe-icons folder.

To use the font in the app only the `selection.json` & safe-icons.ttf files are needed. Those need
to be copied to the `assets/fonts/safe-icons` folder.

There is a lint-staged hook that will run the `generate:icons` script whenever it detects that the `selection.json` file
has been changed. The script will then regenerate the possible icon names.

You can also manually run the script with `yarn workspace @safe-global/mobile generate:icons`.
