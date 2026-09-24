# Mockups — anteprime per i clienti

Repo che pubblica i mockup navigabili su **https://mockup.t3-group.it/** tramite GitHub Pages.
Ogni cliente/progetto ha la sua cartella; l'URL da condividere è `https://mockup.t3-group.it/<cartella>/`.

| Cartella | Cliente / progetto | URL |
|---|---|---|
| `giannattasio/` | Stadio Pasquale Giannattasio — redesign home | https://mockup.t3-group.it/giannattasio/ |
| `nea-ostia-rugby/` | Nea Ostia Rugby — redesign home | https://mockup.t3-group.it/nea-ostia-rugby/ |

## Aggiungere un mockup
1. Crea una cartella con un nome breve, minuscolo, senza spazi (es. `nome-cliente`).
2. Metti dentro il file `index.html` (autonomo: CSS/JS inline, immagini incorporate o nella stessa cartella).
3. Aggiungi la riga alla tabella qui sopra.
4. Commit e push su `main`. Online in 1–2 minuti.

Si può fare anche dall'interfaccia web di GitHub: *Add file → Upload files* dentro la cartella.

## Aggiornare un mockup
Sostituisci `index.html` nella cartella del cliente e fai push. Lo stesso URL mostra la nuova versione.

## Rimuovere un mockup (a fine progetto)
Cancella la cartella e togli la riga dalla tabella.

## Regole
- Nessun elenco pubblico: la home del dominio è una pagina vuota, i mockup si raggiungono solo con l'URL diretto.
- `robots.txt` blocca l'indicizzazione. Non è una protezione: chi ha l'URL vede la pagina.
- Non usare link relativi a file fuori dalla cartella del cliente.
- Non caricare dati reali dei clienti (credenziali, liste, documenti).

## Setup iniziale (fatto una volta sola)
- Settings → Pages → Build and deployment: *Deploy from a branch*, branch `main`, folder `/ (root)`.
- Settings → Pages → Custom domain: `mockup.t3-group.it`, poi *Enforce HTTPS* (attivabile dopo che il DNS propaga).
- DNS di t3-group.it: record `CNAME` con host `mockup` → `t3-group-srl.github.io`.
- Il file `CNAME` in root deve contenere `mockup.t3-group.it` (non cancellarlo).
