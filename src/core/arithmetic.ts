type Token =
  | { type: 'number'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' };

function factorial(n: number): number {
  const floored = Math.floor(n);
  if (!Number.isFinite(floored) || floored < 0) return NaN;
  if (floored > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= floored; i++) {
    result *= i;
  }
  return result;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/\d|\./.test(ch)) {
      let numStr = '';
      while (i < input.length && /[\d.]/.test(input[i])) {
        numStr += input[i++];
      }
      if ((input[i] === 'e' || input[i] === 'E') && i + 1 < input.length) {
        const next = input[i + 1];
        if (/\d/.test(next) || ((next === '+' || next === '-') && /\d/.test(input[i + 2] ?? ''))) {
          numStr += input[i++];
          if (input[i] === '+' || input[i] === '-') numStr += input[i++];
          while (i < input.length && /\d/.test(input[i])) {
            numStr += input[i++];
          }
        }
      }
      const val = Number(numStr);
      if (!Number.isFinite(val)) throw new Error(`Invalid number "${numStr}"`);
      tokens.push({ type: 'number', value: val });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i++];
      }
      tokens.push({ type: 'ident', value: ident.toLowerCase() });
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    if ('+-*/^!'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character "${ch}"`);
  }

  return tokens;
}

export function evaluateArithmetic(rawExpression: string, xValue = 0): number {
  const trimmed = rawExpression.trim();
  if (!trimmed) throw new Error('Empty input');

  const tokens = tokenize(trimmed);
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];
  const consume = (): Token => tokens[pos++];

  function parseExpression(): number {
    let left = parseTerm();
    while (true) {
      const t = peek();
      if (t?.type === 'op' && (t.value === '+' || t.value === '-')) {
        consume();
        const right = parseTerm();
        left = t.value === '+' ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  function parseTerm(): number {
    let left = parsePower();
    while (true) {
      const t = peek();
      if (t?.type === 'op' && (t.value === '*' || t.value === '/')) {
        consume();
        const right = parsePower();
        left = t.value === '*' ? left * right : left / right;
      } else {
        break;
      }
    }
    return left;
  }

  function parsePower(): number {
    const base = parseUnary();
    const t = peek();
    if (t?.type === 'op' && t.value === '^') {
      consume();
      const exp = parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    const t = peek();
    if (t?.type === 'op' && (t.value === '+' || t.value === '-')) {
      consume();
      const val = parseUnary();
      return t.value === '-' ? -val : val;
    }
    return parsePostfix();
  }

  function parsePostfix(): number {
    let val = parsePrimary();
    while (true) {
      const t = peek();
      if (t?.type === 'op' && t.value === '!') {
        consume();
        val = factorial(val);
      } else {
        break;
      }
    }
    return val;
  }

  function parsePrimary(): number {
    const t = peek();
    if (!t) throw new Error('Unexpected end of expression');

    if (t.type === 'number') {
      consume();
      return t.value;
    }

    if (t.type === 'ident') {
      consume();
      if (peek()?.type === 'lparen') {
        consume();
        const arg = parseExpression();
        if (peek()?.type !== 'rparen') throw new Error('Missing closing parenthesis');
        consume();
        switch (t.value) {
          case 'sqrt': return Math.sqrt(arg);
          case 'log': return Math.log(arg);
          case 'log10': return Math.log10(arg);
          case 'sin': return Math.sin(arg);
          case 'cos': return Math.cos(arg);
          case 'tan': return Math.tan(arg);
          case 'abs': return Math.abs(arg);
          default: throw new Error(`Unknown function "${t.value}"`);
        }
      }

      if (t.value === 'x') return xValue;
      if (t.value === 'pi') return Math.PI;
      if (t.value === 'e') return Math.E;
      throw new Error(`Unknown identifier "${t.value}"`);
    }

    if (t.type === 'lparen') {
      consume();
      const val = parseExpression();
      if (peek()?.type !== 'rparen') throw new Error('Missing closing parenthesis');
      consume();
      return val;
    }

    throw new Error('Invalid syntax');
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new Error('Unexpected trailing input');
  }
  return result;
}

export function convertTimeToUnit(seconds: number, unitKey: string, unitSeconds: number): string {
  if (!Number.isFinite(seconds) || unitSeconds <= 0) return 'Invalid time';
  const valueInTarget = seconds / unitSeconds;
  if (!Number.isFinite(valueInTarget)) return String(valueInTarget);

  if (Math.abs(Math.round(valueInTarget) - valueInTarget) < 1e-12 && Math.abs(valueInTarget) < 1_000_000) {
    return `${Math.round(valueInTarget)} ${unitKey}`;
  }
  if (Math.abs(valueInTarget) >= 1000) {
    return `${valueInTarget} ${unitKey}`;
  }
  return `${(+valueInTarget.toFixed(3)).toString().replace(/\.?0+$/, '')} ${unitKey}`;
}
