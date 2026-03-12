// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProductsClient from "@/app/admin/products/products-client";

type MockResponse = {
  status: number;
  body?: unknown;
};

function mockFetchSequence(responses: MockResponse[]) {
  const fetchMock = vi.fn();
  responses.forEach((response) => {
    fetchMock.mockResolvedValueOnce({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.body ?? {},
    });
  });
  global.fetch = fetchMock as typeof global.fetch;
  return fetchMock;
}

const baseProduct = {
  id: "prod-1",
  title: "Sample Product",
  description: null,
  status: "ACTIVE",
  handle: "sample-product",
  coverImageUrl: null,
  currencyCode: "PEN",
  price: 10,
  sku: "SKU-1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("ProductsClient", () => {
  it("renders empty state", () => {
    render(<ProductsClient initialProducts={[]} />);
    expect(
      screen.getByText("No products yet. Create your first listing.")
    ).toBeInTheDocument();
  });

  it("renders product rows", () => {
    render(<ProductsClient initialProducts={[baseProduct]} />);
    expect(screen.getByText("Sample Product")).toBeInTheDocument();
    expect(screen.getByText("SKU-1")).toBeInTheDocument();
  });

  it("creates a product from the dialog", async () => {
    mockFetchSequence([
      {
        status: 201,
        body: {
          ...baseProduct,
          id: "prod-2",
          title: "New Product",
          handle: "new-product",
          price: 15,
        },
      },
      {
        status: 200,
        body: {
          items: [
            {
              ...baseProduct,
              id: "prod-2",
              title: "New Product",
              handle: "new-product",
              price: 15,
            },
          ],
        },
      },
    ]);

    render(<ProductsClient initialProducts={[]} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /new product/i }));
    await user.type(screen.getByLabelText("Title"), "New Product");
    await user.type(screen.getByLabelText("Handle"), "new-product");
    await user.type(screen.getByLabelText("Price"), "15");

    await user.click(screen.getByRole("button", { name: /save product/i }));

    await waitFor(() => {
      expect(screen.getByText("New Product")).toBeInTheDocument();
    });
  });

  it("shows validation errors before submit", async () => {
    render(<ProductsClient initialProducts={[]} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /new product/i }));
    await user.click(screen.getByRole("button", { name: /save product/i }));

    expect(screen.getByText("Fix the highlighted fields.")).toBeInTheDocument();
  });
});
