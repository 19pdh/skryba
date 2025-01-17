# Skryba

Skryba to makro/skrypt do automatyzacji zadań używając Google App Script. To
repozytorium zawiera automatyzacje formularza, po którego wypełnieniu zostanie
wysłany mailem plik PDF z wartościami z formularza.

Skryba został napisany bardzo minimalistycznie, żeby znając angielski zrozumieć
jak działa, a przy podstawowej znajomości programowania być w stanie dostosować
działanie skryby pod swoje potrzeby.

# Get started

Otwórz
[ten plik](https://docs.google.com/spreadsheets/d/1dZHp7EYPEqkQppTfCZmatav_lmWN5UIIXT4v6XBhHBo/edit?gid=761902334#gid=761902334),
kliknij w menu Plik > Utwórz kopię, postępuj zgodnie z Instrukcją.

## updateSheets

W folderze `utils` znajduje się skrypt updateSheets, który może aktualizować
wersje skryby w utworzonych arkuszach. Żeby go użyć trzeba stworzyć plik na
przykładzie `example.sheets.json` - skrypt do aktualizowania używa
[`clasp`](https://github.com/google/clasp)

```
./utils/updateSheets.sh sheets.json
```

### Deployment with clasp

```
clasp create --parentId "sheet_id"
clasp push
```
