/** PLL・OLL のケース 1 件 */
export interface CaseEntry {
  /** ケース名（PLL `A1+`、OLL `1A` など）。種類の中で重ならない */
  readonly name: string;
  /** グループ名（PLL `A`〜`Z`、OLL `1`〜`53`・`1C` など） */
  readonly group: string;
  /** そのケースを揃える手順（`{ case: alg }` でケースの画像になる） */
  readonly alg: string;
  /** 揃った状態からそのケースになる手順（`{ alg: setup }` でケースの画像になる） */
  readonly setup: string;
}
