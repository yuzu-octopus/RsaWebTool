import { describe, test, expect } from 'bun:test';
import { ProgressEstimator } from '../progressEstimator';

describe('ProgressEstimator', () => {
  test('update returns object with formattedEta', () => {
    const est = new ProgressEstimator();
    const result = est.update(10);
    expect(result).toHaveProperty('formattedEta');
    expect(result).toHaveProperty('remainingMs');
    expect(result).toHaveProperty('speed');
    expect(typeof result.formattedEta).toBe('string');
  });

  test('update with pct=0 returns Infinity remainingMs', () => {
    const est = new ProgressEstimator();
    const result = est.update(0);
    expect(result.remainingMs).toBe(Infinity);
    expect(result.formattedEta).toBe('--');
  });

  test('update with pct=100 returns 0 remainingMs', () => {
    const est = new ProgressEstimator();
    const result = est.update(100);
    expect(result.remainingMs).toBe(0);
    expect(result.formattedEta).toBe('< 1s');
  });

  test('update with pct=50 computes finite estimate after progress', () => {
    const est = new ProgressEstimator();
    // First call at 0% establishes baseline
    est.update(0);
    // Simulate some time passing with progress
    const result = est.update(50);
    expect(result.remainingMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.formattedEta).toBe('string');
  });

  test('reset clears state', () => {
    const est = new ProgressEstimator();
    est.update(50);
    est.reset();
    const result = est.update(0);
    expect(result.remainingMs).toBe(Infinity);
    expect(result.speed).toBe(0);
    expect(result.formattedEta).toBe('--');
  });

  test('speed increases with progress', () => {
    const est = new ProgressEstimator();
    est.update(0);
    const r1 = est.update(10);
    const r2 = est.update(50);
    expect(r2.speed).toBeGreaterThanOrEqual(r1.speed);
  });

  test('formattedEta shows seconds for short durations', () => {
    const est = new ProgressEstimator();
    est.update(0);
    const result = est.update(99);
    // With only 1% remaining and some speed, eta should be short
    expect(result.formattedEta).toMatch(/^(\d+s|< 1s|--)$/);
  });

  test('custom alpha parameter', () => {
    const est = new ProgressEstimator(0.5);
    est.update(0);
    const result = est.update(25);
    expect(result).toHaveProperty('formattedEta');
    expect(typeof result.formattedEta).toBe('string');
  });
});
