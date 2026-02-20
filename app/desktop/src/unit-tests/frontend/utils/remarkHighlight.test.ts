import { remarkHighlight } from "../../../frontend/utils/remarkHighlight";

jest.mock("unist-util-visit", () => ({
  visit: (
    tree: any,
    type: string,
    cb: (node: any, index?: number, parent?: any) => void,
  ) => {
    const walk = (node: any, parent?: any) => {
      if (!node) return;
      if (node.type === type) {
        const index = parent?.children
          ? parent.children.indexOf(node)
          : undefined;
        cb(node, index, parent);
      }
      if (node.children) {
        node.children.forEach((child: any) => walk(child, node));
      }
    };
    walk(tree, undefined);
  },
}));

describe("remarkHighlight", () => {
  it("wraps ==highlighted== text in mark nodes", () => {
    const tree = {
      type: "root",
      children: [{ type: "text", value: "Hello ==world==!" }],
    };

    remarkHighlight()(tree);

    expect(tree.children).toHaveLength(3);
    expect(tree.children[0]).toEqual({ type: "text", value: "Hello " });
    expect(tree.children[1]).toEqual({
      type: "highlight",
      data: { hName: "mark" },
      children: [{ type: "text", value: "world" }],
    });
    expect(tree.children[2]).toEqual({ type: "text", value: "!" });
  });

  it("ignores inline code parents", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "inlineCode",
          children: [{ type: "text", value: "==skip==" }],
        },
      ],
    };

    remarkHighlight()(tree);

    const inline = tree.children[0];
    expect(inline.children).toHaveLength(1);
    expect(inline.children[0]).toEqual({ type: "text", value: "==skip==" });
  });

  it("ignores unmatched == delimiters", () => {
    const tree = {
      type: "root",
      children: [{ type: "text", value: "==oops" }],
    };

    remarkHighlight()(tree);

    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]).toEqual({ type: "text", value: "==oops" });
  });
});
