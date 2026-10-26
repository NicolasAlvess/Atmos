// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { db } from './firebase'; // Importamos a nossa ligação à base de dados

const app = express();
// O Render utiliza uma porta dinâmica que vem em process.env.PORT. Se não existir, usa a 3000 localmente.
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/status', (req, res) => {
  res.json({ message: 'Servidor da Pesquisa Organizacional está a correr!' });
});

// Rota para receber e gravar o questionário
app.post('/api/survey', async (req, res) => {
  try {
    const formData = req.body;
    
    // Adicionamos a data e hora em que a pesquisa foi respondida
    const dataParaGravar = {
      ...formData,
      timestamp: new Date().toISOString()
    };
    
    // Gravamos na coleção 'survey_responses' no Firestore
    const docRef = await db.collection('survey_responses').add(dataParaGravar);
    
    console.log('Nova resposta guardada com ID:', docRef.id);
    
    // Devolvemos uma resposta de sucesso ao frontend
    res.status(201).json({ 
      message: 'Dados guardados com sucesso', 
      id: docRef.id 
    });
    
  } catch (error) {
    console.error('Erro ao guardar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao guardar os dados' });
  }
});

// Rota para o BI buscar todas as respostas para o Dashboard
app.get('/api/admin/responses', async (req, res) => {
  try {
    const snapshot = await db.collection('survey_responses').get();
    
    // Mapeia os documentos do Firestore para um array de objetos
    const responses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(responses);
  } catch (error) {
    console.error('Erro ao buscar dados no Firebase:', error);
    res.status(500).json({ error: 'Erro interno ao buscar os dados' });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});