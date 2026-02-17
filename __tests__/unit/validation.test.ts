import { expectEmail, expectPassword, expectObject } from "@/lib/server/validation";

describe("validation helpers", () => {
  it("validates email", () => {
    const input = expectObject({ email: "USER@EXAMPLE.COM" });
    expect(expectEmail(input)).toBe("user@example.com");
  });

  it("rejects weak password", () => {
    const input = expectObject({ password: "weakpass" });
    expect(() => expectPassword(input)).toThrow("uppercase, lowercase and number");
  });
});