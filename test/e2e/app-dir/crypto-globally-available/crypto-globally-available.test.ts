import { createNextDescribe } from "e2e-utils";

createNextDescribe(
  "Web Crypto API is available globally",
  {
    files: __dirname,
  },
  ({ next }) => {
    // Recommended for tests that need a full browser
    it("should be available in Server Components", async () => {
      const browser = await next.browser("/");
      expect(await browser.elementByCss("p").text()).toBe(
        "crypto is available"
      );
    });

    // In case you need to test the response object
    it("should be available in Route Handlers", async () => {
      const res = await next.fetch("/handler");
      const html = await res.text();
      expect(html).toContain("crypto is available");
    });
  }
);
