// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { db } from './firebase';

const app = express();
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
    
    const dataParaGravar = {
      ...formData,
      timestamp: new Date().toISOString()
    };
    
    const docRef = await db.collection('survey_responses').add(dataParaGravar);
    
    console.log('Nova resposta guardada com ID:', docRef.id);
    
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
    
    // Tipagem explícita no parâmetro doc para eliminar o erro do TS
    const responses = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
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