/** Valid port range for gateway rules. */
export const GATEWAY_PORT_MIN = 1;
export const GATEWAY_PORT_MAX = 65535;

export function isValidGatewayPort(port: number): boolean {
  return (
    Number.isInteger(port) &&
    port >= GATEWAY_PORT_MIN &&
    port <= GATEWAY_PORT_MAX
  );
}

export function clampGatewayPort(port: number): number {
  return Math.min(
    GATEWAY_PORT_MAX,
    Math.max(GATEWAY_PORT_MIN, Math.floor(port))
  );
}
