import { HttpMethod } from "@/hooks/useApi";


/**
 * Checks if the client and server clocks are in sync within an acceptable drift.
 * 
 * @param maxAllowedDriftMs - Max allowed drift in milliseconds (default is 60000ms = 60 seconds)
 * @returns A tuple: [isSynced: boolean, message: string?]
 */

type TimeSyncResponse = {
  serverTime: string;
};
export async function checkTimeSync(
  fetchFromBackend: (endpoint: string, method: HttpMethod) => Promise<TimeSyncResponse>,
  maxAllowedDriftMs: number = 60000
): Promise<[boolean, string?]> {
  console.log("fetch call from the check time sync")
  try {
    const resp = await fetchFromBackend('/timesync', "GET") as TimeSyncResponse;
    console.log("server time response", resp)
    const clientTime = Date.now();
    const serverTimestamp = new Date(resp.serverTime).getTime();
    console.log('Server time from response:', resp.serverTime);
console.log('Parsed timestamp:', new Date(resp.serverTime).getTime());

    const drift = Math.abs(clientTime - serverTimestamp); // in milliseconds

    if (drift <= maxAllowedDriftMs) {
      return [true];
    } else {
      const driftInSeconds = Math.floor(drift / 1000);
      return [false, `Clock drift is ${driftInSeconds}s, which exceeds ${maxAllowedDriftMs / 1000}s limit`];
    }

  } catch (err: any) {
    return [false, `Time sync check failed: ${err.message}`];
  }
}
