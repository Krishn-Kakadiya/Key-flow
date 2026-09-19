export type CodeLang = 'js' | 'python' | 'css' | 'sql';

export interface Snippet {
  lang: CodeLang;
  code: string;
}

export const LANG_LABEL: Record<CodeLang, string> = {
  js: 'JavaScript',
  python: 'Python',
  css: 'CSS',
  sql: 'SQL',
};

/** Original snippets. Leading indentation is auto-filled by the engine. */
export const SNIPPETS: Snippet[] = [
  {
    lang: 'js',
    code: `function sum(numbers) {
  let total = 0;
  for (const n of numbers) {
    total += n;
  }
  return total;
}`,
  },
  {
    lang: 'js',
    code: `const users = data.filter((u) => u.active);
const names = users.map((u) => u.name.trim());
console.log(names.join(", "));`,
  },
  {
    lang: 'js',
    code: `async function load(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Request failed: " + res.status);
  }
  return res.json();
}`,
  },
  {
    lang: 'js',
    code: `const counter = { count: 0 };
function increment() {
  counter.count += 1;
  return counter.count;
}`,
  },
  {
    lang: 'python',
    code: `def average(values):
    if not values:
        return 0
    return sum(values) / len(values)`,
  },
  {
    lang: 'python',
    code: `words = ["apple", "banana", "cherry"]
lengths = {w: len(w) for w in words}
for word, size in lengths.items():
    print(f"{word}: {size}")`,
  },
  {
    lang: 'python',
    code: `class Counter:
    def __init__(self):
        self.count = 0

    def add(self, n=1):
        self.count += n
        return self.count`,
  },
  {
    lang: 'css',
    code: `.card {
  display: grid;
  gap: 16px;
  padding: 24px;
  border-radius: 12px;
  background: #1a1d24;
}`,
  },
  {
    lang: 'sql',
    code: `SELECT name, COUNT(*) AS total
FROM orders
WHERE status = 'paid'
GROUP BY name
ORDER BY total DESC
LIMIT 10;`,
  },
];
