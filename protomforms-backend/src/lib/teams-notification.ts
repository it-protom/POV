import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

interface TeamsNotificationOptions {
  title: string;
  text: string;
  themeColor?: string;
  potentialAction?: {
    name: string;
    target: string;
  }[];
}

/**
 * Invia una notifica a Microsoft Teams
 * @param options Opzioni per la notifica
 * @returns Promise con il risultato dell'invio
 */
export async function sendTeamsNotification(options: TeamsNotificationOptions): Promise<boolean> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 secondo

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // URL del webhook di Teams (da configurare nell'ambiente)
      const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.error('Webhook URL non configurato');
        return false;
      }

      console.log(`Tentativo ${attempt}/${MAX_RETRIES} - Invio notifica Teams a:`, webhookUrl);

      // Prepara il payload della notifica usando Adaptive Cards
      const payload = {
        "type": "message",
        "attachments": [
          {
            "contentType": "application/vnd.microsoft.card.adaptive",
            "contentUrl": null,
            "content": {
              "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
              "type": "AdaptiveCard",
              "version": "1.2",
              "themeColor": options.themeColor || "0076D7",
              "body": [
                {
                  "type": "TextBlock",
                  "size": "Large",
                  "weight": "Bolder",
                  "text": options.title
                },
                {
                  "type": "TextBlock",
                  "text": options.text,
                  "wrap": true
                },
                {
                  "type": "TextBlock",
                  "isSubtle": true,
                  "text": new Date().toLocaleString('it-IT'),
                  "spacing": "Small"
                }
              ],
              "actions": options.potentialAction ? options.potentialAction.map(action => ({
                "type": "Action.OpenUrl",
                "title": action.name,
                "url": action.target
              })) : []
            }
          }
        ]
      };

      // Invia la notifica tramite webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Errore nell'invio della notifica a Teams (tentativo ${attempt}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        if (attempt < MAX_RETRIES) {
          console.log(`Riprovo tra ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }

        return false;
      }

      console.log('Notifica Teams inviata con successo');
      return true;
    } catch (error) {
      console.error(`Errore nell'invio della notifica a Teams (tentativo ${attempt}):`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Riprovo tra ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }

      return false;
    }
  }

  return false;
}

/**
 * Invia una notifica per un nuovo form creato
 * @param formId ID del form creato
 * @param formTitle Titolo del form
 * @param createdBy Nome dell'utente che ha creato il form
 * @returns Promise con il risultato dell'invio
 */
export async function notifyNewFormCreated(
  formId: string, 
  formTitle: string, 
  createdBy: string
): Promise<boolean> {
  // Usa FRONTEND_URL per il link al form pubblico (non admin)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  // Link diretto al form pubblico, non alla pagina admin
  const formUrl = `${frontendUrl}/forms/${formId}`;
  
  console.log('Invio notifica per nuovo form:', {
    formId,
    formTitle,
    createdBy,
    formUrl
  });
  
  return sendTeamsNotification({
    title: 'Nuovo Form Creato',
    text: `${createdBy} ha creato un nuovo form: ${formTitle}`,
    themeColor: 'FFD700', // Colore giallo Protom
    potentialAction: [
      {
        name: 'Compila Form',
        target: formUrl
      }
    ]
  });
}


