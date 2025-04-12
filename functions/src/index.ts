import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

import serviceAccount from './firebase-adminsdk.json';
import { routesConfig } from './users/routes-config';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: 'https://new-accounts-93b33.firebaseio.com',
});
const app = express();
const allowedOrigins = [
  'https://new-accounts-93b33.web.app',
  'https://new-accounts-93b33.firebaseapp.com',
  'https://iamruamsuk.net',
  'https://iamruamsuk.xyz',
  'http://localhost:4200',
];
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    if (allowedOrigins.indexOf(<string>origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(express.json());
app.use(cors(corsOptions));

routesConfig(app);

export const apiFunction = functions.https.onRequest(app);
