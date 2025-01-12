# Skryba

Skryba to makro/skrypt do automatyzacji zadań używając Google App Script. To
repozytorium zawiera automatyzacje formularza, po którego wypełnieniu zostanie
wysłany mailem plik PDF z wartościami z formularza, wszystko w 104 linijek kodu
(170 jeśli liczyć komentarze).

Skryba został napisany bardzo minimalistycznie, żeby znając angielski zrozumieć
jak działa, a przy podstawowej znajomości programowania być w stanie dostosować
działanie skryby pod swoje potrzeby.

### Deployment with clasp

```
clasp create --parentId "sheet_id"
clasp push
```
