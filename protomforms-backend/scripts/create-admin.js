// Script per creare un utente admin
import fetch from 'node-fetch';

async function createAdmin() {
  try {
    const response = await fetch('http://localhost:3002/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@protom.com',
        password: 'Password123!',
      }),
    });

    const data = await response.json();
    console.log('Risposta:', data);
  } catch (error) {
    console.error('Errore:', error);
  }
}

createAdmin(); 