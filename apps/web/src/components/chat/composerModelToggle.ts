import type { ModelSelection, ProviderInstanceId } from "@t3tools/contracts";
import { normalizeModelSlug } from "@t3tools/shared/model";
import { isProviderInstancePickerReady, type ProviderInstanceEntry } from "../../providerInstances";

export function resolveComposerModelToggle(input: {
  provider: ProviderInstanceEntry["driverKind"];
  instanceId: ProviderInstanceId;
  model: string;
  entries: ReadonlyArray<ProviderInstanceEntry>;
  getModelDisabledReason: (instanceId: ProviderInstanceId, model: string) => string | null;
}): ModelSelection | null {
  const fromSol =
    input.provider === "codex" && normalizeModelSlug(input.model, input.provider) === "gpt-6.1-sol";
  const driver = fromSol ? "claudeAgent" : "codex";
  const model = fromSol ? "claude-opus-5-5" : "gpt-6.1-sol";
  const candidates = input.entries.filter(
    (entry) =>
      entry.driverKind === driver &&
      isProviderInstancePickerReady(entry) &&
      entry.models.some((candidate) => candidate.slug === model) &&
      input.getModelDisabledReason(entry.instanceId, model) === null,
  );
  const entry =
    candidates.find((candidate) => candidate.instanceId === input.instanceId) ??
    candidates.find((candidate) => candidate.isDefault) ??
    candidates[0];
  return entry ? { instanceId: entry.instanceId, model } : null;
}
