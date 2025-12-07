import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import conversationRoutes from './routes/conversations';
import supervisorRoutes from './routes/supervisor';
import logRoutes from './routes/logs';
import webhookRoutes from './routes/webhooks';
import messageRoutes from './routes/messages';
import whatsappNumbersRoutes from './routes/whatsapp-numbers';
import eventsRoutes from './routes/events';
import botRoutes from './routes/bot';
import { setupSwagger } from './config/swagger';

// Carregar .env (apenas se o arquivo existir)
// No Docker/produção, as variáveis de ambiente são passadas diretamente via sistema
// Tentar múltiplos caminhos possíveis
const envPaths = [
  path.resolve(__dirname, '../.env'),           // backend/.env
  path.resolve(__dirname, '../../.env'),        // raiz/.env
  path.resolve(process.cwd(), '.env'),          // diretório atual/.env
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      envLoaded = true;
      console.log(`✅ Arquivo .env carregado de: ${envPath}`);
      break;
    }
  } catch (error) {
    // Continuar tentando outros caminhos
  }
}

if (!envLoaded) {
  console.log('ℹ️  Arquivo .env não encontrado, usando variáveis de ambiente do sistema');
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// Configuração de CORS mais flexível
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: Postman, mobile apps, curl, webhooks)
    if (!origin) {
      return callback(null, true);
    }
    
    // Permitir webhooks da Z-API (server-to-server, não precisa de CORS restritivo)
    if (origin === 'https://api.z-api.io' || origin.includes('z-api.io')) {
      console.log(`✅ CORS permitido (Z-API webhook): ${origin}`);
      return callback(null, true);
    }
    
    // Em desenvolvimento ou se não for produção, permitir localhost/127.0.0.1 em qualquer porta
    const isDevelopment = process.env.NODE_ENV !== 'production' || !process.env.NODE_ENV;
    
    if (isDevelopment) {
      // Permitir qualquer localhost ou 127.0.0.1
      if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
        console.log(`✅ CORS permitido (dev): ${origin}`);
        return callback(null, true);
      }
    }
    
    // Verificar se a origin está na lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS permitido (lista): ${origin}`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS bloqueado para origin: ${origin}`);
      console.warn(`   Origens permitidas: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Instance-Id'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));

// Middleware para log de TODAS as requisições (antes do parsing do body)
app.use((req, res, next) => {
  // Log TODAS as requisições que chegam
  console.log('🌐 Requisição recebida:', req.method, req.path, req.url);
  if (req.path.includes('webhook') || req.url.includes('webhook')) {
    console.log('🔔 ========== REQUISIÇÃO WEBHOOK DETECTADA ==========');
    console.log('📍 Path:', req.path);
    console.log('📍 URL:', req.url);
    console.log('🔧 Method:', req.method);
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para log após parsing do body
app.use((req, res, next) => {
  if (req.path.includes('/webhook')) {
    console.log('📦 Body após parsing:', JSON.stringify(req.body, null, 2));
    console.log('📦 Body type:', typeof req.body);
    console.log('📦 Body keys:', req.body ? Object.keys(req.body) : 'vazio');
  }
  next();
});

// Request logging
app.use(logger);

// Swagger documentation
setupSwagger(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
console.log('📋 Registrando rotas...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/whatsapp/numbers', whatsappNumbersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/bot', botRoutes);
app.use('/webhook', webhookRoutes);
// Rota alternativa para webhook Z-API (caso venha direto em /zapi)
app.use('/', webhookRoutes);
console.log('✅ Rota /webhook registrada');
console.log('✅ Rota alternativa /zapi registrada');

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

