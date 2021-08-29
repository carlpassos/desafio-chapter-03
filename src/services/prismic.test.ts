import * as prismic from "./prismic"
// @ponicode
describe("prismic.getPrismicClient", () => {
    test("0", () => {
        let callFunction: any = () => {
            prismic.getPrismicClient(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})
