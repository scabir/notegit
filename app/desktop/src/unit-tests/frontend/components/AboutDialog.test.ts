import React from "react";
import { renderToString } from "react-dom/server";
import { AboutDialog } from "../../../frontend/components/AboutDialog";
import { APP_INFO } from "../../../frontend/components/AboutDialog/constants";

describe("AboutDialog", () => {
  it("renders app info and version", () => {
    const html = renderToString(
      React.createElement(AboutDialog, {
        open: true,
        onClose: jest.fn(),
      }),
    );

    expect(html).toContain("About");
    expect(html).toContain(APP_INFO.name);
    expect(html).toContain("Version");
    expect(html).toContain(APP_INFO.version);
    expect(html).toContain(APP_INFO.description);
  });
});
