import { BidirectionalEnum } from './BidirectionalEnum.js';

/**
 * @file A class-based "enum" for trading recommendation actions with
 *       bidirectional lookup:
 *         RecommendationEnum.BUY -> 1
 *         RecommendationEnum[1] -> 'BUY'
 */
export class RecommendationEnum extends BidirectionalEnum {
    static BUY = 1;
    static SELL = 2;
    static HOLD = 3;
}

export default RecommendationEnum;