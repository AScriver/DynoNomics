export class BidirectionalEnum {
    static {
        for (const [key, val] of Object.entries(this)) {
            if (typeof val === 'number') {
                this[val] = key;
            }
        }
        Object.freeze(this);
    }
}

export default BidirectionalEnum;