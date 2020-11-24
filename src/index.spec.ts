import { ParIter } from "./index";
import { expect } from "chai";
import "mocha";

function delay(x: number): Promise<number> {
    return new Promise(resolve => {
        setTimeout(() => resolve(x), x * 10);
    });
}

function *range(end: number): Generator<number, void, void> {
    for(let i = 0; i < end; i++){
        yield i;
    }
}

describe("works", function() {
    it("should return items in order when delayed", async function(){
        this.slow(70*2);

        //this test should take 30 + 60ms max

        let startingArray = [1,2,3,4,5,6];
        let items = new ParIter(3, startingArray.map(delay));
        let k = await items.collect();
        expect(k).to.eql(startingArray);
    });

    it("should return in random order when large set", async function(){
        let largeRange = [...range(1000)];
        let items = new ParIter(10, largeRange);
        let k = await items.collect();
        expect(k.sort()).to.eql(largeRange.sort());
    });


    it("should accept generators", async function(){
        let largeRange = range(100);
        let items = new ParIter(10, largeRange);
        let k = await items.collect();
        expect(k.sort()).to.eql([...range(100)].sort());
    });
});
