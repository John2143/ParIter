export class ParIter<T> {
    concurrencyLimit: Number;
    iter: Iterable<Promise<T> | T>;

    constructor(concurrencyLimit: Number, iter: Iterable<Promise<T> | T>){
        this.concurrencyLimit = concurrencyLimit;
        this.iter = iter;
    }

    async _indexProm(i: number, prom: Promise<T> | T): Promise<[number, T]> {
        return [i, await prom];

    }

    async *generator(): AsyncGenerator<T, void, void> {
        let iterable = this.iter[Symbol.iterator]();
        let currentPromises: Array<Promise<[number, T]> | null> = [];
        for(let i = 0; i < this.concurrencyLimit; i++){
            let {done, value} = iterable.next();
            if(done) {
                break;
            }
            currentPromises.push(this._indexProm(i, value));
        }

        let iterableComplete = false;

        for(;;){
            let x = await Promise.race(currentPromises.filter(x => x!));
            if(!x) return; //this should never happen

            let [index, val] = x;
            let nextIterValue = null;
            if(!iterableComplete) {
                let nextIter = iterable.next();
                if(!nextIter.done){
                    iterableComplete = nextIter.done || false;
                    nextIterValue = this._indexProm(index, nextIter.value);
                }
            }

            yield val;

            currentPromises[index] = nextIterValue;
            if(currentPromises.filter(x => x).length === 0){
                return;
            }
        }
    }

    async collect(): Promise<T[]> {
        let items: T[] = [];
        for await (let item of this.generator()){
            items.push(item);
        }

        return items;
    }
}
