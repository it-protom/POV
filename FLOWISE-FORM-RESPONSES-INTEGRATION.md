# 🔄 Integrazione Flowise con Risposte Form - Guida Completa

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Struttura del Sistema](#struttura-del-sistema)
3. [Come Funziona](#come-funziona)
4. [Configurazione Agentflow](#configurazione-agentflow)
5. [Variabili Disponibili](#variabili-disponibili)
6. [Esempi d'Uso](#esempi-duso)
7. [API Endpoint](#api-endpoint)

---

## 🎯 Panoramica

Questo sistema permette di analizzare le risposte dei form ProtomForms usando Flowise Agentflow, seguendo lo stesso pattern usato in AGO Explorer.

### Flusso Completo

```
1. Frontend chiama /api/forms/[id]/analyze-responses
   ↓
2. Backend recupera tutte le risposte del form
   ↓
3. Backend prepara variabili per Flowise
   ↓
4. Backend chiama Flowise Agentflow con overrideConfig.vars
   ↓
5. Agentflow analizza le risposte usando le variabili
   ↓
6. Flowise restituisce risultato analisi
   ↓
7. Backend restituisce risultato al frontend
```

---

## 🏗️ Struttura del Sistema

### File Creati

1. **`protomforms-backend/src/lib/flowiseService.ts`**
   - Servizio per chiamare Flowise API
   - Funzioni per preparare variabili
   - Gestione errori e logging

2. **`protomforms-backend/src/app/api/forms/[id]/analyze-responses/route.ts`**
   - Endpoint API per analizzare risposte
   - Recupera risposte dal database
   - Chiama Flowise e restituisce risultati

### Variabili d'Ambiente

Aggiungi al file `.env` del backend:

```env
# Flowise Configuration
FLOWISE_API_URL=http://127.0.0.1:4005
# Oppure in produzione:
# FLOWISE_API_URL=https://pov.protom.com/protomforms-flowise/api/v1
```

---

## 🔄 Come Funziona

### 1. Chiamata API

**Endpoint:** `POST /api/forms/[id]/analyze-responses`

**Headers:**
```
Content-Type: application/json
x-user-id: <USER_ID>  (o session cookie)
```

**Body:**
```json
{
  "agentflowId": "9a96c980-b7a2-48af-ae0b-5b17b8daa9bb",
  "question": "Analizza tutte le risposte e determina il sentiment"
}
```

### 2. Backend Processa la Richiesta

Il backend:
1. Verifica autenticazione e permessi (ADMIN o owner del form)
2. Recupera il form con tutte le domande
3. Recupera tutte le risposte con le relative risposte testuali
4. Prepara le variabili usando `prepareFormResponsesVars()`
5. Chiama Flowise con `callFlowisePrediction()`

### 3. Variabili Passate a Flowise

Le variabili vengono passate in `overrideConfig.vars`:

```typescript
overrideConfig: {
  vars: {
    formId: "clx123...",
    formTitle: "Soddisfazione Cliente",
    formDescription: "Form per valutare...",
    totalResponses: 10,
    textResponsesCount: 8,
    responsesContext: "Risposta 1: ...\nRisposta 2: ...",
    responsesData: "[{...}, {...}]",
    userId: "clx789..."
  }
}
```

---

## 🎨 Configurazione Agentflow

### Struttura Consigliata

```
[Start Node]
  ↓
[HTTP Request: Recupera risposte] (opzionale, già fatto dal backend)
  ↓
[Code Node: Processa variabili]
  ↓
[For Each: Per ogni risposta testuale]
  ↓
[LLM Chain: Analisi sentiment]
  ↓
[Code Node: Parse JSON]
  ↓
[Aggregate: Calcola statistiche]
  ↓
[Output Node]
```

### Nodo 1: Start Node

**Input Variables:**
- `formId` (da `$vars.formId`)
- `formTitle` (da `$vars.formTitle`)
- `responsesContext` (da `$vars.responsesContext`)
- `responsesData` (da `$vars.responsesData`)

### Nodo 2: Code Node - Processa Variabili

```javascript
// Estrai le risposte dal contesto o da responsesData
const responsesData = JSON.parse($vars.responsesData || '[]');
const responsesContext = $vars.responsesContext || '';

// Prepara per l'analisi
const textAnswers = responsesData.map(item => ({
  question: item.question,
  answer: item.answer,
  responseId: item.responseId,
  progressiveNumber: item.progressiveNumber
}));

return {
  formTitle: $vars.formTitle,
  totalResponses: $vars.totalResponses,
  textAnswers: textAnswers,
  responsesContext: responsesContext
};
```

### Nodo 3: For Each - Itera Risposte

**Input:** Array di risposte testuali dal nodo precedente

### Nodo 4: LLM Chain - Analisi Sentiment

**Prompt:**
```
Analizza il sentiment della seguente risposta a un form.

Form: {{ $vars.formTitle }}

Risposta da analizzare:
Domanda: {{ $input.question }}
Risposta: {{ $input.answer }}

Determina:
1. Sentiment: positive, negative, o neutral
2. Score: 0-100 (dove 100 = molto positivo, 0 = molto negativo)
3. Confidence: 0-1
4. Keywords: parole chiave che indicano il sentiment
5. Reasoning: breve spiegazione in italiano

Rispondi SOLO con JSON valido (nessun altro testo):
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": 0-100,
  "confidence": 0.0-1.0,
  "keywords": ["parola1", "parola2"],
  "reasoning": "spiegazione breve"
}
```

**Model Settings:**
- Temperature: 0.1-0.3 (più deterministico)
- Max Tokens: 500
- Output Format: JSON (se supportato)

### Nodo 5: Code Node - Parse JSON

```javascript
const llmResponse = $input.text || $input;
const answerData = $prevAnswerData; // Dal nodo For Each

try {
  // Estrai JSON dalla risposta LLM
  const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
  const sentiment = jsonMatch ? JSON.parse(jsonMatch[0]) : {
    sentiment: "neutral",
    score: 50,
    confidence: 0.5,
    keywords: [],
    reasoning: "Impossibile analizzare"
  };
  
  return {
    ...answerData,
    sentiment: sentiment.sentiment,
    score: sentiment.score,
    confidence: sentiment.confidence,
    keywords: sentiment.keywords,
    reasoning: sentiment.reasoning
  };
} catch (e) {
  return {
    ...answerData,
    sentiment: "neutral",
    score: 50,
    error: "Errore parsing"
  };
}
```

### Nodo 6: Aggregate - Calcola Statistiche

```javascript
const results = $input; // Array di risultati analizzati

const summary = {
  total: results.length,
  positive: results.filter(r => r.sentiment === 'positive').length,
  negative: results.filter(r => r.sentiment === 'negative').length,
  neutral: results.filter(r => r.sentiment === 'neutral').length,
  averageScore: results.reduce((sum, r) => sum + (r.score || 50), 0) / results.length,
  averageConfidence: results.reduce((sum, r) => sum + (r.confidence || 0.5), 0) / results.length,
  details: results,
  formTitle: $vars.formTitle,
  formId: $vars.formId
};

return summary;
```

### Nodo 7: Output Node

Restituisce il summary completo.

---

## 📊 Variabili Disponibili

### Variabili Globali (`$vars`)

Queste variabili sono accessibili in tutti i nodi dell'Agentflow:

| Variabile | Tipo | Descrizione |
|-----------|------|-------------|
| `formId` | string | ID del form |
| `formTitle` | string | Titolo del form |
| `formDescription` | string | Descrizione del form |
| `totalResponses` | number | Numero totale di risposte |
| `textResponsesCount` | number | Numero di risposte testuali |
| `responsesContext` | string | Testo formattato con tutte le risposte |
| `responsesData` | string | JSON stringificato con array di risposte |
| `userId` | string \| null | ID utente che richiede l'analisi |

### Struttura `responsesData`

```json
[
  {
    "responseId": "clx123...",
    "progressiveNumber": 1,
    "question": "Come valuti il servizio?",
    "answer": "Eccellente, molto soddisfatto!",
    "createdAt": "2025-11-09T00:00:00.000Z"
  },
  {
    "responseId": "clx456...",
    "progressiveNumber": 2,
    "question": "Hai suggerimenti?",
    "answer": "Potrebbe essere migliorato",
    "createdAt": "2025-11-09T01:00:00.000Z"
  }
]
```

### Struttura `responsesContext`

```
Risposta 1 (ID: clx123..., Progressivo: 1):
Domanda: Come valuti il servizio?
Risposta: Eccellente, molto soddisfatto!
Data: 2025-11-09T00:00:00.000Z
---

Risposta 2 (ID: clx456..., Progressivo: 2):
Domanda: Hai suggerimenti?
Risposta: Potrebbe essere migliorato
Data: 2025-11-09T01:00:00.000Z
---
```

---

## 💡 Esempi d'Uso

### Esempio 1: Analisi Sentiment Base

**Chiamata API:**
```typescript
const response = await fetch('/api/forms/clx123/analyze-responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'clx789'
  },
  body: JSON.stringify({
    agentflowId: '9a96c980-b7a2-48af-ae0b-5b17b8daa9bb',
    question: 'Analizza tutte le risposte e determina il sentiment generale'
  })
});

const result = await response.json();
console.log(result.analysis);
```

**Risposta Attesa:**
```json
{
  "success": true,
  "formId": "clx123",
  "formTitle": "Soddisfazione Cliente",
  "totalResponses": 10,
  "textResponsesCount": 8,
  "analysis": {
    "total": 8,
    "positive": 6,
    "negative": 1,
    "neutral": 1,
    "averageScore": 75.5,
    "averageConfidence": 0.85,
    "details": [
      {
        "question": "Come valuti il servizio?",
        "answer": "Eccellente!",
        "sentiment": "positive",
        "score": 90,
        "confidence": 0.9,
        "keywords": ["eccellente", "soddisfatto"],
        "reasoning": "Risposta molto positiva"
      }
    ]
  }
}
```

### Esempio 2: Analisi Avanzata con Categorizzazione

Puoi estendere l'Agentflow per:
- Categorizzare risposte per tema
- Identificare problemi ricorrenti
- Suggerire azioni correttive
- Generare report automatici

---

## 🔌 API Endpoint

### POST `/api/forms/[id]/analyze-responses`

Analizza le risposte di un form usando Flowise Agentflow.

**Autenticazione:** Richiesta (ADMIN o owner del form)

**Request Body:**
```json
{
  "agentflowId": "string (UUID)",
  "question": "string (opzionale)"
}
```

**Response:**
```json
{
  "success": true,
  "formId": "string",
  "formTitle": "string",
  "totalResponses": number,
  "textResponsesCount": number,
  "analysis": {
    // Risultato dell'analisi da Flowise
  },
  "flowiseResponse": {
    // Risposta completa da Flowise
  }
}
```

**Errori:**
- `401`: Non autorizzato
- `403`: Accesso negato (non sei ADMIN o owner)
- `404`: Form non trovato
- `400`: agentflowId mancante
- `500`: Errore server o Flowise

### GET `/api/forms/[id]/analyze-responses`

Restituisce informazioni sull'endpoint.

---

## 🎯 Prossimi Passi

1. **Crea l'Agentflow in Flowise** seguendo la struttura consigliata
2. **Testa l'endpoint** con un form che ha risposte
3. **Ottimizza il prompt** per migliorare l'accuratezza
4. **Aggiungi visualizzazioni** nel frontend per mostrare i risultati
5. **Implementa caching** per evitare analisi ripetute

---

## 📝 Note Importanti

1. **Performance**: L'analisi può richiedere tempo se ci sono molte risposte. Considera di processare in batch.

2. **Costi**: Ogni risposta analizzata usa token del LLM. Monitora i costi.

3. **Privacy**: Le risposte vengono inviate a Flowise. Assicurati che sia configurato correttamente.

4. **Error Handling**: L'endpoint gestisce errori gracefully e restituisce messaggi informativi.

5. **Variabili**: Tutte le variabili sono accessibili tramite `$vars.variableName` nei nodi Flowise.

---

## 🔗 File Chiave

- **Servizio Flowise**: `protomforms-backend/src/lib/flowiseService.ts`
- **Endpoint API**: `protomforms-backend/src/app/api/forms/[id]/analyze-responses/route.ts`
- **Configurazione**: Variabili d'ambiente `.env`

---

## 🆘 Troubleshooting

### Errore: "Flowise API error"
- Verifica che Flowise sia in esecuzione
- Controlla `FLOWISE_API_URL` nelle variabili d'ambiente
- Verifica che la porta 4005 sia accessibile

### Errore: "Impossibile parsare la risposta JSON"
- Il prompt LLM non sta restituendo JSON valido
- Aggiusta il prompt per forzare output JSON
- Usa "JSON mode" se supportato dal modello

### Nessuna risposta testuale
- Verifica che il form abbia domande di tipo TEXT
- Controlla che ci siano risposte inviate
- Verifica i permessi per vedere le risposte

