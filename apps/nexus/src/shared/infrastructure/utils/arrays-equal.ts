const arraysEqual = <T>(a: T[], b: T[], equals: (x: T, y: T) => boolean) =>
  a.length === b.length && a.every((v, i) => equals(v, b[i]));
