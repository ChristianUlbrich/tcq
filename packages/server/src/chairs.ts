let chairs = new Set<Number>(process.env.chairs?.split(',').map(Number) ?? []);

export function isChair(userid: number) {
  return chairs.has(userid);
}
