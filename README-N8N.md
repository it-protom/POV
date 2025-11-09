# n8n - Setup Locale

Questo documento descrive come avviare n8n in locale utilizzando Docker.

## Prerequisiti

- Docker installato e funzionante
- Docker Compose installato

## Configurazione Rapida

1. **Crea il file `.env`** (opzionale, per personalizzare le credenziali):
   ```bash
   cp .env.example .env
   ```
   Modifica i valori in `.env` se necessario.

2. **Avvia il container**:
   ```bash
   docker-compose up -d
   ```

3. **Accedi a n8n**:
   - Apri il browser e vai a: http://localhost:5678
   - Username: `admin` (o quello configurato in `.env`)
   - Password: `admin` (o quella configurata in `.env`)

## Comandi Utili

### Avviare n8n
```bash
docker-compose up -d
```

### Fermare n8n
```bash
docker-compose down
```

### Visualizzare i log
```bash
docker-compose logs -f n8n
```

### Fermare e rimuovere i dati (ATTENZIONE: cancella tutti i workflow)
```bash
docker-compose down -v
```

### Riavviare n8n
```bash
docker-compose restart n8n
```

## Persistenza Dati

I dati di n8n (workflow, credenziali, ecc.) sono salvati nel volume Docker `n8n_data`. Questo significa che anche se rimuovi il container, i dati rimangono salvati.

Per vedere dove sono salvati i dati:
```bash
docker volume inspect pov_n8n_data
```

## Configurazione Avanzata

### Usare PostgreSQL invece di SQLite

Se vuoi usare PostgreSQL come database, puoi modificare il `docker-compose.yml` aggiungendo un servizio PostgreSQL e le relative variabili d'ambiente.

### Cambiare la porta

Per cambiare la porta (ad esempio a 8080), modifica nel `docker-compose.yml`:
```yaml
ports:
  - "8080:5678"
```

### Variabili d'Ambiente Disponibili

- `N8N_BASIC_AUTH_ACTIVE`: Abilita/disabilita autenticazione base (true/false)
- `N8N_BASIC_AUTH_USER`: Username per l'autenticazione
- `N8N_BASIC_AUTH_PASSWORD`: Password per l'autenticazione
- `N8N_HOST`: Hostname dove n8n è accessibile
- `N8N_PORT`: Porta interna (default: 5678)
- `N8N_PROTOCOL`: Protocollo (http/https)
- `WEBHOOK_URL`: URL base per i webhook
- `GENERIC_TIMEZONE`: Timezone (default: Europe/Rome)
- `TZ`: Timezone del sistema

Per maggiori informazioni, consulta la [documentazione ufficiale di n8n](https://docs.n8n.io/hosting/installation/docker/).

## Troubleshooting

### Il container non si avvia
Controlla i log:
```bash
docker-compose logs n8n
```

### Porta già in uso
Se la porta 5678 è già in uso, cambiala nel `docker-compose.yml`.

### Problemi di permessi
Se hai problemi con i permessi dei file, assicurati che Docker abbia i permessi necessari per creare i volumi.

