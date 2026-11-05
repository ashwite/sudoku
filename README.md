# Sudoku

Eine kleine Website mit HTML, CSS und JavaScript. Ohne Framework und ohne Installation.

## Dateien

- `index.html`: Aufbau der Seite und Navigation.
- `style.css`: Farben, Schriften, Größen und Animationen.
- `app.js`: Sudoku-Erzeugung, Eingaben, Speichern und Einstellungen.
- `assets/`: Logo für helle und dunkle Hintergründe.

Die Kommentare in den drei Dateien erklären die einzelnen Abschnitte.

## Lokal öffnen

`index.html` im Browser öffnen. Alternativ im Projektordner einen lokalen Server starten:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Danach `http://localhost:4173` öffnen. Die Schriften Jost und WindSong werden von Google Fonts geladen.

## Häufige Änderungen

- Text und Menüpunkte: in `index.html`.
- Schriftgrößen und Abstände: in `style.css`.
- Farbthemes: Farbpaare am Anfang von `style.css` und die Liste `PALETTES` in `app.js`.
- Anzahl vorgegebener Zahlen: `CLUE_COUNTS` in `app.js`. Weniger Vorgaben machen das Rätsel meist schwieriger; die Zahl allein ist keine Bewertung der nötigen Lösungsstrategien.
- Wartezeit vor dem nächsten Sudoku: `1200` Millisekunden in `advanceAfterCompletion()`.

## Bedienung

Ein Feld auswählen und eine Zahl anklicken oder 1–9 drücken. Ein zweiter Tipp auf das ausgewählte Feld löscht die eigene Eingabe. Vorgegebene Zahlen bleiben stehen. Pfeiltasten wechseln das Feld; Rücktaste oder Entf löschen. Sobald alles richtig gelöst ist, beginnt automatisch ein neues Sudoku derselben Schwierigkeitsstufe.

Ohne Konto bleibt der Spielstand im Browser. Mit einem Clerk-Konto kannst du ihn über „Speichern“ und „Laden“ zwischen Geräten übertragen. Die Anzeigeeinstellungen bleiben im jeweiligen Browser.

## Sprache und gespeicherte Einstellungen

Deutsch und Englisch lassen sich in der Navigation umschalten. Alle Übersetzungen stehen in der Liste `TEXT` in `app.js`. `data-text` übersetzt sichtbare Texte in der HTML-Datei, `data-label` deren Beschriftung für Screenreader.

Die Schlüssel `sudoku-language`, `sudoku-palette` und `sudoku-theme` speichern die Sprache, das Farbtheme und den Hell-/Dunkelmodus im Browser. Die kleine Anweisung im HTML-Kopf liest sie vor der ersten Anzeige. Der Wechsel der Sprache verändert den Spielstand nicht.
