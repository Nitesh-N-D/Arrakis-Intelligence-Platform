import { ranks } from "../dune/ranks.js";

export class RankEngine {
  determineRank(totalSpice) {
    return [...ranks].reverse().find((rank) => totalSpice >= rank.minSpice)?.name || ranks[0].name;
  }
}
