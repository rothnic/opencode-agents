export function validateSyntax(code: string, language = 'javascript'): boolean {
  if (!code.trim()) {
    return false;
  }

  if (language === 'javascript' || language === 'typescript') {
    const bracesBalanced = matches(code, /{/g) === matches(code, /}/g);
    const parensBalanced = matches(code, /\(/g) === matches(code, /\)/g);
    const bracketsBalanced = matches(code, /\[/g) === matches(code, /\]/g);
    return bracesBalanced && parensBalanced && bracketsBalanced;
  }

  return true;
}

function matches(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length;
}
