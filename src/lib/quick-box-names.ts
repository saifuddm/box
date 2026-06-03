const adjectives = [
  "brave",
  "bright",
  "calm",
  "clever",
  "cozy",
  "curious",
  "gentle",
  "golden",
  "happy",
  "kind",
  "lucky",
  "merry",
  "nimble",
  "quiet",
  "rapid",
  "steady",
  "sunny",
  "tidy",
  "vivid",
  "wise",
] as const;

const nouns = [
  "anchor",
  "bridge",
  "cabin",
  "cloud",
  "comet",
  "forest",
  "harbor",
  "lantern",
  "meadow",
  "moon",
  "planet",
  "river",
  "rocket",
  "shell",
  "signal",
  "sparrow",
  "stone",
  "trail",
  "wave",
  "window",
] as const;

const objects = [
  "basket",
  "button",
  "circle",
  "garden",
  "island",
  "key",
  "map",
  "note",
  "paper",
  "pencil",
  "pocket",
  "ribbon",
  "sail",
  "seed",
  "spark",
  "ticket",
  "tower",
  "vessel",
  "wheel",
  "whistle",
] as const;

function randomItem<T>(items: readonly T[]) {
  const randomValue = new Uint32Array(1);
  crypto.getRandomValues(randomValue);

  return items[randomValue[0] % items.length];
}

function generateBoxName() {
  return `${randomItem(adjectives)}-${randomItem(nouns)}-${randomItem(objects)}`;
}

function generatePassword() {
  const randomValue = new Uint32Array(1);
  crypto.getRandomValues(randomValue);

  const suffix = String(randomValue[0] % 10000).padStart(4, "0");
  return `${randomItem(adjectives)}-${randomItem(nouns)}-${randomItem(objects)}-${suffix}`;
}

function buildPasswordContent(password: string) {
  return `Box password: ${password}`;
}

export { buildPasswordContent, generateBoxName, generatePassword };
