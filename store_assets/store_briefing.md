# KoalaClicker: Chrome Web Store Release & Developer Briefing
Dieses Dokument dient als detaillierte Systembeschreibung und strategischer Prompt-Kontext für **Gemini Pro**. Kopiere den gesamten Inhalt dieses Dokuments in deinen Chat mit Gemini, um passgenaue Texte, Store-Beschreibungen, datenschutzrechtliche Begründungen und Marketingmaterialien für den Release im Chrome Web Store (und Firefox Add-ons Store) generieren zu lassen.

---

## 🎯 System-Übersicht & Core Value Proposition

**KoalaClicker** ist eine moderne, extrem leichtgewichtige und konsequent auf Datenschutz ausgerichtete **Auto-Clicker-Browser-Extension** (Manifest V3). Sie wurde speziell für Idle Games (wie Cookie Clicker), Klicker-Spiele und repetitive Web-Tasks entwickelt. 

### Das Problem bestehender Auto-Clicker:
1. **Sicherheitsrisiken & Datenschutz-Verstöße:** Die meisten Auto-Clicker im Chrome Web Store verlangen Berechtigungen für alle Webseiten (`<all_urls>` oder `*://*/*`). Dadurch können sie theoretisch den gesamten Browserverlauf auslesen, sensible Passwörter abfangen und Daten an externe Server senden.
2. **Träges UI & Bloatware:** Viele Erweiterungen nutzen schwere Frameworks, verstopfen die DOM-Performance oder binden Tracking-Bibliotheken ein.
3. **Timing-Kompatibilität bei Clicker-Games:** Manche Spiele ignorieren sehr schnelle synthetische Klicks, wenn lokale Zeitstempel nicht zu normalen Nutzereingaben passen.

### Die KoalaClicker-Lösung:
KoalaClicker operiert nach dem Prinzip **"Privacy-First"**. Durch die Nutzung der `activeTab`-Berechtigung hat die Extension **keinerlei Zugriff** auf Webseiten, solange der User nicht explizit auf das Extension-Icon klickt. Es gibt **keine externen Abhängigkeiten (Zero Dependencies)**, kein Framework (reines Vanilla JS, HTML, CSS), keine externen Schriftarten und absolut keine Tracker. Zudem verfügt KoalaClicker über eine integrierte Umgehung für Spiel-Engines und eine hochpräzise Klicksimulation.

---

## 🛠️ Technische Architektur & Features im Detail

Für die Generierung von Store-Beschreibungen und technischen Rechtfertigungen muss Gemini Pro die genaue Funktionsweise der Komponenten verstehen:

### 1. Permission-Modell (Das wichtigste Argument für die Store-Zulassung)
*   **`activeTab` (Aktivierte Registerkarte):** Die Extension injiziert Skripte *nur* auf expliziten Benutzerwunsch (Klick auf das Icon). Sie liest niemals im Hintergrund die Historie mit.
*   **`storage` (Lokaler Speicher):** Konfigurierte Klicker (CSS-Selektoren, Klick-Intervalle und Aktiv-Status) werden ausschließlich lokal via `chrome.storage.local` auf dem Gerät des Nutzers gespeichert. Kein Server, keine Cloud, keine Datenübertragung.
*   **`scripting` (Skripterstellung):** Ermöglicht das dynamische Ausführen des Content-Scripts im Kontext der aktiven Seite sowie das Injizieren des Kompatibilitätshelfers.

### 2. Der Selektor-Generator (`generateSelector` in `content.js`)
KoalaClicker findet Elemente auch nach Seiten-Reloads zuverlässig wieder.
*   **Priorisierte Daten-Attribute:** Sucht zuerst nach stabilen Test-IDs wie `data-testid` oder `data-cy`.
*   **Ausschluss dynamischer IDs:** Viele moderne Webseiten nutzen dynamische, gehashte Klassen/IDs (z. B. `css-1ab2c3` oder `button-5281-active`). Die Extension filtert diese über eine Regex-Prüfung (`isDynamicId`) aus, um fehlerhafte Selektoren zu verhindern.
*   **Robuste DOM-Traversierung:** Falls keine statische ID existiert, klettert das Skript den DOM-Baum hinauf und baut einen CSS-Pfad unter Nutzung von `:nth-of-type()` relativ zu den Geschwisterelementen (z. B. `body > div#app > main > button:nth-of-type(2)`).

### 3. Hochpräzise Klick-Simulation (`triggerClick`)
Anstatt einfach nur `element.click()` aufzurufen, simuliert KoalaClicker ein vollkommen realistisches Nutzerverhalten im Browser:
*   **Dynamische Koordinatenberechnung:** Nutzt `getBoundingClientRect()`, um das exakte Zentrum des Elements zu berechnen – selbst wenn sich das Element bewegt.
*   **Vollständige Event-Sequenz:** Feuert nacheinander die echten Events `mousedown` ➔ `mouseup` ➔ `click` mit den berechneten Koordinaten ab.
*   **Element-Caching:** Zur Schonung der CPU-Leistung werden gefundene DOM-Elemente gecached (`elementCache`). Sollte ein Element aus dem DOM entfernt oder neu geladen werden (`!isConnected`), wird der Cache automatisch und ohne Memory-Leaks erneuert.
*   **Sicherheitsgrenzen:** Das Klick-Intervall lässt sich bis auf minimale **25 ms** (40 Klicks pro Sekunde) herunterschrauben, wird aber nach unten hin abgeriegelt, um ein Einfrieren des Browsers zu verhindern. Bis zu **50 Klicker parallel** pro Webseite sind möglich.

### 4. Game-Kompatibilität (`compatibility.js`)
*   Einige Clicker-Games (z. B. Cookie Clicker) verwalten lokale Timing-Zustände wie `Game.lastClick`, die sehr schnelle Klickfolgen beeinflussen können.
*   KoalaClicker injiziert ein winziges Hilfsskript direkt in die **`MAIN`-Welt** der Webseite (wo der JS-Kontext des Spiels läuft). Dieses Skript hält bekannte lokale Timing-Zustände kompatibel, damit der vom Nutzer konfigurierte Klickrhythmus zuverlässig registriert wird.

---

## 🎨 Visuals & UI-Design (Aesthetic Guidelines)

Für die Erstellung von Werbebildern, Bannern und Store-Screenshots muss Gemini das Design-System kennen. KoalaClicker setzt auf ein extrem edles, hochmodernes **Dracula-inspiriertes Dark-Mode Theme**:

*   **Farbpalette:**
    *   *Hintergrund (Background):* Deep Space Navy (`#1e1e2e`)
    *   *Karten/Header (Panel-BG):* Dark Slate Grey (`#282a36`)
    *   *Haupttext (Text-Main):* Soft Off-White (`#f8f8f2`)
    *   *Inaktiver Text (Text-Muted):* Slate Lavender-Grey (`#6272a4`)
    *   *Akzentfarbe (Accent Primary):* Electric Violet / Purple (`#bd93f9`)
    *   *Akzent-Hover (Accent Hover):* Hot Pink (`#ff79c6`)
    *   *Start-Button (Aktiviert):* Vibrant Emerald Green (`#50fa7b`) mit dunklem Text
    *   *Löschen-Button (Danger):* Coral Red (`#ff5555`) mit Hover-Effekt (`#ff6e6e`)
    *   *Rahmen (Border):* Medium Slate Blue-Grey (`#44475a`)
*   **UI-Komponenten:**
    *   **Kompakte Popup-Breite:** Exakt `320px` breit.
    *   **Clicker-Karten:** Jedes angelegte Klick-Ziel wird in einer eigenen Box gerendert. Man kann den Namen des Klickers direkt inline umbenennen und das Klickintervall in Millisekunden (`ms`) eingeben.
    *   **Live-Highlighting:** Fährt man im Popup mit der Maus über eine Clicker-Karte, sendet die Erweiterung eine Nachricht an die Seite und hebt das entsprechende Element auf der Live-Webseite mit einem pulsierenden, pinken Rahmen (`outline: 3px solid #ff79c6`, `box-shadow`) hervor.
    *   **Auswahlmodus-Banner:** Befindet man sich im Element-Auswahlmodus, erscheint am oberen Bildschirmrand der Webseite ein elegantes schwebendes Banner (`#282a36`) mit lila Rand (`#bd93f9`) und einem roten Cancel-Button, um die Auswahl abzubrechen.
    *   **Schwebende Toasts:** Erfolgsmeldungen (z. B. "Clicker 1 successfully added!") erscheinen unten rechts auf der Webseite als moderne, halbtransparente Glassmorphismus-Toasts (`backdrop-filter: blur(8px)`) mit lila Akzent-Balken links und einer geschmeidigen Einblend-Animation.

---

## 📄 Store-Richtlinien & Compliance (Wichtige Fakten für Gemini)

Der Chrome Web Store ist extrem streng bei der Freigabe. Gemini Pro muss diese Aspekte zwingend berücksichtigen, um Ablehnungen zu vermeiden:

1.  **Single-Purpose Policy (Einzige Zweckbestimmung):** Die Erweiterung hat genau eine Funktion: Sie ermöglicht das automatisierte Klicken auf vom Benutzer definierte Web-Elemente. Keine versteckten Features.
2.  **User Data Policy (Umgang mit Nutzerdaten):**
    *   *Keine Erfassung personenbezogener Daten.*
    *   *Keine Übertragung von Daten über das Netzwerk.*
    *   *Kein Tracking, keine Analytics.*
    *   *Lokale Speicherung ist rein funktional.*
3.  **Sicherheit und Code-Qualität:**
    *   Kein `eval()` oder dynamische Code-Ausführung aus externen Quellen.
    *   Reiner, lesbarer Vanilla-Code.
    *   Sichere CSP (Content Security Policy) Einhaltung durch Trennung von Main-World Injection (`compatibility.js`) und Isolated Content Script (`content.js`).

---

## 🤖 Prompts für Gemini Pro (Copy-Paste Vorlagen)

*Hier sind fertige Befehle, die du im Chat mit Gemini Pro nutzen kannst. Kopiere einfach dieses Dokument und stelle eine der folgenden Fragen hinten an:*

### Option A: Generierung der Web Store Beschreibungen
```text
Hallo Gemini! Ich habe dir oben das komplette technische Briefing für meine Extension "KoalaClicker" gegeben.
Bitte generiere mir nun folgende Marketing-Texte für den Chrome Web Store in erstklassigem, professionellem Deutsch:

1. Einen knackigen "Short Description" (Kurzbeschreibung, maximal 86 Zeichen!). Sie muss neugierig machen, die Privacy-Features betonen und den Nutzen sofort auf den Punkt bringen.
2. Eine ausführliche "Long Description" (Ausführliche Beschreibung, strukturiert mit Emojis, Bullet Points und Zwischenüberschriften). Gehe dabei besonders auf folgende Aspekte ein:
   - Warum KoalaClicker sicherer und privater ist als alle anderen Clicker (activeTab).
   - Die extrem intuitive Bedienung (Element anklicken zum Auswählen, Live-Highlighting beim Hovern).
   - Technische Vorteile (Mehrere Clicker gleichzeitig, Kompatibilitätshelfer für Spiele wie Cookie Clicker, extrem ressourcenschonend ohne Bloat).
   - Eine kurze Schritt-für-Schritt-Anleitung zur Nutzung.
3. Einen "Promo Text" (maximal 120 Wörter) für Banner-Platzierungen.

Achte auf einen modernen, dynamischen Schreibstil, der sowohl Gamer als auch Power-User anspricht!
```

### Option B: Generierung der technischen Begründungen für Google Reviews
```text
Hallo Gemini! Bei der Einreichung im Chrome Developer Dashboard muss ich detailliert begründen, warum meine Extension bestimmte sensible Permissions benötigt. Wenn die Begründung nicht stichhaltig ist, wird die Extension abgelegen.
Bitte schreibe mir auf Englisch (da die Google-Reviewer meist Englisch sprechen) hochprofessionelle, präzise und überzeugende Rechtfertigungen für:

1. Die Permission "activeTab": Erkläre, dass wir dadurch das Auslesen fremder Tabs komplett unterbinden und die Skripte nur dann injizieren, wenn der Nutzer die Extension explizit aufruft (Sicherheit/Datenschutz).
2. Die Permission "storage": Erkläre, dass wir dies ausschließlich lokal verwenden, um die vom Benutzer erstellten Selektoren und Intervalle zu sichern, damit diese beim nächsten Besuch der Seite wieder zur Verfügung stehen – ohne dass Daten an Server übertragen werden.
3. Die Permission "scripting": Erkläre, dass diese zwingend benötigt wird, um den Klick-Simulations-Loop (Content Script) und das native Kompatibilitätsskript im Tab auszuführen.
4. Erkläre, warum keine `web_accessible_resources` deklariert sind: Die Extension injiziert eigene Dateien über `chrome.scripting`, ohne sie Webseiten allgemein als abrufbare Ressourcen offenzulegen.

Formuliere die Antworten so respektvoll, klar und technisch fundiert wie möglich!
```

### Option C: Vorgaben für Grafikdesigner / KI-Bildgeneratoren (Store Assets)
```text
Hallo Gemini! Ich muss Store-Assets erstellen (Icon in 128x128, Kachelbild in 440x280, Screenshot in 1280x800).
Basierend auf den visuellen Richtlinien von KoalaClicker (Dracula-Theme, Deep Space Navy #1e1e2e, Electric Violet #bd93f9, Hot Pink #ff79c6, niedlicher/cooler Koala-Bezug):

1. Generiere mir 3 kreative Prompts für Bildgeneratoren (wie Midjourney oder DALL-E 3) für das Extension-Icon. Es soll ein minimalistischer, moderner Koala sein, der einen Tech- oder Gaming-Vibe hat.
2. Beschreibe mir ein detailliertes Layout für das Store-Banner (440x280). Welche Farben, welche Typografie, wo steht das Logo, welche Key-Benefits sollen als Text darauf stehen?
3. Gib mir Regieanweisungen für 3 Screenshots (1280x800): Was genau soll auf den Bildern zu sehen sein? Welche Webseiten im Hintergrund (z. B. ein fiktives Clicker-Game), wie soll das Popup abgebildet werden, welche Beschriftungen/Pfeile machen Sinn?
```

### Option D: Generierung der Datenschutzerklärung (Privacy Policy Update)
```text
Hallo Gemini! Ich möchte sicherstellen, dass meine Datenschutzerklärung (basierend auf PRIVACY.md) den Richtlinien des Chrome Web Stores entspricht.
Erstelle mir bitte eine ausführliche, rechtlich saubere Datenschutzerklärung auf Deutsch und Englisch, die ich auf meiner Website verlinken kann. Hebe hervor, dass absolut keine personenbezogenen Daten erhoben oder verarbeitet werden, dass alle Daten lokal im Browser verbleiben (chrome.storage.local) und wie die activeTab Permission als Sicherheits-Feature fungiert.
```
