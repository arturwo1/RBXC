import { describe, expect, it } from 'vitest';
import { convertTimeToUnit, evaluateArithmetic } from '../arithmetic';

describe('arithmetic & converter core', () => {
  it('evaluates expressions with precedence, functions, factorial, and power', () => {
    expect(evaluateArithmetic('2+2*2/4-1')).toBe(2);
    expect(evaluateArithmetic('(2+3)*4')).toBe(20);
    expect(evaluateArithmetic('2^3')).toBe(8);
    expect(evaluateArithmetic('5!')).toBe(120);
    expect(evaluateArithmetic('sqrt(16) + log10(100)')).toBe(6);
    expect(evaluateArithmetic('sin(0) + cos(0)')).toBe(1);
    expect(evaluateArithmetic('x + 5', 0)).toBe(5);
  });

  it('rejects invalid expressions safely', () => {
    expect(() => evaluateArithmetic('')).toThrow();
    expect(() => evaluateArithmetic('alert(1)')).toThrow();
  });

  it('converts time to target units', () => {
    expect(convertTimeToUnit(5400, 'h', 3600)).toBe('1.5 h');
    expect(convertTimeToUnit(86400, 'd', 86400)).toBe('1 d');
  });
});
