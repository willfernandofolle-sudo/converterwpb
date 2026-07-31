# Guida Supporto Rapida (IT)

Questa guida e pensata per il supporto operativo: cosa modificare, dove, e in che ordine.

## Dove intervenire

- `config/zip-modules.js`: configurazione moduli opzionali e moduli obbligatori.
- `public/modules/`: file JS dei moduli (fallback locale).
- `pages/index.js`: logica di conversione e injection HTML.

## Come aggiornare un modulo esistente

1. Sostituisci il file modulo in `public/modules/`.
2. Apri `config/zip-modules.js` e verifica la voce del modulo.
3. Controlla che `name` corrisponda esattamente al file.
4. Mantieni `urls` in questo ordine:
   - `/modules/nome-file.js`
   - URL raw GitHub branch `main`
   - URL raw GitHub branch `master`

## Come aggiornare il path di un modulo

Se cambi cartella o nome file:

1. Aggiorna il file fisico in `public/modules/`.
2. Aggiorna `name` e `urls` in `config/zip-modules.js`.
3. Verifica che il path locale `/modules/...` apra correttamente nel browser.

## Come aggiungere un nuovo modulo opzionale

1. Aggiungi il file in `public/modules/`.
2. In `config/zip-modules.js`, aggiungi una nuova voce dentro `ZIP_MODULES` con:
   - `id` univoco
   - `name` uguale al nome file
   - `label` testo visibile in UI
   - `defaultChecked` (`true` o `false`)
   - `urls` con fallback locale + GitHub
3. Salva e testa la conversione ZIP selezionando il modulo.

## Moduli sempre inclusi

I moduli non opzionali stanno in `AUTO_INCLUDE_MODULES` in `config/zip-modules.js`.

Se li aggiorni, applica la stessa regola di path/fallback usata per i moduli opzionali.

## Modulo alarms: immagini richieste

Quando il modulo `alarms.js` e selezionato, il converter aggiunge automaticamente anche queste immagini nel file ZIP finale:

- `img/active.webp`
- `img/inactive.webp`
- `img/resettable.webp`

Sorgente immagini nel progetto:

- `public/images/active.webp`
- `public/images/inactive.webp`
- `public/images/resettable.webp`

## Come aggiornare le immagini alarms in futuro

1. Sostituisci i file in `public/images/` mantenendo gli stessi nomi.
2. Se cambi nome o estensione, aggiorna la mappatura asset in `pages/index.js` (configurazione `OPTIONAL_MODULE_ASSETS`, voce `alarms`).
3. Se usi estensioni diverse da `.webp`, verifica la logica in `public/modules/alarms.js` (riconoscimento filename stato).
4. Esegui un test: seleziona `alarms`, converti uno ZIP e verifica che le 3 immagini siano presenti in `img/` nel pacchetto finale.

## Checklist rapida supporto

1. File presente in `public/modules/`.
2. `name` allineato al nome file reale.
3. `urls` corrette e in ordine locale -> main -> master.
4. Se `alarms` e selezionato, verifica presenza di `active.webp`, `inactive.webp`, `resettable.webp` in `img/` nel ZIP finale.
5. Conversione ZIP completata senza `Error fetching ...`.
