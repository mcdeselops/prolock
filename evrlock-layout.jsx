import { useState } from "react";

/*
 * Color sources: extracted from actual Wix website HTML
 *
 * Rocky Mountain site (rockyMtn.html):
 *   Wix palette: color_11=#FFFFFF, color_12=#123549 (navy), color_13=#FCB53F (gold),
 *                color_14=#4E4E4E (gray), color_15=#171717 (dark)
 *   Buttons: pill (999px radius), gold #FCB53F primary, navy #123549 secondary
 *   Fonts: avenir-lt-w01_85-heavy1475544 (display), roboto (body), din-next-w01-light (labels)
 *   Vibe: clean white bg, dark navy hero sections, bold gold accents, subtle shadows
 *
 * Interpro site (interpro.html):
 *   Wix palette: color_11=#FFFFFF, color_12=#133446 (teal), color_13=#EE842F (orange),
 *                color_14=#8694A5 (blue-gray), color_15=#171717 (dark)
 *   Buttons: pill (999px radius), orange #EE842F primary
 *   Fonts: roboto (display), avenir-lt-w01_35-light1475496 (body), din-next-w01-light (labels)
 *   Vibe: same clean white bg, teal-navy sections, warm orange accents
 */

const themes = {
  rocky: {
    name: "Rocky Mountain",
    // From site: #FCB53F gold accent (19 occurrences), #123549 navy secondary
    accent: "#FCB53F",
    accentDark: "#d9982e",
    accentDim: "#FCB53F15",
    accentMid: "#FCB53F30",
    // Site backgrounds: white primary, #EEEEEE borders, navy #123549 hero sections
    bg: "#FFFFFF",
    bgCard: "#F8F9FA",
    bgInput: "#FFFFFF",
    bgHero: "#123549",
    border: "#EEEEEE",
    borderLight: "#EEEEEE",
    // From site Wix palette: color_15=#171717, color_14=#4E4E4E, #757575, #8D8D8D
    textPrimary: "#171717",
    textSecondary: "#4E4E4E",
    textMuted: "#8D8D8D",
    navText: "#757575",
    textOnDark: "#FFFFFF",
    // Site shadow: 0 1px 4px rgba(0,0,0,.6)
    shadow: "0 1px 4px rgba(0,0,0,0.08)",
    shadowHover: "0 2px 12px rgba(0,0,0,0.12)",
    // Site typography: avenir heavy display, roboto body, din-next labels
    fontDisplay: "'Poppins', 'Avenir', 'Helvetica Neue', sans-serif",
    fontBody: "'Roboto', 'Helvetica Neue', sans-serif",
    fontLabel: "'Jost', 'DIN Alternate', sans-serif",
  },
  interpro: {
    name: "Interpro",
    // From site: #EE842F orange accent, #133446 teal secondary
    accent: "#EE842F",
    accentDark: "#c96d1e",
    accentDim: "#EE842F15",
    accentMid: "#EE842F30",
    // Same white-first approach
    bg: "#FFFFFF",
    bgCard: "#F7F8FA",
    bgInput: "#FFFFFF",
    bgHero: "#133446",
    border: "#EEEEEE",
    borderLight: "#EEEEEE",
    // From site Wix palette: color_15=#171717, color_14=#8694A5 (blue-gray)
    textPrimary: "#171717",
    textSecondary: "#5A6570",
    textMuted: "#8694A5",
    navText: "#8694A5",
    textOnDark: "#FFFFFF",
    shadow: "0 1px 4px rgba(0,0,0,0.08)",
    shadowHover: "0 2px 12px rgba(0,0,0,0.12)",
    // Site typography: roboto display, avenir-light body, din-next labels
    fontDisplay: "'Roboto', 'Helvetica Neue', sans-serif",
    fontBody: "'Poppins', 'Avenir', 'Helvetica Neue', sans-serif",
    fontLabel: "'Jost', 'DIN Alternate', sans-serif",
  },
};

/* ── INLINE SVG LOGOS ─────────────────────────────────── */

const RockyLogo = ({ h = 34, textColor = "#171717", subtitleColor = "#757575" }) => (
  <svg viewBox="0 0 567.17 83.08" height={h} xmlns="http://www.w3.org/2000/svg">
    <path fill="#fcb53f" d="M55.14,63.18l2.59-5.73,2.23,3.16,2.46,3.49c7.76-6.69,12.67-16.58,12.67-27.63C75.09,16.33,58.76,0,38.62,0S2.14,16.33,2.14,36.48c0,11.78,5.6,22.23,14.26,28.9l2.03-3.16,3.57-5.55,1.29-2.21,6.11,5.61,4.36-8.08.88,2.41-.08-4.47,5.43-9.13,4.4,7.34,2.85,2.03,8.39,11.9-.5,1.1h0s-.3.66-.3.66l-.36.79.78-1.74-.08.77-.04-.48Z"/>
    <g><polygon fill="#102b45" points="22 56.67 18.43 62.21 16.4 65.37 15.86 66.21 16.86 66.07 17.1 65.92 19.24 64.54 17.72 66.35 9.24 76.35 15.86 66.21 12.3 66.13 0 82.54 17.27 82.54 26.21 65.97 27.78 63.06 29.4 60.07 23.29 54.46 22 56.67"/><polygon fill="#102b45" points="54.48 64.62 54.84 63.83 55.14 63.17 55.14 63.17 55.63 62.07 47.24 50.17 44.39 48.14 39.99 40.79 34.56 49.93 34.63 54.4 33.75 51.99 29.4 60.07 33.07 56.91 30.3 62.05 31.6 62.08 32.49 62.1 34.57 57.66 35.16 56.4 37.31 51.83 39.51 49.88 37.01 58.92 39.33 57.04 36.27 67.89 35.56 70.41 30.76 74.35 37.9 71.89 34.21 78.75 38.72 82.54 46.39 82.54 54.39 64.81 54.48 64.62"/><polygon fill="#102b45" points="72.72 78.9 66.39 67.74 64.08 66.45 62.42 64.1 59.96 60.61 57.73 57.45 55.14 63.18 55.18 63.66 55.38 65.9 55.6 68.42 55.62 68.4 55.73 68.28 58.65 64.98 56.54 71.75 55.21 75.97 54.49 81.36 51.54 76.66 47 81.19 46.39 82.54 75.58 82.54 72.72 78.9"/></g>
    <g fill={textColor}><path d="M113.43,18.51c4.58,0,8.1.98,10.55,2.94,2.45,1.96,3.67,4.74,3.67,8.35,0,2.52-.6,4.64-1.81,6.35-1.21,1.71-2.95,3.01-5.22,3.88l7.82,13.65h-9.34l-6.82-12.44h-5.88v12.44h-8.29V18.51h15.33ZM113.37,34.88c1.92,0,3.39-.39,4.41-1.18,1.01-.79,1.52-1.88,1.52-3.28s-.51-2.55-1.52-3.33c-1.02-.79-2.48-1.18-4.41-1.18h-6.98v8.98h6.98Z"/><path d="M131.8,36.09c0-2.59.46-4.99,1.39-7.19.93-2.2,2.2-4.11,3.83-5.72,1.63-1.61,3.56-2.88,5.8-3.81,2.24-.93,4.65-1.39,7.24-1.39s5.05.46,7.27,1.36c2.22.91,4.15,2.18,5.77,3.81s2.9,3.54,3.83,5.75c.93,2.2,1.39,4.6,1.39,7.19s-.46,4.99-1.39,7.19c-.93,2.2-2.2,4.12-3.83,5.75-1.63,1.63-3.55,2.9-5.77,3.81-2.22.91-4.65,1.36-7.27,1.36s-5-.46-7.24-1.36c-2.24-.91-4.17-2.18-5.8-3.81s-2.9-3.54-3.83-5.75c-.93-2.2-1.39-4.6-1.39-7.19ZM140.3,36.04c0,1.44.24,2.77.73,4.02.49,1.24,1.17,2.31,2.05,3.2.87.89,1.91,1.59,3.1,2.1,1.19.51,2.48.76,3.88.76s2.69-.25,3.88-.76c1.19-.51,2.22-1.21,3.1-2.1.87-.89,1.56-1.96,2.05-3.2.49-1.24.73-2.58.73-4.02s-.25-2.76-.73-3.96c-.49-1.21-1.17-2.26-2.05-3.15-.88-.89-1.91-1.59-3.1-2.1-1.19-.51-2.49-.76-3.88-.76s-2.69.25-3.88.76c-1.19.51-2.22,1.21-3.1,2.1-.88.89-1.56,1.94-2.05,3.15-.49,1.21-.73,2.53-.73,3.96Z"/><path d="M171.74,36.09c0-2.52.45-4.88,1.36-7.09.91-2.2,2.16-4.12,3.75-5.75,1.59-1.63,3.49-2.91,5.69-3.86s4.6-1.42,7.19-1.42c2.31,0,4.45.33,6.43,1,1.98.67,3.73,1.62,5.25,2.86,1.52,1.24,2.77,2.75,3.75,4.51.98,1.77,1.63,3.74,1.94,5.9h-8.77c-.6-1.96-1.69-3.51-3.28-4.65-1.59-1.14-3.39-1.71-5.38-1.71-1.33,0-2.57.26-3.73.79s-2.15,1.24-2.99,2.15c-.84.91-1.5,1.99-1.99,3.23-.49,1.24-.73,2.58-.73,4.02s.24,2.77.73,4.02c.49,1.24,1.15,2.32,1.99,3.23.84.91,1.84,1.63,2.99,2.15s2.4.79,3.73.79c1.99,0,3.79-.57,5.38-1.71,1.59-1.14,2.69-2.69,3.28-4.65h8.77c-.31,2.17-.96,4.14-1.94,5.9-.98,1.77-2.23,3.27-3.75,4.51-1.52,1.24-3.27,2.2-5.25,2.86-1.98.66-4.12,1-6.43,1-2.59,0-4.99-.47-7.19-1.42-2.2-.94-4.1-2.23-5.69-3.86-1.59-1.63-2.84-3.54-3.75-5.75-.91-2.2-1.36-4.57-1.36-7.09Z"/><path d="M243.33,53.67h-9.92l-10.02-13.8h-2.99v13.8h-8.29V18.51h8.29v14.01h3.04l9.87-14.01h9.13l-12.28,17.27,13.17,17.9Z"/><path d="M253.2,18.51l8.19,15.59,8.19-15.59h9.4l-13.44,23.99v11.18h-8.29v-11.18l-13.44-23.99h9.4Z"/><path d="M295.61,18.51h11.5l8.03,19.26,8.03-19.26h11.5v35.17h-8.14v-25.09l-7.56,18.37h-7.72l-7.51-18.37v25.09h-8.14V18.51Z"/><path d="M339.91,36.09c0-2.59.46-4.99,1.39-7.19s2.21-4.11,3.83-5.72c1.63-1.61,3.56-2.88,5.8-3.81,2.24-.93,4.65-1.39,7.24-1.39s5.05.46,7.27,1.36c2.22.91,4.15,2.18,5.77,3.81,1.63,1.63,2.9,3.54,3.83,5.75.93,2.2,1.39,4.6,1.39,7.19s-.46,4.99-1.39,7.19c-.93,2.2-2.21,4.12-3.83,5.75s-3.55,2.9-5.77,3.81c-2.22.91-4.65,1.36-7.27,1.36s-5-.46-7.24-1.36c-2.24-.91-4.17-2.18-5.8-3.81s-2.91-3.54-3.83-5.75c-.93-2.2-1.39-4.6-1.39-7.19ZM348.41,36.04c0,1.44.24,2.77.74,4.02.49,1.24,1.17,2.31,2.05,3.2.87.89,1.91,1.59,3.1,2.1,1.19.51,2.48.76,3.88.76s2.69-.25,3.88-.76c1.19-.51,2.22-1.21,3.1-2.1.88-.89,1.56-1.96,2.05-3.2.49-1.24.74-2.58.74-4.02s-.25-2.76-.74-3.96c-.49-1.21-1.17-2.26-2.05-3.15-.88-.89-1.91-1.59-3.1-2.1-1.19-.51-2.48-.76-3.88-.76s-2.7.25-3.88.76c-1.19.51-2.22,1.21-3.1,2.1-.88.89-1.56,1.94-2.05,3.15-.49,1.21-.74,2.53-.74,3.96Z"/><path d="M396.7,54.2c-4.9,0-8.69-1.24-11.36-3.73-2.68-2.48-4.02-6.05-4.02-10.71v-21.26h8.29v20.73c0,2.34.59,4.17,1.78,5.48,1.19,1.31,2.96,1.97,5.3,1.97s4.05-.66,5.22-1.97c1.17-1.31,1.76-3.14,1.76-5.48v-20.73h8.29v21.26c0,4.65-1.32,8.22-3.96,10.71-2.64,2.48-6.41,3.73-11.31,3.73Z"/><path d="M418.64,18.51h10.24l13.17,23.36v-23.36h8.14v35.17h-10.18l-13.23-23.41v23.41h-8.14V18.51Z"/><path d="M465.09,25.54h-11.13v-7.03h30.5v7.03h-11.13v28.13h-8.24v-28.13Z"/><path d="M493.59,18.51h9.92l12.91,35.17h-8.24l-2.36-6.51h-14.54l-2.36,6.51h-8.24l12.91-35.17ZM503.66,40.92l-5.09-14.12-5.14,14.12h10.24Z"/><path d="M520.25,18.51h8.29v35.17h-8.29V18.51Z"/><path d="M535.63,18.51h10.24l13.17,23.36v-23.36h8.14v35.17h-10.18l-13.23-23.41v23.41h-8.14V18.51Z"/></g>
    <g fill={subtitleColor}><path d="M98.12,71.51c0-1.6.58-2.83,1.75-3.7s2.83-1.3,4.99-1.3,3.89.46,5.04,1.39,1.74,2.22,1.77,3.89h-3.98c-.02-.72-.28-1.27-.78-1.64-.5-.38-1.23-.56-2.18-.56-.83,0-1.48.15-1.94.46-.46.3-.69.72-.69,1.25,0,.34.09.62.28.85.19.23.44.43.75.59.31.16.68.29,1.1.4.42.1.85.2,1.31.28.71.14,1.45.3,2.22.47.77.17,1.47.42,2.1.76.64.34,1.16.78,1.57,1.34.41.56.61,1.3.61,2.23,0,1.47-.57,2.65-1.72,3.54s-2.91,1.33-5.29,1.33-4.26-.47-5.47-1.42c-1.22-.94-1.82-2.22-1.82-3.84h3.98c.07.72.39,1.27.96,1.64.57.38,1.36.56,2.39.56.92,0,1.63-.15,2.13-.46.5-.3.75-.72.75-1.25,0-.34-.1-.61-.29-.83-.2-.22-.46-.4-.8-.54s-.74-.26-1.19-.35c-.45-.09-.92-.17-1.42-.25-.7-.13-1.41-.27-2.13-.43-.72-.16-1.38-.41-1.98-.76-.6-.34-1.08-.8-1.45-1.38-.37-.58-.56-1.34-.56-2.28Z"/><path d="M121.67,69.98h-5.41v-3.22h14.82v3.22h-5.41v12.86h-4.01v-12.86Z"/><path d="M136.11,66.76h12.55v3.36h-8.52v3.26h7.02v2.88h-7.02v3.21h8.52v3.36h-12.55v-16.08Z"/><path d="M154.58,66.76h12.55v3.36h-8.52v3.26h7.02v2.88h-7.02v3.21h8.52v3.36h-12.55v-16.08Z"/><path d="M173.05,66.76h4.03v12.72h7.22v3.36h-11.25v-16.08Z"/><path d="M202.26,66.76h5.59l3.9,8.81,3.9-8.81h5.59v16.08h-3.95v-11.47l-3.67,8.4h-3.75l-3.65-8.4v11.47h-3.95v-16.08Z"/><path d="M227.87,66.76h4.03v16.08h-4.03v-16.08Z"/><path d="M238.54,66.76h4.03v12.72h7.22v3.36h-11.25v-16.08Z"/><path d="M255.25,66.76h4.03v12.72h7.22v3.36h-11.25v-16.08Z"/><path d="M271.63,71.51c0-1.6.58-2.83,1.75-3.7s2.83-1.3,4.99-1.3,3.89.46,5.04,1.39,1.74,2.22,1.77,3.89h-3.98c-.02-.72-.28-1.27-.78-1.64-.5-.38-1.23-.56-2.18-.56-.83,0-1.48.15-1.94.46-.46.3-.69.72-.69,1.25,0,.34.09.62.28.85.19.23.44.43.75.59.31.16.68.29,1.1.4.42.1.85.2,1.31.28.71.14,1.45.3,2.22.47.77.17,1.47.42,2.1.76.64.34,1.16.78,1.57,1.34.41.56.61,1.3.61,2.23,0,1.47-.57,2.65-1.72,3.54s-2.91,1.33-5.29,1.33-4.26-.47-5.47-1.42c-1.22-.94-1.82-2.22-1.82-3.84h3.98c.07.72.39,1.27.96,1.64.57.38,1.36.56,2.39.56.92,0,1.63-.15,2.13-.46.5-.3.75-.72.75-1.25,0-.34-.1-.61-.29-.83-.2-.22-.46-.4-.8-.54s-.74-.26-1.19-.35c-.45-.09-.92-.17-1.42-.25-.7-.13-1.41-.27-2.13-.43-.72-.16-1.38-.41-1.98-.76-.6-.34-1.08-.8-1.45-1.38-.37-.58-.56-1.34-.56-2.28Z"/></g>
  </svg>
);

const InterproLogo = ({ h = 38, textColor = "#171717", subtitleColor = "#8694A5" }) => (
  <svg viewBox="0 0 540.82 122.62" height={h} xmlns="http://www.w3.org/2000/svg">
    <circle fill="#EE842F" cx="76.38" cy="51.38" r="51.38"/>
    <g><path fill="#133446" d="M119.77,110.91l-13.91-4.03c-4.61-3.98-10.04-8.05-18.31-12.45,7.09-8.52,12.69-18.88,17.21-30.57,1.38-2.7,2.51-5.46,3.4-8.28l-6.42,2.33,7.74-7.22c1.36-6.19,1.7-12.63,1.25-19.27-.04-.63-.76-.97-1.27-.6-10.5,7.51-20.36,15.39-29.4,23.73-3.49,3.21-6.85,6.5-10.07,9.86-2.3,8.27-6.08,15.75-11.17,22.52l-7.51,1.35-8.78,1.58-20.14-2.93c-4.58-2.54-8.56-2.83-11.72,0l-10.38,1.98c-.37.07-.39.6-.02.69,1.73.44,5.17,1.21,8.47,3,4.11,2.23,10.68,2.88,13.45,1.6.53-.24,1.11-.34,1.68-.26l11.2,1.56c.64.09,1.25.27,1.83.55l8.28,3.97c12.65,6.44,25.02,10.95,36.89,11.81l16.48,1.28,16.48,2.56c6.14.5,9.06-3.39,4.76-4.76Z"/><path fill="#fff" d="M76.16,52.76c-1.49-4.77-4.98-10.91-6.52-13.5l-3.51,5.56,2.66-7.1-1.74-5.16c-.27-.79-1.33-.93-1.79-.24-6.49,9.68-11.98,18.89-13.69,26.32-2.67,3.3-2.81,6.82,0,10.62,2.53,7.4,1.97,13.42-1.2,18.28l7.51-1.35c5.08-6.77,8.86-14.24,11.17-22.52,2.53-2.63,3.73-3.94,5.81-5.93,1.34-1.28,1.85-3.22,1.3-4.99Z"/></g>
    <g fill={textColor}><path d="M166.54,28.68h11.68v49.53h-11.68V28.68Z"/><path d="M189.67,28.68h14.42l18.56,32.9V28.68h11.46v49.53h-14.34l-18.63-32.97v32.97h-11.46V28.68Z"/><path d="M256.58,38.59h-15.67v-9.91h42.95v9.91h-15.67v39.62h-11.61v-39.62Z"/><path d="M290.66,28.68h36.37v10.35h-24.69v10.05h20.33v8.87h-20.33v9.91h24.69v10.35h-36.37V28.68Z"/><path d="M358,28.68c6.46,0,11.41,1.38,14.86,4.14,3.45,2.76,5.17,6.68,5.17,11.75,0,3.55-.85,6.53-2.55,8.94-1.7,2.42-4.15,4.24-7.36,5.47l11.02,19.22h-13.16l-9.61-17.52h-8.28v17.52h-11.68V28.68h21.59ZM357.93,51.75c2.71,0,4.78-.55,6.21-1.66,1.43-1.11,2.14-2.65,2.14-4.62s-.72-3.59-2.14-4.69c-1.43-1.11-3.5-1.66-6.21-1.66h-9.83v12.64h9.83Z"/><path d="M409.09,28.68c3.15,0,5.99.43,8.5,1.29,2.51.86,4.66,2.08,6.43,3.66,1.77,1.58,3.13,3.5,4.07,5.77.94,2.27,1.4,4.78,1.4,7.54s-.47,5.25-1.4,7.47c-.94,2.22-2.29,4.1-4.07,5.66-1.77,1.55-3.92,2.75-6.43,3.59-2.51.84-5.35,1.26-8.5,1.26h-9.46v13.31h-11.68V28.68h21.14ZM408.35,54.63c2.91,0,5.16-.68,6.76-2.03,1.6-1.35,2.4-3.22,2.4-5.58s-.8-4.3-2.4-5.66c-1.6-1.35-3.86-2.03-6.76-2.03h-8.72v15.3h8.72Z"/><path d="M459.43,28.68c6.46,0,11.41,1.38,14.86,4.14,3.45,2.76,5.17,6.68,5.17,11.75,0,3.55-.85,6.53-2.55,8.94-1.7,2.42-4.15,4.24-7.36,5.47l11.02,19.22h-13.16l-9.61-17.52h-8.28v17.52h-11.68V28.68h21.59ZM459.36,51.75c2.71,0,4.78-.55,6.21-1.66,1.43-1.11,2.14-2.65,2.14-4.62s-.72-3.59-2.14-4.69c-1.43-1.11-3.5-1.66-6.21-1.66h-9.83v12.64h9.83Z"/><path d="M486.78,53.45c0-3.65.65-7.02,1.96-10.13,1.3-3.1,3.1-5.79,5.4-8.06,2.29-2.27,5.01-4.05,8.17-5.36,3.15-1.31,6.55-1.96,10.2-1.96s7.11.64,10.24,1.92c3.13,1.28,5.84,3.07,8.13,5.36,2.29,2.29,4.09,4.99,5.4,8.1,1.3,3.1,1.96,6.48,1.96,10.13s-.65,7.02-1.96,10.13c-1.31,3.1-3.11,5.8-5.4,8.1-2.29,2.29-5,4.08-8.13,5.36-3.13,1.28-6.54,1.92-10.24,1.92s-7.05-.64-10.2-1.92c-3.15-1.28-5.88-3.07-8.17-5.36-2.29-2.29-4.09-4.99-5.4-8.1-1.31-3.1-1.96-6.48-1.96-10.13ZM498.76,53.37c0,2.02.34,3.91,1.04,5.66.69,1.75,1.65,3.25,2.88,4.51,1.23,1.26,2.69,2.24,4.36,2.96,1.67.71,3.5,1.07,5.47,1.07s3.79-.36,5.47-1.07c1.67-.71,3.13-1.7,4.36-2.96,1.23-1.26,2.19-2.76,2.88-4.51.69-1.75,1.04-3.63,1.04-5.66s-.34-3.88-1.04-5.58c-.69-1.7-1.65-3.18-2.88-4.44-1.23-1.26-2.69-2.24-4.36-2.96-1.68-.71-3.5-1.07-5.47-1.07s-3.8.36-5.47,1.07c-1.68.72-3.13,1.7-4.36,2.96-1.23,1.26-2.19,2.74-2.88,4.44-.69,1.7-1.04,3.56-1.04,5.58Z"/></g>
    <g fill={subtitleColor}><path d="M176.4,92.78c1.53,0,2.91.2,4.13.59,1.22.39,2.26.95,3.13,1.67.86.72,1.52,1.6,1.98,2.64.46,1.04.68,2.19.68,3.45s-.23,2.4-.68,3.41c-.46,1.01-1.11,1.88-1.98,2.59-.86.71-1.9,1.26-3.13,1.64-1.22.38-2.6.57-4.13.57h-4.6v6.08h-5.68v-22.64h10.28ZM176.04,104.64c1.41,0,2.51-.31,3.29-.93.78-.62,1.17-1.47,1.17-2.55s-.39-1.97-1.17-2.59c-.78-.62-1.87-.93-3.29-.93h-4.24v7h4.24Z"/><path d="M194.15,92.78h5.68v22.64h-5.68v-22.64Z"/><path d="M219.45,92.78c1.53,0,2.91.2,4.13.59,1.22.39,2.26.95,3.13,1.67.86.72,1.52,1.6,1.98,2.64.46,1.04.68,2.19.68,3.45s-.23,2.4-.68,3.41c-.46,1.01-1.11,1.88-1.98,2.59-.86.71-1.9,1.26-3.13,1.64-1.22.38-2.6.57-4.13.57h-4.6v6.08h-5.68v-22.64h10.28ZM219.09,104.64c1.41,0,2.51-.31,3.29-.93.78-.62,1.17-1.47,1.17-2.55s-.39-1.97-1.17-2.59c-.78-.62-1.87-.93-3.29-.93h-4.24v7h4.24Z"/><path d="M237.2,92.78h17.68v4.73h-12v4.6h9.88v4.06h-9.88v4.53h12v4.73h-17.68v-22.64Z"/><path d="M275.25,103.76h4.99v-4.7h4.31v4.7h4.96v4.06h-4.96v4.66h-4.31v-4.66h-4.99v-4.06Z"/><path d="M310.43,99.47c0-2.25.82-3.99,2.46-5.2,1.64-1.22,3.98-1.83,7.02-1.83s5.48.65,7.1,1.96c1.62,1.31,2.45,3.13,2.5,5.47h-5.61c-.02-1.01-.39-1.79-1.1-2.31-.71-.53-1.73-.79-3.07-.79-1.17,0-2.08.21-2.73.64-.65.43-.97,1.01-.97,1.76,0,.47.13.87.4,1.2s.62.6,1.06.83c.44.23.96.41,1.54.56.59.15,1.2.28,1.85.39,1.01.2,2.05.42,3.13.66,1.08.24,2.07.59,2.96,1.06s1.63,1.1,2.21,1.89c.57.79.86,1.84.86,3.14,0,2.07-.81,3.73-2.43,4.98-1.62,1.25-4.1,1.88-7.46,1.88s-6-.66-7.71-1.99c-1.71-1.33-2.57-3.13-2.57-5.41h5.61c.09,1.01.54,1.79,1.35,2.31s1.92.79,3.36.79c1.29,0,2.29-.21,3-.64.71-.43,1.06-1.01,1.06-1.76,0-.47-.14-.86-.41-1.17-.28-.3-.65-.56-1.13-.76s-1.04-.37-1.67-.49c-.63-.12-1.3-.24-1.99-.35-.98-.18-1.98-.38-3-.61-1.02-.23-1.95-.58-2.79-1.06s-1.52-1.13-2.05-1.94c-.53-.81-.79-1.88-.79-3.21Z"/><path d="M343.59,97.31h-7.62v-4.53h20.88v4.53h-7.62v18.11h-5.64v-18.11Z"/><path d="M363.93,92.78h17.68v4.73h-12v4.6h9.88v4.06h-9.88v4.53h12v4.73h-17.68v-22.64Z"/><path d="M389.95,92.78h17.68v4.73h-12v4.6h9.88v4.06h-9.88v4.53h12v4.73h-17.68v-22.64Z"/><path d="M415.96,92.78h5.68v17.91h10.17v4.73h-15.85v-22.64Z"/></g>
  </svg>
);

/* ── DATA ─────────────────────────────────────────────── */

const shelfData = [
  { connection: "QB2 Premium", docs: ["Running Procedures", "Blanking Dimensions", "Field Bulletin", "Supplementary Data", "Heavy Wall — USC", "Heavy Wall — Metric", "7in OD Change Notice"] },
  { connection: "QB2-XL Premium", docs: ["Blanking Dimensions"] },
  { connection: "QB1-HT Semi-Premium", docs: ["Running Procedures", "Blanking Dimensions", "Supplementary Data", "Field Trials", "Heavy Wall — USC", "Heavy Wall — Metric"] },
  { connection: "EB Enhanced Buttress", docs: ["Running Procedures", "Blanking Dimensions", "API BC Accessories Bulletin"] },
  { connection: "EB Gen2", docs: ["Blanking Dimensions", "PC-REP-007 Bulletin", "PC-REP-008 Bulletin"] },
];

/* ── COMPONENT ────────────────────────────────────────── */

export default function EVRlockLayout() {
  const [inputValue, setInputValue] = useState("");
  const [shelfOpen, setShelfOpen] = useState(false);
  const [skin, setSkin] = useState("interpro");
  const t = themes[skin];
  const tr = "all 0.2s ease";

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: t.fontBody, position: "relative", transition: tr }}>
      {/* Google Fonts — matching site typography */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* ─── HEADER ─── */}
      <div style={{ background: t.bgHero, padding: "0", transition: tr }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ cursor: "pointer" }}>
            {skin === "rocky" ? <RockyLogo textColor="#FFFFFF" subtitleColor="rgba(255,255,255,0.6)" /> : <InterproLogo textColor="#FFFFFF" subtitleColor="rgba(255,255,255,0.6)" />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Skin swap — pill button matching site style */}
            <div
              onClick={() => setSkin(skin === "rocky" ? "interpro" : "rocky")}
              style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 500, color: t.textOnDark, cursor: "pointer", letterSpacing: "0.05em", padding: "8px 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.25)", transition: tr, display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              {skin === "rocky" ? "INTERPRO" : "ROCKY MTN"}
            </div>
            <span style={{ fontFamily: t.fontLabel, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", cursor: "pointer", letterSpacing: "0.05em" }}>CONTACT</span>
            <div onClick={() => setShelfOpen(!shelfOpen)} style={{ width: 38, height: 38, borderRadius: 999, background: shelfOpen ? t.accent : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: tr, border: `1px solid ${shelfOpen ? t.accent : "rgba(255,255,255,0.2)"}` }} title="Resources">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={shelfOpen ? t.bgHero : "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {shelfOpen ? (<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>) : (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>)}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SHELF ─── */}
      <div onClick={() => setShelfOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 90, opacity: shelfOpen ? 1 : 0, pointerEvents: shelfOpen ? "auto" : "none", transition: "opacity 0.3s ease" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 360, background: "#FFFFFF", borderLeft: `1px solid ${t.border}`, boxShadow: shelfOpen ? "-4px 0 24px rgba(0,0,0,0.1)" : "none", zIndex: 100, transform: shelfOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px 14px", background: t.bgHero, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 500, color: t.accent, letterSpacing: "0.15em", marginBottom: 2 }}>RESOURCES</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: t.fontBody }}>All connection documents</div>
          </div>
          <div onClick={() => setShelfOpen(false)} style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>
        {shelfData.map((g) => (
          <div key={g.connection} style={{ padding: "16px 24px", borderBottom: `1px solid ${t.border}` }}>
            <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 500, color: t.accent, letterSpacing: "0.1em", marginBottom: 10 }}>{g.connection.toUpperCase()}</div>
            {g.docs.map((doc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < g.docs.length - 1 ? `1px solid ${t.border}` : "none", cursor: "pointer" }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: t.bgCard, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.3, fontFamily: t.fontBody }}>{doc}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ─── MAIN COLUMN ─── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 40px 60px", position: "relative", zIndex: 1 }}>

        {/* User message */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ background: t.bgHero, borderRadius: 999, padding: "10px 20px", maxWidth: 400, transition: tr }}>
              <span style={{ fontSize: 14, color: t.textOnDark, fontFamily: t.fontBody }}>tell me about QB2 for 7" thermal wells</span>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: t.bgHero, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          </div>
        </div>

        {/* AI response */}
        <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, transition: tr }}>
            <span style={{ fontSize: 13, color: "#fff", fontWeight: 700, fontFamily: t.fontDisplay }}>E</span>
          </div>
          <div style={{ flex: 1 }}>
            {[
              "The EVRlock QB2 Premium Connection [1] is the go-to for 7\" thermal well intermediate casing. It's proven in the most challenging environments — SAGD, CSS, cyclic steam — where connections need to handle extreme temperature cycling without losing seal integrity.",
              "The engineered micro-finished metal-to-metal radial seal provides consistent sealing and ensures even distribution of thread compound. The large compound relief groove adjacent to the seal is what makes it forgiving during make-up — you get smooth, worry-free assembly even in field conditions.",
              "For the 7\" P110 at 26 lb/ft, you're looking at a collapse rating of 8,600 psi and burst of 12,350 psi. Joint strength exceeds 100% pipe body in both tension and compression thanks to the reverse load flank and steep stabbing flank design.",
              "Make-up torque for this size in P110 is 8,100 ft·lb optimal (window ±700). The running procedures [2] recommend field-end inspection with the EVRlock QB2 ring gauge before every make-up.",
            ].map((p, i) => (
              <p key={i} style={{ fontSize: 15, color: t.textSecondary, lineHeight: 1.75, margin: "0 0 16px 0", fontFamily: t.fontBody, letterSpacing: "-0.01em", transition: tr }}>{p}</p>
            ))}
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16, marginTop: 24, transition: tr }}>
              <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 500, color: t.textMuted, letterSpacing: "0.15em", marginBottom: 10, textTransform: "uppercase" }}>References</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["[1] QB2 Supplementary Data", "[2] QB2 Running Procedures", "[3] QB2 Field Bulletin"].map((r) => (
                  <span key={r} style={{ fontFamily: t.fontLabel, fontSize: 12, fontWeight: 400, color: t.textSecondary, background: t.bgCard, borderRadius: 999, padding: "6px 16px", cursor: "pointer", transition: tr, border: `1px solid ${t.border}` }}>{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Suggested prompts */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, paddingLeft: 46 }}>
          {["Compare QB2 vs QB1-HT for this size", "Show me all 7\" P110 options", "What about QB2-XL for larger diameters?"].map((p) => (
            <span key={p} style={{ fontFamily: t.fontLabel, fontSize: 12, fontWeight: 400, color: t.textSecondary, border: `1px solid ${t.border}`, borderRadius: 999, padding: "8px 18px", cursor: "pointer", transition: tr }}>{p}</span>
          ))}
        </div>

        {/* Input */}
        <div style={{ background: "#FFFFFF", borderRadius: 999, padding: "10px 10px 10px 24px", display: "flex", alignItems: "center", gap: 12, marginBottom: 48, marginLeft: 46, border: `1px solid ${t.border}`, boxShadow: t.shadow, transition: tr }}>
          <input type="text" placeholder="Ask me anything..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: t.textPrimary, fontFamily: t.fontBody }} />
          <div style={{ width: 36, height: 36, borderRadius: 999, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: tr }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </div>
        </div>

        {/* ─── PERFORMANCE DATA ─── */}
        <div style={{ paddingLeft: 46 }}>
          <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 500, color: t.textMuted, letterSpacing: "0.15em", marginBottom: 16, textTransform: "uppercase" }}>Referenced Performance Data</div>

          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden", marginBottom: 20, boxShadow: t.shadow, transition: tr }}>
            <div style={{ padding: "14px 20px", background: t.bgHero, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.accent, letterSpacing: "0.05em", marginRight: 12, fontWeight: 500 }}>1</span>
                <span style={{ fontSize: 16, color: t.textOnDark, fontWeight: 700, fontFamily: t.fontDisplay, letterSpacing: "-0.03em" }}>QB2 Premium — 7" P110</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {["USC", "METRIC"].map((u, i) => (
                  <span key={u} style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 500, color: i === 0 ? "#FFFFFF" : "rgba(255,255,255,0.5)", background: i === 0 ? "rgba(255,255,255,0.15)" : "transparent", borderRadius: 999, padding: "4px 12px", cursor: "pointer", letterSpacing: "0.05em" }}>{u}</span>
                ))}
                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />
                <span style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 500, color: t.accent, background: `${t.accent}20`, borderRadius: 999, padding: "5px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.03em" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Print Data Sheet
                </span>
              </div>
            </div>
            {[
              { label: "PHYSICAL PROPERTIES", cols: 4, rows: [["OD","7.000 in"],["Wall","0.362 in"],["ID","6.276 in"],["Weight","26.00 lb/ft"],["Drift","6.151 in"],["Coupling OD","7.656 in"],["Coupling Len","9.500 in"],["M/U Loss","7.09 in"]] },
              { label: "MECHANICAL PROPERTIES — P110", cols: 4, rows: [["Collapse","8,600 psi"],["Burst","12,350 psi"],["Joint (UTS)","625 kip"],["Joint (YS)","540 kip"]] },
              { label: "MAKE-UP TORQUE — P110", cols: 3, rows: [["Optimal","8,100 ft·lb"],["Window (±)","700 ft·lb"],["Yield","12,750 ft·lb"]] },
            ].map((section, si) => (
              <div key={si} style={{ padding: "14px 20px", borderBottom: si < 2 ? `1px solid ${t.border}` : "none" }}>
                <div style={{ fontFamily: t.fontLabel, fontSize: 9, fontWeight: 500, color: t.textMuted, letterSpacing: "0.12em", marginBottom: 10 }}>{section.label}</div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.cols}, 1fr)`, gap: 8 }}>
                  {section.rows.map(([k, v]) => (
                    <div key={k} style={{ padding: "8px 10px", background: t.bgCard, borderRadius: 8, transition: tr }}>
                      <div style={{ fontFamily: t.fontLabel, fontSize: 9, fontWeight: 400, color: t.textMuted, marginBottom: 3, letterSpacing: "0.03em" }}>{k}</div>
                      <div style={{ fontFamily: t.fontLabel, fontSize: 14, fontWeight: 500, color: t.textPrimary }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* PDF docs card */}
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden", boxShadow: t.shadow, transition: tr }}>
            <div style={{ padding: "14px 20px", background: t.bgHero, display: "flex", alignItems: "center" }}>
              <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.accent, letterSpacing: "0.05em", marginRight: 12, fontWeight: 500 }}>2</span>
              <span style={{ fontSize: 16, color: t.textOnDark, fontWeight: 700, fontFamily: t.fontDisplay, letterSpacing: "-0.03em" }}>QB2 Technical Documents</span>
            </div>
            <div style={{ padding: "8px 20px" }}>
              {[
                { name: "EVRlock QB2 Running Procedures", size: "1.2 MB" },
                { name: "EVRlock QB2 Blanking Dimensions", size: "0.8 MB" },
                { name: "EVRlock QB2 Field Bulletin", size: "0.6 MB" },
                { name: "EVRlock QB2 Supplementary Data", size: "1.4 MB" },
                { name: "EVRlock QB2 Heavy Wall Compatibility", size: "0.9 MB" },
              ].map((doc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < 4 ? `1px solid ${t.border}` : "none", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: t.bgCard, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.fontLabel, fontSize: 9, fontWeight: 500, color: t.accent, transition: tr }}>PDF</div>
                    <span style={{ fontSize: 14, color: t.textSecondary, fontFamily: t.fontBody }}>{doc.name}</span>
                  </div>
                  <span style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 400, color: t.textMuted }}>{doc.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
