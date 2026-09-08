# Store-Beschreibung — Deutsch (Lokalisierung)

Version: 1.3.1. Englische Hauptfassung und technische Einreichungsangaben: `listing.md`.

Name: KoalaClicker

Kurzbeschreibung: Wiederhole Klicks auf ausgewählte Seitenelemente. Mit Intervallen, lokalen Zielen und Stop-Steuerung im Popup.

## Beschreibung

Wähle ein Element, lege ein Intervall fest und starte bewusst.

KoalaClicker wiederholt synthetische Mausklicks auf ausgewählte Elemente einer Webseite. Für Idle-Games und wiederkehrende Web-Aufgaben, soweit die jeweilige Website dies erlaubt.

- Bis zu 50 Ziele pro Website, jeweils mit eigenem Namen und Intervall.
- Ganze Millisekunden von 25 bis 86.400.000.
- Neue Ziele werden gestoppt gespeichert. Start und Stop steuerst du im Popup.
- Alle Clicker dieser Website stoppen, Ziele löschen oder ein Ziel erneut auswählen.
- Gemeinsame Einstellungen für Pfade derselben Origin und bereits aktivierte Tabs.
- Escape beendet die Auswahl. Gewöhnliche Link- und Formularaktionen werden bei der Auswahl unterdrückt.

Öffne das Symbol oder nutze Alt+Shift+K (macOS: MacCtrl+Shift+K). Wähle Add New Clicker, klicke auf ein Ziel und starte es nach erneutem Öffnen. Das Schließen des Popups stoppt aktive Clicker nicht. Navigation und Neuladen stoppen das Dokument; erneutes Öffnen stellt aktive Konfigurationen wieder her.

Origins, Selektoren, Namen, Intervalle und Aktivzustände werden lokal gespeichert. Die Erweiterung enthält keine Telemetrie, Werbung, nachgeladenen Code oder externen Schriften. Sie benötigt activeTab, storage und scripting, keine dauerhaften Host-Rechte. Zielseiten können durch Klicks Formulare absenden, navigieren oder eigene Netzwerkanfragen auslösen.

Grenzen: nur unterstützte HTTP/HTTPS-Hauptdokumente. Frames, Shadow DOM und Canvas-Inhalte sind nicht unterstützt. Fehlende, unsichtbare, deaktivierte, verdeckte, außerhalb des sichtbaren Bereichs liegende oder mehrdeutige Ziele werden übersprungen. Nach DOM-Änderungen kann eine erneute Auswahl nötig sein. Synthetische Events sind keine vertrauenswürdigen Hardware-Klicks; Websites können sie ablehnen. Browser-Drosselung und Standby beeinflussen die Rate. 25 ms garantieren keine 40 akzeptierten Klicks pro Sekunde. Spielinterne Zeitwerte werden nicht verändert.

Code und Hilfe: https://github.com/Shik3i/KoalaClicker
Support: https://github.com/Shik3i/KoalaClicker/issues
Datenschutz: https://github.com/Shik3i/KoalaClicker/blob/main/PRIVACY.md
Impressum: https://koalastuff.net/legal
