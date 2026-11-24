export interface NbReponsePair {
  avant: number;
  apres: number;
}

export const ecartList: Map<number, NbReponsePair> = new Map([
  [1, { avant: 0, apres: 8 }],
  [2, { avant: 0, apres: 7 }],
  [3, { avant: 1, apres: 6 }],
  [4, { avant: 2, apres: 5 }],
  [5, { avant: 3, apres: 4 }],
  [6, { avant: 4, apres: 3 }],
  [7, { avant: 5, apres: 2 }],
  [8, { avant: 6, apres: 1 }],
  [9, { avant: 7, apres: 0 }],
  [10, { avant: 8, apres: 0 }],
]);
