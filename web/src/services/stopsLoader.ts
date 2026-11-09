import type { Stop } from "@/lib/geo/coverage";
import { fetchStops, StopsLoadStatus } from "@/services/stopsService";

// Starts loading the stops. The returned function makes the load ignore a result that has not arrived yet.
export function startStopsLoad(
  onStopsLoaded: (stops: Stop[]) => void,
  onLoadStatusChange: (status: StopsLoadStatus) => void,
): () => void {
  let isIgnored = false;

  function handleStopsLoaded(stops: Stop[]) {
    if (isIgnored) return;
    onStopsLoaded(stops);
    onLoadStatusChange(StopsLoadStatus.ready);
  }
  function handleStopsError(error: unknown) {
    if (isIgnored) return;
    console.error(error);
    onLoadStatusChange(StopsLoadStatus.error);
  }
  function ignoreResult() {
    isIgnored = true;
  }

  fetchStops().then(handleStopsLoaded).catch(handleStopsError);
  return ignoreResult;
}
