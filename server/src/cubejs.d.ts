/**
 * Hand-written type declarations for the `cubejs` package (ships without
 * TypeScript types): cube model, facelet parsing and Kociemba solver.
 */

declare module 'cubejs' {
  class Cube {
    constructor();
    static initSolver(): void;
    static fromString(facelets: string): Cube;
    static random(): Cube;
    move(algorithm: string): Cube;
    randomize(): void;
    asString(): string;
    solve(maxDepth?: number): string;
    isSolved(): boolean;
  }
  export default Cube;
}
