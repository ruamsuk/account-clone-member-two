import { Application } from 'express';
import { all, create, get, patch, remove } from './controller';
import { isAuthenticated } from '../auth/authenticated';
import { isAuthorized } from '../auth/authorized';

/**
 *
 * @param app
 */
export function routesConfig(app: Application) {
  /** Create user */
  app.post(
    '/users',
    isAuthenticated,
    isAuthorized({hasRole: ['admin', 'manager']}),
    create,
  );

  /** lists all users */
  app.get('/users', [
    isAuthenticated,
    isAuthorized({hasRole: ['admin', 'manager', 'user']}),
    all,
  ]);

  /** one user */
  app.get('/users/:id', [
    isAuthenticated,
    isAuthorized({hasRole: ['admin', 'manager', 'user']}),
    get,
  ]);

  /** updates :id user */
  app.patch('/users/:id', [
    isAuthenticated,
    isAuthorized({hasRole: ['admin', 'manager']}),
    patch,
  ]);

  /** deletes :id user */
  app.delete('/users/:id', [
    isAuthenticated,
    isAuthorized({hasRole: ['admin', 'manager']}),
    remove,
  ]);
}
