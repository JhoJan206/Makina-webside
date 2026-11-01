import cookieParser from 'cookie-parser';
import express from 'express';
import './config/env.js';
import { manejarErrores } from './middleware/errores.js';
import api from './routes/index.js';

// App de Express sin listen(): la usan index.js (local / npm start)
// y api/index.js (Vercel Functions).
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Cuerpo de las peticiones (JSON / formularios)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// La API nunca se cachea
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use('/api', api);
app.use('/api', manejarErrores);

export default app;
