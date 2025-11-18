import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, NotFoundError, ConflictError } from './errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with status code and message', () => {
      const error = new AppError(500, 'Something went wrong');

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Something went wrong');
      expect(error.name).toBe('AppError');
    });

    it('should include details when provided', () => {
      const details = { field: 'email', issue: 'invalid format' };
      const error = new AppError(400, 'Validation failed', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with 400 status code', () => {
      const error = new ValidationError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with 404 status code', () => {
      const error = new NotFoundError('User');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError with 409 status code', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
      expect(error.name).toBe('ConflictError');
    });
  });
});
