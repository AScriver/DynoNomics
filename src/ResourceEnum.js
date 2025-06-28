import { BidirectionalEnum } from './BidirectionalEnum.js';

/**
 * @file A class-based “enum” for resource symbols with
 *       bidirectional lookup:
 *         ResourceEnum.EARTH -> 1
 *         ResourceEnum[1] -> 'EARTH'
 */
export class ResourceEnum extends BidirectionalEnum {
    static EARTH = 1;
    static WATER = 2;
    static FIRE = 3;
    static MUD = 4;
    static CLAY = 5;
    static SAND = 6;
    static COPPER = 7;
    static SEAWATER = 8;
    static HEAT = 9;
    static ALGAE = 10;
    static LAVA = 11;
    static CERAMICS = 12;
    static STEEL = 13;
    static OXYGEN = 14;
    static GLASS = 15;
    static GAS = 16;
    static STONE = 17;
    static STEAM = 18;
    static SCREWS = 19;
    static FUEL = 20;
    static CEMENT = 21;
    static OIL = 22;
    static ACID = 23;
    static SULFUR = 24;
    static PLASTICS = 25;
    static FIBERGLASS = 26;
    static ENERGY = 27;
    static HYDROGEN = 28;
    static DYNAMITE = 29;
    static COIN = 30;
}

export default ResourceEnum;
