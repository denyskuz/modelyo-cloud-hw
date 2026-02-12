import {
  isValidGatewayPort,
  clampGatewayPort,
  GATEWAY_PORT_MIN,
  GATEWAY_PORT_MAX,
} from "@/lib/validation";

describe("Gateway port validation", () => {
  it("accepts ports 1–65535", () => {
    expect(isValidGatewayPort(GATEWAY_PORT_MIN)).toBe(true);
    expect(isValidGatewayPort(443)).toBe(true);
    expect(isValidGatewayPort(GATEWAY_PORT_MAX)).toBe(true);
  });

  it("rejects port 0 and below", () => {
    expect(isValidGatewayPort(0)).toBe(false);
    expect(isValidGatewayPort(-1)).toBe(false);
  });

  it("rejects port above 65535", () => {
    expect(isValidGatewayPort(GATEWAY_PORT_MAX + 1)).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(isValidGatewayPort(1.5)).toBe(false);
    expect(isValidGatewayPort(NaN)).toBe(false);
  });

  it("clampGatewayPort clamps to valid range", () => {
    expect(clampGatewayPort(GATEWAY_PORT_MIN - 1)).toBe(GATEWAY_PORT_MIN);
    expect(clampGatewayPort(443)).toBe(443);
    expect(clampGatewayPort(GATEWAY_PORT_MAX + 10_000)).toBe(GATEWAY_PORT_MAX);
    expect(clampGatewayPort(GATEWAY_PORT_MIN + 0.9)).toBe(GATEWAY_PORT_MIN);
  });
});
