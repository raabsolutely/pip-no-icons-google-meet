# Floating Meet Strip

A Chrome extension that strips Google Meet's floating (picture-in-picture) window down to faces.

- Control bar, Gemini button, mic icons, and tile menus are hidden.
- Hover over the window and Meet's own controls fade in at the bottom.
- Hover over a tile to see the person's name.
- The main Meet page is untouched.

Works in the Google Meet app (the one installed from Chrome) and in meet.google.com tabs.

## Install

1. Download `floating-meet-strip.zip` from the [latest release](../../releases/latest).
2. Unzip it somewhere it can stay, for example your Documents folder. Chrome loads the extension from this folder, so don't delete it.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** (top right).
5. Click **Load unpacked** and pick the unzipped `floating-meet-strip` folder.

If you use several Chrome profiles, install it in the profile your Meet app opens with.

## Use

1. In a call, click **More options** (three dots), then **Open picture-in-picture mode**.
2. Drag the window's edge to shrink it to a strip.
3. Hover to get the controls back.

## Update

Download the new zip, replace the old folder with the new one, then click the reload icon on the extension's card in `chrome://extensions`.

## Limits

- Chrome's own title bar (meet.google.com and the window buttons) belongs to the browser and can't be removed.
- The extension targets Meet's internal element IDs. When Google changes them, parts of the window will reappear until the extension is updated.
- Company-managed Chrome may block Developer mode or unpacked extensions. If **Load unpacked** is missing or greyed out, that's the reason.
- It only changes how the floating window looks. It reads no data and sends nothing anywhere.
