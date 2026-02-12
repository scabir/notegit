import React from "react";
import { act, create } from "react-test-renderer";
import mermaid from "mermaid";
import { MermaidDiagram } from "../../../frontend/components/MermaidDiagram";

jest.mock("mermaid", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn(),
  },
}));

const mockedMermaid = mermaid as unknown as {
  initialize: jest.Mock;
  render: jest.Mock;
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const renderDiagram = async (code: string, isDark: boolean) => {
  let renderer: ReturnType<typeof create> | null = null;

  await act(async () => {
    renderer = create(React.createElement(MermaidDiagram, { code, isDark }));
  });

  await act(async () => {
    await flushPromises();
  });

  return renderer!;
};

const flattenText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flattenText).join("");
  return node.children ? node.children.map(flattenText).join("") : "";
};

describe("MermaidDiagram", () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation((message, ...args) => {
      if (
        typeof message === "string" &&
        message.includes("Function components cannot be given refs")
      ) {
        return;
      }
      originalConsoleError(message, ...args);
    });
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    mockedMermaid.initialize.mockClear();
    mockedMermaid.render.mockReset();
    mockedMermaid.render.mockResolvedValue({
      svg: "<svg></svg>",
      bindFunctions: jest.fn(),
    });
  });

  it("initializes mermaid with light theme and renders diagram", async () => {
    const code = "graph TD; A-->B";

    await renderDiagram(code, false);

    expect(mockedMermaid.initialize).toHaveBeenCalledWith({
      startOnLoad: false,
      theme: "default",
    });
    expect(mockedMermaid.render).toHaveBeenCalledWith(expect.any(String), code);
  });

  it("initializes mermaid with dark theme", async () => {
    await renderDiagram("graph TD; A-->B", true);

    expect(mockedMermaid.initialize).toHaveBeenCalledWith({
      startOnLoad: false,
      theme: "dark",
    });
  });

  it("shows error output when render fails", async () => {
    const code = "graph TD; A-->B";
    mockedMermaid.render.mockRejectedValueOnce(new Error("boom"));

    const renderer = await renderDiagram(code, false);

    const text = flattenText(renderer.toJSON());
    expect(text).toContain("Mermaid render error");
    expect(text).toContain("boom");

    const pre = renderer.root.findByType("pre");
    expect(pre.children.join("")).toContain(code);
  });
});
