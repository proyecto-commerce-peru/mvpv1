import { toUserDto } from "@/lib/server/users/dto";

describe("user dto", () => {
  it("maps user fields and omits sensitive data", () => {
    const dto = toUserDto({
      id: "u1",
      tenant_id: "t1",
      email: "a@example.com",
      status: "ACTIVE",
      email_verified_at: null,
      invited_by_user_id: null,
      invited_at: null,
      last_login_at: null,
      metadata: null,
      created_at: new Date("2026-01-01T00:00:00Z"),
      updated_at: new Date("2026-01-01T00:00:00Z"),
      deleted_at: null,
      UserProfile: [
        {
          id: "p1",
          tenant_id: "t1",
          user_id: "u1",
          full_name: "Test User",
          phone: null,
          avatar_url: null,
          locale: "es-PE",
          timezone: "America/Lima",
          metadata: null,
          created_at: new Date("2026-01-01T00:00:00Z"),
          updated_at: new Date("2026-01-01T00:00:00Z"),
        },
      ],
    });

    expect(dto).toEqual(
      expect.objectContaining({
        id: "u1",
        email: "a@example.com",
        profile: expect.objectContaining({
          full_name: "Test User",
        }),
      }),
    );

    expect((dto as Record<string, unknown>).password_hash).toBeUndefined();
    expect((dto as Record<string, unknown>).token_hash).toBeUndefined();
  });
});