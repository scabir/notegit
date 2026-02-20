import { confirmProfileSwitch } from "../../../frontend/utils/profileSwitch";

describe("SettingsDialog", () => {
  it("requests confirmation before switching profiles", () => {
    const confirmFn = jest.fn().mockReturnValue(true);

    const result = confirmProfileSwitch("My Profile", confirmFn);

    expect(confirmFn).toHaveBeenCalledWith(
      'Switch to "My Profile"? The app will restart.',
    );
    expect(result).toBe(true);
  });

  it("uses a fallback label when profile name is empty", () => {
    const confirmFn = jest.fn().mockReturnValue(false);

    const result = confirmProfileSwitch(" ", confirmFn);

    expect(confirmFn).toHaveBeenCalledWith(
      'Switch to "this profile"? The app will restart.',
    );
    expect(result).toBe(false);
  });
});
