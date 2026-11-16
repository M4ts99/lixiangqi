# Xiangqi

Unter Windows `Xiangqi-Offline.html` per Doppelklick in Edge oder Chrome öffnen.
`Start-Xiangqi.cmd` öffnet dieselbe Datei im Standardbrowser. Dafür ist kein
lokaler Webserver nötig.

Die Dateien können auch direkt von einem statischen Webhost ausgeliefert werden.
Für Vercel diesen Ordner als Projektwurzel wählen, das Preset **Other** verwenden
und das Ausgabeverzeichnis auf `.` setzen. Es gibt keinen Build-Schritt.

Die KI ist eine lokale Suche mit Material- und Stellungsbewertung. Alle drei
Stufen rechnen in einem Web Worker. Die Partie wird im Browser gespeichert.
Der Service Worker speichert die Dateien nach dem ersten erfolgreichen Laden
für die Offline-Nutzung. Er benötigt HTTPS oder die lokale Adresse oben.

Die Wiederholungsregel erkennt dreifache Stellung und einseitiges Dauerschach.
Die vollständige Turnierregel für wiederholte Verfolgung ist noch offen.
