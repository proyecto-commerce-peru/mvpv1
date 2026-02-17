import { computeAvailable } from "@/lib/server/commerce/reservations";

describe("commerce stock reservation", () => {
  it("computes available stock correctly", () => {
    expect(computeAvailable(10, 4)).toBe(6);
  });

  it("allows negative availability when reserved exceeds on-hand", () => {
    expect(computeAvailable(2, 5)).toBe(-3);
  });
});
